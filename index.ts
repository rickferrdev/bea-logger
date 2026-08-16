export type LogData = {
	level: string;
	message: string;
	timestamp: string;
};

export type Formatter = (data: LogData) => string;
export type Transport = (data: LogData, formatted: string) => void;

export const format = {
	pretty: (data) => `[${data.level.toUpperCase()}]: ${data.message}`,
	simple: (data) => `${data.level}: ${data.message}`,
	verbose: (data) => `${data.timestamp} [${data.level}]: ${data.message}`,
} satisfies Record<string, Formatter>;

export const transports = {
	console: (_, formatted) => console.log(formatted),
} satisfies Record<string, Transport>;

function levels(formatter: Formatter, transports: Transport[]) {
	function buildLogData(level: string, message: string): LogData {
		return {
			level,
			message,
			timestamp: new Date().toISOString(),
		};
	}

	function handler(level: string, message: string) {
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

type CreateLoggerOptions = {
	formatter?: Formatter;
	transport: Transport[] | Transport;
};

export function createLogger({
	transport: tp = transports.console,
	formatter = format.pretty,
}: CreateLoggerOptions) {
	return levels(formatter, Array.isArray(tp) ? tp : [tp]);
}
