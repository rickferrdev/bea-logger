import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { PassThrough, Writable } from "node:stream";
import * as bea from "./index";

test("exports the Logger class", async () => {
	const entries: string[] = [];
	const logger = new bea.Logger({
		formatter: bea.format.simple,
		transport: (_data, formatted) => {
			entries.push(formatted);
		},
	});

	await logger.info("Ready");
	expect(entries).toEqual(["info: Ready"]);
});

test("exposes the complete Logger contract", () => {
	const log = async () => {};
	const logger: bea.Logger = {
		info: log,
		warn: log,
		error: log,
		fatal: log,
		debug: log,
		child: () => logger,
	};

	expect(logger.info).toBe(log);
});

describe("structured context", () => {
	test("uses pretty directly or as a configured formatter", () => {
		const data: bea.LogData = {
			level: "info",
			message: "Ready",
			timestamp: "2026-08-16T00:00:00.000Z",
		};

		const direct = bea.format.pretty(data);
		const configured = bea.format.pretty({ palette: "classic" })(data);

		expect(direct).toContain("Ready");
		expect(configured).toBe(direct);
	});

	test("supports every built-in pretty palette", () => {
		const data: bea.LogData = {
			level: "info",
			message: "Ready",
			timestamp: "2026-08-16T00:00:00.000Z",
		};

		for (const palette of [
			"classic",
			"vibrant",
			"soft",
			"monochrome",
		] as const) {
			expect(bea.format.pretty({ palette })(data)).toContain("Ready");
		}
	});

	test("preserves formatter output when context is omitted", () => {
		const data: bea.LogData = {
			level: "info",
			message: "Ready",
			timestamp: "2026-08-16T00:00:00.000Z",
		};

		expect(bea.format.simple(data)).toBe("info: Ready");
		expect(bea.format.json(data)).toBe(JSON.stringify(data));
	});

	test("passes context to formatters and transports", async () => {
		const entries: Array<{ data: Readonly<bea.LogData>; formatted: string }> =
			[];
		const logger = bea.createLogger({
			formatter: bea.format.simple,
			transport: (data, formatted) => {
				entries.push({ data, formatted });
			},
		});

		await logger.info("user created", { userId: "42", role: "admin" });

		expect(entries).toHaveLength(1);
		expect(entries[0]?.data.context).toEqual({ userId: "42", role: "admin" });
		expect(entries[0]?.formatted).toBe(
			"info: user created userId=42 role=admin",
		);
	});

	test("supports custom pretty color overrides", () => {
		const formatter = bea.format.custom({
			palette: "vibrant",
			pretty: { debug: { context: { key: ["bold"] } } },
		});
		const output = formatter(
			{ level: "debug", message: "cache miss", timestamp: "ignored" },
			{ key: "user:42" },
		);

		expect(output).toContain("cache miss");
		expect(output).toContain("key");
		expect(output).toContain("user:42");
	});

	test("serializes rich values and circular references safely", () => {
		const circular: Record<string, bea.LogValue> = {};
		circular.self = circular;
		const error = new Error("boom");
		const data: bea.LogData = {
			level: "error",
			message: "failed",
			timestamp: "2026-08-17T00:00:00.000Z",
			context: { circular, error, date: new Date("2026-08-17T00:00:00.000Z") },
		};

		const parsed = JSON.parse(bea.format.json(data) as string);
		expect(parsed.context.circular.self).toBe("[Circular]");
		expect(parsed.context.error.message).toBe("boom");
		expect(parsed.context.date).toBe("2026-08-17T00:00:00.000Z");
		expect(bea.format.simple(data)).toContain('circular={"self":"[Circular]"}');
	});
});

describe("redaction", () => {
	test("redacts sensitive keys recursively without mutating context", async () => {
		const context = {
			username: "bea",
			password: "secret",
			credentials: {
				token: "abc123",
			},
			sessions: [{ authorization: "Bearer secret" }],
		};
		let received: Readonly<bea.LogData> | undefined;
		let output = "";
		const logger = bea.createLogger({
			formatter: bea.format.json,
			redact: {
				paths: ["password", "token", "authorization"],
				censor: "***",
			},
			transport: (data, formatted) => {
				received = data;
				output = formatted;
			},
		});

		await logger.info("Login", context);

		expect(received?.context).toEqual({
			username: "bea",
			password: "***",
			credentials: { token: "***" },
			sessions: [{ authorization: "***" }],
		});
		expect(JSON.parse(output).context).toEqual(received?.context);
		expect(context.password).toBe("secret");
		expect(context.credentials.token).toBe("abc123");
	});

	test("matches key names case-insensitively with the default censor", async () => {
		let received: Readonly<bea.LogData> | undefined;
		const logger = new bea.Logger({
			redact: ["authorization"],
			transport: (data) => {
				received = data;
			},
		});

		await logger.info("Request", { Authorization: "Bearer secret" });

		expect(received?.context?.Authorization).toBe("[REDACTED]");
	});
});

