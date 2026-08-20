import type { InspectColor } from "node:util";
import type { LogLevel } from "../types";

export type PaletteColors = Record<
	LogLevel,
	{
		level: InspectColor[];
		brackets: InspectColor[];
		message: InspectColor[];
		separator: InspectColor[];
		context: {
			key: InspectColor[];
			value: InspectColor[];
			separator: InspectColor[];
		};
	}
>;

export type LogColorOverrides = {
	[level in LogLevel]?: Partial<Omit<PaletteColors[level], "context">> & {
		context?: Partial<PaletteColors[level]["context"]>;
	};
};

export type CustomFormatterOptions = { pretty?: LogColorOverrides };

export const classic: PaletteColors = {
	info: {
		level: ["blue", "bold"],
		brackets: ["dim"],
		message: ["blue"],
		separator: ["dim"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	warn: {
		level: ["yellow", "bold"],
		brackets: ["dim"],
		message: ["yellow"],
		separator: ["dim"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	error: {
		level: ["red", "bold"],
		brackets: ["dim"],
		message: ["red"],
		separator: ["dim"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	fatal: {
		level: ["magenta", "bold"],
		brackets: ["dim"],
		message: ["magenta"],
		separator: ["dim"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
	debug: {
		level: ["dim", "bold"],
		brackets: ["dim"],
		message: ["gray"],
		separator: ["dim"],
		context: {
			key: ["dim"],
			value: ["dim"],
			separator: ["dim"],
		},
	},
};

export const palettes = {
	classic,
};
