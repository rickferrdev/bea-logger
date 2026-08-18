import type { InspectColor } from "node:util";
import type { LogLevel } from "../types";

export type PaletteColors = Record<
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

export type LogColorOverrides = {
	[level in LogLevel]?: Partial<Omit<PaletteColors[level], "context">> & {
		context?: Partial<PaletteColors[level]["context"]>;
	};
};

export type CustomFormatterOptions = { pretty?: LogColorOverrides };

export const classic: PaletteColors = {
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
