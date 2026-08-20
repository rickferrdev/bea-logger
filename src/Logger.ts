import formatters from "./formatters/formatters";
import Handler from "./Handler";
import transports from "./transports/transports";
import type {
	CreateLoggerOptions,
	LogContext,
	Logger as LoggerContract,
	LogLevel,
} from "./types";

export default class Logger implements LoggerContract {
	protected opts: CreateLoggerOptions = {};
	protected handler: Handler;

	constructor({
		formatter = formatters.pretty,
		transport = transports.console,
		transportFailure = "throw",
		onTransportError = () => {},
		context = {},
	}: CreateLoggerOptions = {}) {
		this.opts.formatter = formatter;
		this.opts.transport = transport;
		this.opts.transportFailure = transportFailure;
		this.opts.context = context;
		this.opts.onTransportError = onTransportError;
		this.handler = new Handler({
			formatter: this.opts.formatter,
			onTransportError: this.opts.onTransportError,
			transportFailure: this.opts.transportFailure,
			transports: Array.isArray(transport) ? [...transport] : [transport],
		});
	}

	info(message: string, context?: LogContext): Promise<void> {
		return this.log("info", message, context ?? this.opts.context);
	}

	warn(message: string, context?: LogContext): Promise<void> {
		return this.log("warn", message, context);
	}

	error(message: string, context?: LogContext): Promise<void> {
		return this.log("error", message, context);
	}

	debug(message: string, context?: LogContext): Promise<void> {
		return this.log("debug", message, context);
	}

	fatal(message: string, context?: LogContext): Promise<void> {
		return this.log("fatal", message, context);
	}

	protected log(level: LogLevel, message: string, context?: LogContext) {
		return this.handler.register({
			level,
			message,
			timestamp: new Date().toISOString(),
			context: {
				...this.opts.context,
				...context,
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
