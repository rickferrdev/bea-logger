import { appendFileSync } from "node:fs";
import { type InspectColor, styleText } from "node:util";

/** Severity levels supported by Bea Logger. */
export type LogLevel = "info" | "warn" | "error" | "fatal" | "debug";

export type LogContext = Record<string, string>;

/** Structured information produced for each log entry. */
export type LogData = {
	/** Severity assigned to the entry. */
	level: LogLevel;
	/** Message supplied to the logger method. */
	message: string;
	/** Entry creation time as an ISO 8601 string. */
	timestamp: string;
	/** Optional structured metadata attached to the entry. */
	context?: LogContext;
};

/** Converts structured log data into its textual representation. */
export type Formatter = (data: LogData, context?: LogContext) => string;

/**
 * Sends a log entry to a destination.
 * Transports may complete synchronously or return a promise.
 *
 * The logger awaits each transport in registration order. A rejected promise
 * is propagated by the logger method, and later transports are not executed.
 *
 * @param data A read-only view of the original structured entry.
 * @param formatted The entry rendered by the logger's formatter.
 * @returns Nothing for synchronous transports, or a promise that settles when
 * the asynchronous destination finishes processing the entry.
 */
export type Transport = (
	data: Readonly<LogData>,
	formatted: string,
) => void | Promise<void>;

/** Built-in log formatters. */
export const format = {
	custom,
	/** Produces a colorized, human-readable representation for terminals. */
	pretty: ((data: LogData, context?: LogContext) =>
		formatPretty(data, context)) satisfies Formatter,
	/** Includes the timestamp, level, and message. */
	verbose: ((data) =>
		`${data.timestamp} [${data.level}]: ${data.message}`) satisfies Formatter,
	/** Includes only the level and message. */
	simple: ((data: LogData, context?: LogContext) => {
		const contextFormat: string[] = [];
		for (const [key, value] of Object.entries(context ?? {})) {
			contextFormat.push(`${key}=${value}`);
		}
		return appendContext(`${data.level}: ${data.message}`, contextFormat);
	}) satisfies Formatter,
	/** Serializes the complete entry as JSON. */
	json: ((data) => JSON.stringify(data)) satisfies Formatter,
};

/** Built-in destinations for log entries. */
export const transports = {
	/** Writes the formatted entry to the standard console. */
	console: ((_, formatted) => {
		console.log(formatted);
	}) satisfies Transport,

	/** Creates a transport that appends entries to a file. */
	file,
};

/** Options accepted by the file transport. */
export type FileTransportOptions = {
	/** Path of the file that receives the log entries. */
	filename: string;
	/**
	 * Formatter used only by this transport.
	 * Uses the logger's already-formatted output when omitted.
	 */
	formatter?: Formatter;
	/** Line ending appended after each entry. Defaults to `"\n"`. */
	eol?: string;
};

type LogColors = Record<
	LogLevel,
	{
		level: InspectColor[];
		message: InspectColor[];
		separator: InspectColor[];
		context: {
			key: InspectColor[];
			value: InspectColor[];
			separator: InspectColor[];
		};
	}
>;

