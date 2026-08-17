// import { describe, expect, test } from "bun:test";
// import { createLogger, format, type Transport } from "./index";

import { describe, expect, test } from "bun:test";
import * as bea from "./index";

describe("structured context", () => {
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
		const entries: Array<{ data: Readonly<bea.LogData>; formatted: string }> = [];
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
		expect(events).toEqual([])
	});
});
