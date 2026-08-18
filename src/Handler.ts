import type {
	CreateHandlerOptions,
	Formatter,
	LogData,
	Transport,
	TransportErrorHandler,
	TransportFailure,
} from "./types";

export default class Handler {
	protected formatter: Formatter;
	protected onTransportError: TransportErrorHandler;
	protected transportFailure: TransportFailure;
	protected transports: Transport[];

	constructor({
		formatter,
		transports,
		onTransportError,
		transportFailure,
	}: CreateHandlerOptions) {
		this.formatter = formatter;
		this.onTransportError = onTransportError;
		this.transportFailure = transportFailure;
		this.transports = transports;
	}

	async register({
		level,
		message,
		timestamp,
		context,
	}: LogData): Promise<void> {
		const data: LogData = {
			level,
			message,
			timestamp,
			...(context === undefined ? {} : { context }),
		};

		const result = this.formatter(data, data.context);
		const formatted = typeof result === "string" ? result : await result;
		for (const [transportIndex, transport] of this.transports.entries()) {
			try {
				await transport(data, formatted);
			} catch (error) {
				await this.onTransportError({
					data,
					error,
					formatted,
					transport,
					transportIndex,
				});

				if (this.transportFailure === "throw") {
					throw error;
				}
			}
		}
	}
}
