import type { LogValue } from "./types";

export function appendContext(base: string, context: string[]): string {
	return context.length > 0 ? `${base} ${context.join(" ")}` : base;
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

export function stringifyLogData(value: unknown): string {
	return JSON.stringify(value, createJsonReplacer());
}

function createJsonReplacer(): (key: string, value: unknown) => unknown {
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
