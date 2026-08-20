import { mkdir } from "node:fs/promises";
import { PassThrough } from "node:stream";
import * as bea from "../index";

/**
 * Complete example of the Bea Logger API.
 *
 * Run from the project root:
 *   bun examples/complete.ts
 */

await mkdir("./logs", { recursive: true });

// Main logger: context, formatter, and multiple transports.
const logger = new bea.Logger({
	context: {
		application: "checkout-api",
		environment: "development",
	},
	formatter: bea.format.pretty,
	transport: [
		bea.transports.console,
		bea.transports.file({
			filename: "./logs/application.jsonl",
			formatter: bea.format.json,
		}),
	],
	transportFailure: "continue",
	onTransportError: ({ error, transportIndex, data }) => {
		console.error("Failed to deliver log", {
			error,
			transportIndex,
			level: data.level,
		});
	},
});

// Every log level accepts a message and optional context.
await logger.debug("Configuration loaded");
await logger.info("Server started", { host: "0.0.0.0", port: 8080 });
await logger.warn("Slow response", { durationMs: 950 });
await logger.error("Payment declined", {
	orderId: "order-42",
	error: new Error("Card declined"),
});
await logger.fatal("Application lost its database connection");

// A child inherits its parent's context and adds its own context.
const paymentLogger = logger.child({ module: "payments" });
const requestLogger = paymentLogger.child({ requestId: "req-123" });

await requestLogger.info("Payment created", {
	paymentId: "pay-456",
	amount: 199.9,
});

// Equivalent factory for cases that do not need child().
const factoryLogger = bea.createLogger({
	formatter: bea.format.simple,
	transport: bea.transports.console,
});
await factoryLogger.info("Logger created by the factory");

// Any Node.js Writable can receive logs through the stream transport.
const output = new PassThrough();
output.setEncoding("utf8");
output.on("data", (chunk: string) => {
	console.log("Stream received:", chunk.trimEnd());
});
const streamLogger = bea.createLogger({
	formatter: bea.format.simple,
	transport: bea.transports.stream({ stream: output }),
});
await streamLogger.info("Sent to a writable stream");

// Built-in formatters.
const sample: bea.LogData = {
	level: "info",
	message: "Formatting example",
	timestamp: new Date().toISOString(),
	context: { userId: "user-7" },
};

console.log(await bea.format.pretty(sample));
console.log(await bea.format.simple(sample));
console.log(await bea.format.verbose(sample));
console.log(await bea.format.json(sample));

// Formatter options remain available when a specific palette is needed.
const configuredPretty = bea.format.pretty({ palette: "classic" });
console.log(await configuredPretty(sample));

// Custom colors for the pretty formatter.
const coloredLogger = new bea.Logger({
	formatter: bea.format.custom({
		pretty: {
			info: {
				level: ["bgCyan", "black", "bold"],
				message: ["cyan"],
				context: { key: ["cyan", "bold"] },
			},
		},
	}),
});
await coloredLogger.info("Custom colors", { feature: "billing" });

// Custom synchronous or asynchronous formatter.
const formatter: bea.Formatter = async (data) => {
	await Promise.resolve();
	return `${data.timestamp} ${data.level.toUpperCase()} ${data.message}`;
};

// Custom synchronous or asynchronous transport.
const collected: Array<Readonly<bea.LogData>> = [];
const collectTransport: bea.Transport = async (data, formatted) => {
	await Promise.resolve();
	collected.push(data);
	console.log("Collected:", formatted);
};

const customLogger = new bea.Logger({
	formatter,
	transport: collectTransport,
});
await customLogger.info("Event sent to the custom transport");

// Fallback: tries the primary transport and uses another if it fails.
const unavailableTransport: bea.Transport = async () => {
	throw new Error("Remote service unavailable");
};

const resilientLogger = new bea.Logger({
	formatter: bea.format.simple,
	transport: bea.transports.fallback({
		transport: unavailableTransport,
		fallback: bea.transports.console,
		onError: (error) => {
			console.error("Primary transport failed; using console", error);
		},
	}),
});
await resilientLogger.warn("This message will be delivered by the fallback");

// Without await, handle a possible rejection explicitly.
void logger.info("Background processing").catch((error) => {
	console.error("Could not log the message", error);
});