describe("level filtering", () => {
	test("only dispachetes entries at or above the configured level", async () => {
		const entries: bea.LogLevel[] = [];

		const logger = new bea.Logger({
			level: "warn",
			transport: (data) => {
				entries.push(data.level);
			},
		});

		await logger.debug("debug");
		await logger.info("info");
		await logger.warn("warn");
		await logger.error("error");
		await logger.fatal("fatal");

		expect(entries).toEqual(["warn", "error", "fatal"]);
	});

	test("supports disabling all logs", async () => {
		let called = false;

		const logger = new bea.Logger({
			level: "silent",
			transport: () => {
				called = true;
			},
		});

		await logger.fatal("ignored");

		expect(called).toBe(false);
	});

	test("does not format filtered entries", async () => {
		let formatted = false;

		const logger = new bea.Logger({
			level: "error",
			formatter: () => {
				formatted = true;
				return "formatted";
			},
		});

		await logger.info("ignored");

		expect(formatted).toBe(false);
	});
});

describe("asynchronous transports", () => {
	test("awaits transports in registration order", async () => {
		const events: string[] = [];
		const first: bea.Transport = async () => {
			events.push("first:start");
			await Promise.resolve();
			events.push("first:end");
		};

		const secound: bea.Transport = () => {
			events.push("second");
		};
		const logger = bea.createLogger({
			formatter: bea.format.simple,
			transport: [first, secound],
		});

		const pending = logger.info("Ready");
		expect(pending).toBeInstanceOf(Promise);
		expect(events).toEqual(["first:start"]);

		await pending;
		expect(events).toEqual(["first:start", "first:end", "second"]);
	});

	test("propagates rejection and stops later transports", async () => {
		const events: string[] = [];
		const failure = new Error("delivery failed");
		const failing: bea.Transport = async () => {
			throw failure;
		};

		const later: bea.Transport = () => {
			events.push("later");
		};

		const logger = bea.createLogger({ transport: [failing, later] });

		expect(logger.error("Unavailable")).rejects.toBe(failure);
		expect(events).toEqual([]);
	});

	test("reports a transport error and continues when configured", async () => {
		const failure = new Error("delivery failed");
		const events: string[] = [];
		const logger = bea.createLogger({
			formatter: bea.format.simple,
			transport: [
				async () => {
					throw failure;
				},
				() => {
					events.push("fallback");
				},
			],
			transportFailure: "continue",
			onTransportError: async ({ error, transportIndex, formatted }) => {
				await Promise.resolve();
				expect(error).toBe(failure);
				expect(transportIndex).toBe(0);
				expect(formatted).toBe("error: Unavailable");
				events.push("reported");
			},
		});

		await logger.error("Unavailable");
		expect(events).toEqual(["reported", "fallback"]);
	});

	test("uses a fallback transport after preserving the original error", async () => {
		const failure = "offline";
		const events: unknown[] = [];
		const logger = bea.createLogger({
			formatter: bea.format.simple,
			transport: bea.transports.fallback({
				transport: async () => {
					throw failure;
				},
				onError: async (error) => {
					await Promise.resolve();
					events.push(error);
				},
				fallback: (_data, formatted) => {
					events.push(formatted);
				},
			}),
		});

		await logger.warn("Retrying");
		expect(events).toEqual([failure, "warn: Retrying"]);
	});

	test("awaits asynchronous formatters before transport", async () => {
		const entries: string[] = [];
		const logger = bea.createLogger({
			formatter: async (data) => {
				await Promise.resolve();
				return `async:${data.message}`;
			},
			transport: (_data, formatted) => {
				entries.push(formatted);
			},
		});

		await logger.info("ready");
		expect(entries).toEqual(["async:ready"]);
	});
});

describe("file transport", () => {
	test("awaits append and supports a transport-specific formatter", async () => {
		const directory = await mkdtemp(join(tmpdir(), "bea-logger-"));
		const filename = join(directory, "app.log");
		try {
			const logger = bea.createLogger({
				formatter: bea.format.simple,
				transport: bea.transports.file({
					filename,
					eol: "\r\n",
					formatter: async (data) => JSON.stringify({ message: data.message }),
				}),
			});

			await logger.info("saved");
			expect(await readFile(filename, "utf8")).toBe('{"message":"saved"}\r\n');
		} finally {
			await rm(directory, { recursive: true, force: true });
		}
	});
});

describe("stream transport", () => {
	test("awaits writes and appends the configured line ending", async () => {
		const output = new PassThrough();
		let written = "";
		output.setEncoding("utf8");
		output.on("data", (chunk: string) => {
			written += chunk;
		});
		const logger = bea.createLogger({
			formatter: bea.format.simple,
			transport: bea.transports.stream({ stream: output, eol: "\r\n" }),
		});

		await logger.info("streamed");
		expect(written).toBe("info: streamed\r\n");
	});

	test("propagates write errors", async () => {
		const failure = new Error("stream unavailable");
		const output = new Writable({
			write(_chunk, _encoding, callback) {
				callback(failure);
			},
		});
		output.on("error", () => {});
		const logger = bea.createLogger({
			transport: bea.transports.stream({ stream: output }),
		});

		await expect(logger.error("failed")).rejects.toBe(failure);
	});
});
