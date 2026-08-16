// import { describe, expect, test } from "bun:test";
// import { createLogger, format, type Transport } from "./index";

import { describe, expect, test } from "bun:test";
import * as bea from "./index";

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
