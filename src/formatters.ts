import { styleText } from "node:util";
import {
	classic,
	type CustomFormatterOptions,
	type LogColorOverrides,
	type PaletteColors,
} from "./colors";
import type { Formatter, LogContext, LogData } from "./types";
import { appendContext, formatLogValue, stringifyLogData } from "./utils";

export default {
	verbose,
	json,
	simple,
	pretty,
	custom,
};

function formatContext(context?: Readonly<LogContext>): string[] {
	return Object.entries(context ?? {}).map(
		([key, value]) => `${key}=${formatLogValue(value)}`,
	);
}

function verbose(data: LogData, context = data.context): string {
	return appendContext(
		`${data.timestamp} [${data.level}]: ${data.message}`,
		formatContext(context),
	);
}

function simple(data: LogData, context = data.context): string {
	return appendContext(`${data.level}: ${data.message}`, formatContext(context));
}

function json(data: LogData): string {
	return stringifyLogData(data);
}

function prettyWithPalette(
	data: LogData,
	context: Readonly<LogContext> | undefined,
	palette: PaletteColors,
): string {
		const format: string[] = [];
		const colors = palette[data.level];

		format.push(styleText(colors.level, `[${data.level.toUpperCase()}]`));
		format.push(styleText(colors.separator, `: `));
		format.push(styleText(colors.message, data.message));

		const contextFormat: string[] = [];

		for (const [key, value] of Object.entries(context ?? {})) {
			contextFormat.push(
				`${styleText(colors.context.key, key)}${styleText(colors.context.separator, "=")}${styleText(colors.context.value, formatLogValue(value))}`,
			);
		}

		return appendContext(format.join(""), contextFormat);
}

function pretty(data: LogData, context = data.context): string {
	return prettyWithPalette(data, context, classic);
}

function custom({ pretty: overrides = {} }: CustomFormatterOptions = {}): Formatter {
	return (data, context = data.context) => {
		const defaults = classic[data.level];
		const selected = overrides[data.level];
		const colors: PaletteColors = {
			...classic,
			[data.level]: {
				...defaults,
				...selected,
				context: { ...defaults.context, ...selected?.context },
			},
		};
		return prettyWithPalette(data, context, colors);
	};
}

export type { CustomFormatterOptions, Formatter, LogColorOverrides };
