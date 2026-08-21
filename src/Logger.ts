import formatters from "./formatters/formatters";
import Handler from "./Handler";
import transports from "./transports/transports";
import type {
	CreateLoggerOptions,
	LogContext,
	LogData,
	Logger as LoggerContract,
} from "./types";
import { isLevelEnabled } from "./utils/utils";

export default class Logger implements LoggerContract {
	protected opts: CreateLoggerOptions = {};
	protected handler: Handler;

	constructor({
		formatter = formatters.pretty,
		transport = transports.console,
		transportFailure = "throw",
		onTransportError = () => {},
		context = {},
		redact = [],
		level = "debug",
	}: CreateLoggerOptions = {}) {
		this.opts.level = level;
		this.opts.formatter = formatter;
		this.opts.transport = transport;
		this.opts.transportFailure = transportFailure;
		this.opts.context = context;
		this.opts.redact = redact;
		this.opts.onTransportError = onTransportError;

		this.handler = new Handler({
			redact,
			formatter: this.opts.formatter,
			onTransportError: this.opts.onTransportError,
			transportFailure: this.opts.transportFailure,
			transports: Array.isArray(transport) ? [...transport] : [transport],
		});
	}

	info(message: string, context?: LogContext): Promise<void> {
		return this.log({ level: "info", message, context });
	}

	warn(message: string, context?: LogContext): Promise<void> {
		return this.log({ level: "warn", message, context });
	}

	error(message: string, context?: LogContext): Promise<void> {
		return this.log({ level: "error", message, context });
	}

	debug(message: string, context?: LogContext): Promise<void> {
		return this.log({ level: "debug", message, context });
	}

	fatal(message: string, context?: LogContext): Promise<void> {
		return this.log({ level: "fatal", message, context });
	}

	protected log(logData: Omit<LogData, "timestamp">): Promise<void> {
		const threshold = this.opts.level ?? "debug";

		if (!isLevelEnabled(logData.level, threshold)) return Promise.resolve();

		return this.handler.register({
			level: logData.level,
			message: logData.message,
			timestamp: new Date().toISOString(),
			context: {
				...this.opts.context,
				...logData.context,
			},
		});
	}

	child(context?: LogContext): Logger {
		return new Logger({
			...this.opts,
			context: {
				...this.opts.context,
				...context,
			},
		});
	}
}
