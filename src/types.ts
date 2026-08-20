import type { palettes } from "./colors/colors";

/** Values accepted as structured log context. */
export type LogValue =
	| string
	| number
	| boolean
	| null
	| undefined
	| Error
	| Date
	| LogValue[]
	| { [key: string]: LogValue };

export type LogLevel = "info" | "warn" | "error" | "fatal" | "debug";
export type LogContext = Record<string, LogValue>;

export type LogData = Readonly<{
	level: LogLevel;
	message: string;
	timestamp: string;
	context?: Readonly<LogContext>;
}>;

export type PrettyFormatterOptions = {
	palette?: keyof typeof palettes;
};

export type Formatter = (
	data: LogData,
	/**
	 * @deprecated Use `data.context`; this option will be removed in future major versions.
	 */
	context?: Readonly<LogContext>,
) => string | Promise<string>;

export type Transport = (
	data: Readonly<LogData>,
	formatted: string,
) => void | Promise<void>;

export type Logger = Record<
	LogLevel,
	(message: string, context?: LogContext) => Promise<void>
>;

export type FileTransportOptions = {
	filename: string;
	formatter?: Formatter;
	eol?: string;
};

export type TransportErrorContext = {
	error: unknown;
	transport: Transport;
	transportIndex: number;
	data: Readonly<LogData>;
	formatted: string;
};

export type TransportErrorHandler = (
	context: TransportErrorContext,
) => void | Promise<void>;

export type TransportFailure = "throw" | "continue";

export type FallbackTransportOptions = {
	transport: Transport;
	fallback: Transport;
	onError?: (error: unknown) => void | Promise<void>;
};

export type CreateLoggerOptions = {
	formatter?: Formatter;
	transport?: Transport | readonly Transport[];
	onTransportError?: TransportErrorHandler;
	transportFailure?: TransportFailure;
};

export type CreateHandlerOptions = {
	formatter: Formatter;
	transports: Transport[];
	onTransportError: TransportErrorHandler;
	transportFailure: TransportFailure;
};
