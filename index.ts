import type { CustomFormatterOptions } from "./src/colors";
import formatters from "./src/formatters";
import createHandler from "./src/handlers";
import builtInTransports from "./src/transports";
import type {
	CreateLoggerOptions,
	FallbackTransportOptions,
	FileTransportOptions,
	Formatter,
	Logger,
	Transport,
} from "./src/types";

export type {
	CustomFormatterOptions,
	LogColorOverrides,
} from "./src/colors";
export type {
	CreateLoggerOptions,
	FallbackTransportOptions,
	FileTransportOptions,
	Formatter,
	LogContext,
	LogData,
	Logger,
	LogLevel,
	LogValue,
	Transport,
	TransportErrorContext,
	TransportFailure,
} from "./src/types";

/** Built-in log formatters. */
export const format: Readonly<{
	custom: (options?: CustomFormatterOptions) => Formatter;
	pretty: Formatter;
	verbose: Formatter;
	simple: Formatter;
	json: Formatter;
}> = formatters;

/** Built-in destinations for log entries. */
export const transports: Readonly<{
	console: Transport;
	file: (options: FileTransportOptions) => Transport;
	fallback: (options: FallbackTransportOptions) => Transport;
}> = builtInTransports;

/** Creates a logger that dispatches entries to its transports in order. */
export function createLogger({
	transport = transports.console,
	formatter = format.pretty,
	onTransportError = () => {},
	transportFailure = "throw",
}: CreateLoggerOptions = {}): Logger {
	const selected = Array.isArray(transport) ? [...transport] : [transport];
	return createHandler({
		formatter,
		transports: selected,
		onTransportError,
		transportFailure,
	});
}
