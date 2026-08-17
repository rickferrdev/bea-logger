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

export type Formatter = (
	data: LogData,
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

export type CreateLoggerOptions = {
	formatter?: Formatter;
	transport?: Transport | readonly Transport[];
};
