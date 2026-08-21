import type { CustomFormatterOptions } from "./src/colors/colors";
import type { PrettyFormatter } from "./src/formatters/formatters";
import formatters from "./src/formatters/formatters";
import LoggerClass from "./src/Logger";
import builtInTransports from "./src/transports/transports";
import type {
	CreateLoggerOptions,
	FallbackTransportOptions,
	FileTransportOptions,
	Formatter,
	Logger as LoggerContract,
	StreamTransportOptions,
	Transport,
} from "./src/types";

export type {
	CustomFormatterOptions,
	LogColorOverrides,
	PaletteName,
} from "./src/colors/colors";
export type {
	CreateLoggerOptions,
	FallbackTransportOptions,
	FileTransportOptions,
	Formatter,
	LogContext,
	LogData,
	LogLevel,
	LogValue,
	PrettyFormatterOptions,
	RedactOptions,
	StreamTransportOptions,
	Transport,
	TransportErrorContext,
	TransportErrorHandler,
	TransportFailure,
} from "./src/types";
/** Methods exposed by loggers. Compatible with the `Logger` type from v2.1.0. */
export interface Logger extends LoggerContract {}

/** Logger constructor. The `Logger` type remains compatible with v2.1.0. */
export const Logger = LoggerClass;

/** Built-in log formatters. */
export const format: Readonly<{
	custom: (options?: CustomFormatterOptions) => Formatter;
	pretty: PrettyFormatter;
	verbose: Formatter;
	simple: Formatter;
	json: Formatter;
}> = formatters;

/** Built-in destinations for log entries. */
export const transports: Readonly<{
	console: Transport;
	file: (options: FileTransportOptions) => Transport;
	fallback: (options: FallbackTransportOptions) => Transport;
	stream: (options: StreamTransportOptions) => Transport;
}> = builtInTransports;

/** Creates a logger that dispatches entries to its transports in order. */
export function createLogger({
	transport = transports.console,
	formatter = format.pretty,
	onTransportError = () => {},
	transportFailure = "throw",
	context = {},
	redact = [],
}: CreateLoggerOptions = {}): Logger {
	return new LoggerClass({
		formatter,
		transport,
		onTransportError,
		transportFailure,
		context,
		redact,
	});
}
