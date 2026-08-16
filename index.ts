import { appendFileSync } from "node:fs";
import { type InspectColor, styleText } from "node:util";

type LogLevelType = "info" | "warn" | "error" | "fatal" | "debug";

/** Structured information produced for each log entry. */
export type LogData = {
	/** Severity assigned to the entry. */
	level: LogLevelType;
	/** Message supplied to the logger method. */
	message: string;
	/** Entry creation time as an ISO 8601 string. */
	timestamp: string;
};

/** Converts structured log data into its textual representation. */
export type Formatter = (data: LogData) => string;

/**
 * Sends a log entry to a destination.
 *
 * @param data The original structured entry.
 * @param formatted The entry rendered by the logger's formatter.
 */
export type Transport = (data: LogData, formatted: string) => void;

/** Built-in log formatters. */
export const format = {
	/** Produces a colorized, human-readable representation for terminals. */
	pretty,
	/** Includes the timestamp, level, and message. */
	verbose: ((data) =>
		`${data.timestamp} [${data.level}]: ${data.message}`) satisfies Formatter,
	/** Includes only the level and message. */
	simple: ((data) => `${data.level}: ${data.message}`) satisfies Formatter,
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
	LogLevelType,
	{
		level: InspectColor[];
		message: InspectColor[];
		separator: InspectColor[];
	}
>;

const logColors: LogColors = {
	info: {
		level: ["bgBlue", "white", "bold"],
		message: ["white"],
		separator: ["blue"],
	},
	warn: {
		level: ["bgYellow", "black", "bold"],
		message: ["yellow"],
		separator: ["yellow"],
	},
	error: {
		level: ["bgRed", "white", "bold"],
		message: ["red"],
		separator: ["red"],
	},
	fatal: {
		level: ["bgMagenta", "white", "bold"],
		message: ["magenta", "bold"],
		separator: ["magenta"],
	},
	debug: {
		level: ["bgGray", "white", "bold"],
		message: ["gray", "dim"],
		separator: ["gray"],
	},
};

/** Renders a log entry with colors associated with its severity. */
function pretty(data: LogData): string {
	const colors = logColors[data.level];
	const level = styleText(
		colors.level,
		`[${data.level.toUpperCase()}]`,
	);
	const separator = styleText(colors.separator, `: `);
	const message = styleText(colors.message, data.message);

	return `${level}${separator}${message}`;
}

/** Creates a synchronous, append-only file transport. */
function file({
	filename,
	formatter,
	eol = "\n",
}: FileTransportOptions): Transport {
	return (data: LogData, formatted: string) => {
		const output = formatter ? formatter(data) : formatted;
		appendFileSync(filename, output + eol, "utf-8");
	};
}

function levels(formatter: Formatter, transports: Transport[]) {
	function buildLogData(level: LogLevelType, message: string): LogData {
		return {
			level,
			message,
			timestamp: new Date().toISOString(),
		};
	}

	function handler(level: LogLevelType, message: string) {
		const log = buildLogData(level, message);
		const formatted = formatter(log);
		for (const transport of transports) {
			transport(log, formatted);
		}
	}

	return {
		info: (message: string) => {
			handler("info", message);
		},
		warn: (message: string) => {
			handler("warn", message);
		},
		error: (message: string) => {
			handler("error", message);
		},
		fatal: (message: string) => {
			handler("fatal", message);
		},
		debug: (message: string) => {
			handler("debug", message);
		},
	};
}

/** Options used to create a logger instance. */
type CreateLoggerOptions = {
	/** Formatter shared by transports without their own formatter. */
	formatter?: Formatter;
	/** One destination or a list of destinations for every log entry. */
	transport: Transport[] | Transport;
};

/**
 * Creates a logger with methods for each supported severity level.
 *
 * @example
 * ```ts
 * const logger = bea.createLogger({
 *   formatter: bea.format.verbose,
 *   transport: [bea.transports.console, bea.transports.file({ filename: "app.log" })],
 * });
 *
 * logger.info("Server started");
 * ```
 */
export function createLogger({
	transport: tp = transports.console,
	formatter = format.pretty,
}: CreateLoggerOptions) {
	return levels(formatter, Array.isArray(tp) ? tp : [tp]);
}
