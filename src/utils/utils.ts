import type {
	LogContext,
	LogLevel,
	LogThreshold,
	LogValue,
	RedactOptions,
} from "../types";

export type NormalizedRedact = {
	keys: ReadonlySet<string>;
	censor: string;
};

export function appendContext(base: string, context: string[]): string {
	return context.length > 0 ? `${base} ${context.join(" ")}` : base;
}

export function formatContext(context?: Readonly<LogContext>): string[] {
	return Object.entries(context ?? {}).map(
		([key, value]) => `${key}=${formatLogValue(value)}`,
	);
}

export function formatLogValue(value: LogValue): string {
	if (typeof value === "string") return value;
	if (value instanceof Date) return value.toISOString();
	if (value instanceof Error)
		return value.stack ?? `${value.name}: ${value.message}`;
	if (value === undefined) return "undefined";
	if (value === null || typeof value !== "object") return String(value);
	try {
		return JSON.stringify(value, createJsonReplacer());
	} catch {
		return String(value);
	}
}

export function createJsonReplacer(): (key: string, value: unknown) => unknown {
	const seen = new WeakSet<object>();
	return (_key, value) => {
		if (value instanceof Error) {
			return { name: value.name, message: value.message, stack: value.stack };
		}
		if (typeof value === "object" && value !== null) {
			if (seen.has(value)) return "[Circular]";
			seen.add(value);
		}
		return value;
	};
}

export function normalizeRedact(
	options?: readonly string[] | RedactOptions,
): NormalizedRedact {
	const configured = options !== undefined && "paths" in options;
	const paths: readonly string[] = configured ? options.paths : (options ?? []);
	const censor = configured ? (options.censor ?? "[REDACTED]") : "[REDACTED]";

	return {
		keys: new Set(paths.map((path) => path.toLowerCase())),
		censor,
	};
}

export function redactContext(
	context: Readonly<LogContext>,
	options: NormalizedRedact,
): LogContext {
	return redactValue(context, options.keys, options.censor) as LogContext;
}

function redactValue(
	value: LogValue,
	sensitiveKeys: ReadonlySet<string>,
	censor: string,
	seen = new WeakMap<object, LogValue>(),
): LogValue {
	if (value === null || typeof value !== "object") return value;
	if (value instanceof Date || value instanceof Error) return value;

	const cached = seen.get(value);
	if (cached !== undefined) return cached;

	if (Array.isArray(value)) {
		const result: LogValue[] = [];
		seen.set(value, result);
		for (const item of value) {
			result.push(redactValue(item, sensitiveKeys, censor, seen));
		}
		return result;
	}

	const result: Record<string, LogValue> = {};
	seen.set(value, result);
	for (const [key, item] of Object.entries(value)) {
		result[key] = sensitiveKeys.has(key.toLowerCase())
			? censor
			: redactValue(item, sensitiveKeys, censor, seen);
	}
	return result;
}

const priorities: Record<LogThreshold, number> = {
	debug: 10,
	info: 20,
	warn: 30,
	error: 40,
	fatal: 50,
	silent: Number.POSITIVE_INFINITY,
};

export function isLevelEnabled(
	level: LogLevel,
	threshold: LogThreshold,
): boolean {
	return priorities[level] >= priorities[threshold];
}