const defaultLogColors: LogColors = {
	info: {
		level: ["bgBlue", "white", "bold"],
		message: ["white"],
		separator: ["blue"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	warn: {
		level: ["bgYellow", "black", "bold"],
		message: ["yellow"],
		separator: ["yellow"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	error: {
		level: ["bgRed", "white", "bold"],
		message: ["red"],
		separator: ["red"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	fatal: {
		level: ["bgMagenta", "white", "bold"],
		message: ["magenta", "bold"],
		separator: ["magenta"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	debug: {
		level: ["bgGray", "white", "bold"],
		message: ["gray", "dim"],
		separator: ["gray"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
};

export type LogColorOverrides = {
	[level in LogLevel]?: Partial<Omit<LogColors[level], "context">> & {
		context?: Partial<LogColors[level]["context"]>;
	};
};

export type CustomFormatterOptions = {
	/** Per-level color overrides for the pretty formatter. */
	pretty?: LogColorOverrides;
};

/** Creates a pretty formatter with per-level color overrides. */
function custom({
	pretty: prettyCustom = {},
}: CustomFormatterOptions = {}): Formatter {
	return (data, context) => {
		const defaults = defaultLogColors[data.level];
		const overrides = prettyCustom[data.level];
		const colors = {
			...defaults,
			...overrides,
			context: {
				...defaults.context,
				...overrides?.context,
			},
		};

		return formatPretty(data, context, {
			...defaultLogColors,
			[data.level]: colors,
		});
	};
}

function appendContext(base: string, context: string[]): string {
	return context.length > 0 ? `${base} ${context.join(" ")}` : base;
}

/** Renders a log entry with colors associated with its severity. */
function formatPretty(
	data: LogData,
	context?: LogContext,
	logColors: LogColors = defaultLogColors,
): string {
	const format: string[] = [];
	const colors = logColors[data.level];

	format.push(styleText(colors.level, `[${data.level.toUpperCase()}]`));
	format.push(styleText(colors.separator, `: `));
	format.push(styleText(colors.message, data.message));

	const contextFormat: string[] = [];

	for (const [key, value] of Object.entries(context ?? {})) {
		contextFormat.push(
			`${styleText(colors.context.key, key)}${styleText(colors.context.separator, "=")}${styleText(colors.context.value, value)}`,
		);
	}

	return appendContext(format.join(""), contextFormat);
}

/** Creates a synchronous, append-only file transport. */
function file({
	filename,
	formatter,
	eol = "\n",
}: FileTransportOptions): Transport {
	return (data: LogData, formatted: string) => {
		const output = formatter ? formatter(data, data.context) : formatted;
		appendFileSync(filename, output + eol, "utf-8");
	};
}

function levels(formatter: Formatter, transports: Transport[]): Logger {
	function buildLogData(
		level: LogLevel,
		message: string,
		context?: LogContext,
	): LogData {
		return {
			level,
			message,
			timestamp: new Date().toISOString(),
			...(context === undefined ? {} : { context }),
		};
	}

	async function handler(
		level: LogLevel,
		message: string,
		context?: LogContext,
	) {
		const log = buildLogData(level, message, context);
		const formatted = formatter(log, context);
		for (const transport of transports) {
			await transport(log, formatted);
		}
	}

	return {
		info: (message: string, context?: LogContext) =>
			handler("info", message, context),
		warn: (message: string, context?: LogContext) =>
			handler("warn", message, context),
		error: (message: string, context?: LogContext) =>
			handler("error", message, context),
		fatal: (message: string, context?: LogContext) =>
			handler("fatal", message, context),
		debug: (message: string, context?: LogContext) =>
			handler("debug", message, context),
	};
}

/**
 * Logger methods available for each supported severity level.
 *
 * Every method resolves after all transports finish or rejects when a
 * transport fails.
 */
export type Logger = Record<
	LogLevel,
	(message: string, context?: LogContext) => Promise<void>
>;

/** Options used to create a logger instance. */
export type CreateLoggerOptions = {
	/** Formatter shared by transports without their own formatter. */
	formatter?: Formatter;
	/** One destination or a list of destinations for every log entry. */
	transport?: Transport[] | Transport;
};

/**
 * Creates a logger with methods for each supported severity level.
 * Entries are dispatched to every configured transport in registration order.
 * Each log method awaits its transports and propagates transport failures.
 *
 * @example
 * ```ts
 * const logger = bea.createLogger({
 *   formatter: bea.format.verbose,
 *   transport: [bea.transports.console, bea.transports.file({ filename: "app.log" })],
 * });
 *
 * await logger.info("Server started");
 * ```
 */
export function createLogger({
	transport: tp = transports.console,
	formatter = format.pretty,
}: CreateLoggerOptions = {}): Logger {
	return levels(formatter, Array.isArray(tp) ? tp : [tp]);
}
