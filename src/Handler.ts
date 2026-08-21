import type { CreateHandlerOptions, LogData } from "./types";
import { normalizeRedact, redactContext } from "./utils/utils";

export default class Handler {
	protected redact;

	constructor(protected opts: CreateHandlerOptions) {
		this.redact = normalizeRedact(opts.redact);
	}

	async register(logData: LogData): Promise<void> {
		const data: LogData = {
			level: logData.level,
			message: logData.message,
			timestamp: logData.timestamp,
			...(logData.context === undefined
				? {}
				: { context: redactContext(logData.context, this.redact) }),
		};

		const result = this.opts.formatter(data, data.context);
		const formatted = typeof result === "string" ? result : await result;
		for (const [transportIndex, transport] of this.opts.transports.entries()) {
			try {
				await transport(data, formatted);
			} catch (error) {
				await this.opts.onTransportError({
					data,
					error,
					formatted,
					transport,
					transportIndex,
				});

				if (this.opts.transportFailure === "throw") {
					throw error;
				}
			}
		}
	}
}
