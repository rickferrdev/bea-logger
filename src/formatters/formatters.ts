import { styleText } from "node:util";
import {
	type CustomFormatterOptions,
	classic,
	type LogColorOverrides,
	type PaletteColors,
	palettes,
} from "../colors/colors";
import type {
	Formatter,
	LogContext,
	LogData,
	PrettyFormatterOptions,
} from "../types";
import {
	appendContext,
	createJsonReplacer,
	formatContext,
	formatLogValue,
} from "../utils/utils";

export type PrettyFormatter = Formatter &
	((options?: PrettyFormatterOptions) => Formatter);

export default {
	verbose,
	json,
	simple,
	pretty,
	custom,
};

function verbose(data: LogData, context = data.context): string {
	return appendContext(
		`${data.timestamp} [${data.level}]: ${data.message}`,
		formatContext(context),
	);
}

function simple(data: LogData, context = data.context): string {
	return appendContext(
		`${data.level}: ${data.message}`,
		formatContext(context),
	);
}

function json(data: LogData): string {
	return JSON.stringify(data, createJsonReplacer());
}

function renderPalette(
	data: LogData,
	context: Readonly<LogContext> | undefined,
	palette: PaletteColors = classic,
): string {
	const format: string[] = [];
	const colors = palette[data.level];

	format.push(styleText(colors.brackets, "["));
	format.push(styleText(colors.level, `${data.level}`));
	format.push(styleText(colors.brackets, "]"));
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

function pretty(data: LogData, context?: Readonly<LogContext>): string;
function pretty(options?: PrettyFormatterOptions): Formatter;
function pretty(
	input: LogData | PrettyFormatterOptions = {},
	context?: Readonly<LogContext>,
): string | Formatter {
	if ("level" in input) {
		return renderPalette(input, context ?? input.context, palettes.classic);
	}

	const { palette: name = "classic" } = input;

	return (data: LogData, context = data.context) =>
		renderPalette(data, context, palettes[name]);
}

function custom({
	pretty: overrides = {},
}: CustomFormatterOptions = {}): Formatter {
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
		return renderPalette(data, context, colors);
	};
}

export type { CustomFormatterOptions, Formatter, LogColorOverrides };
