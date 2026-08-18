import type {
	CreateHandlerOptions,
	LogContext,
	LogData,
	Logger,
	LogLevel,
} from "./types";

export default function createHandler({
	formatter,
	onTransportError,
	transports,
	transportFailure,
}: CreateHandlerOptions): Logger {
	function buildLogData(
		level: LogLevel,
		message: string,
		timestamp: string,
		context?: LogContext,
	): LogData {
		return {
			level,
			message,
			timestamp,
			...(context === undefined ? {} : { context }),
		};
	}

	async function handler({ level, message, timestamp, context }: LogData) {
		const data = buildLogData(level, message, timestamp, context);
		const result = formatter(data, data.context);
		const formatted = typeof result === "string" ? result : await result;
		for (const [transportIndex, transport] of transports.entries()) {
			try {
				await transport(data, formatted);
			} catch (error) {
				await onTransportError({
					data,
					error,
					formatted,
					transport,
					transportIndex,
				});

				if (transportFailure === "throw") {
					throw error;
				}
			}
		}
	}

	return {
		info: (message: string, context?: LogContext) =>
			handler({
				level: "info",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		warn: (message: string, context?: LogContext) =>
			handler({
				level: "warn",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		error: (message: string, context?: LogContext) =>
			handler({
				level: "error",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		fatal: (message: string, context?: LogContext) =>
			handler({
				level: "fatal",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
		debug: (message: string, context?: LogContext) =>
			handler({
				level: "debug",
				message,
				context,
				timestamp: new Date().toISOString(),
			}),
	};
}
