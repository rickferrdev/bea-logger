import { randomUUID } from "node:crypto";
import * as bea from "./index";

const logger = new bea.Logger({
	redact: ["password"],
	context: {
		user: "rickferrdev",
		ID: randomUUID(),
	},
});

await logger.info("hi", {
	password: "1234",
});
