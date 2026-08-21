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

export const vibrant: PaletteColors = createPalette(
	{
		info: "cyan",
		warn: "yellow",
		error: "red",
		fatal: "magenta",
		debug: "green",
	},
	["bold"],
	["white"],
);

export const soft: PaletteColors = createPalette(
	{
		info: "blue",
		warn: "yellow",
		error: "red",
		fatal: "magenta",
		debug: "cyan",
	},
	["dim"],
	["gray"],
);

export const monochrome: PaletteColors = createPalette(
	{
		info: "white",
		warn: "white",
		error: "white",
		fatal: "white",
		debug: "gray",
	},
	["bold"],
	["dim"],
);

export const palettes = {
	classic,
	vibrant,
	soft,
	monochrome,
};

export type PaletteName = keyof typeof palettes;

export type CustomFormatterOptions = {
	palette?: PaletteName;
	pretty?: LogColorOverrides;
};

function createPalette(
	levels: Record<LogLevel, InspectColor>,
	levelAccent: InspectColor[],
	contextColors: InspectColor[],
): PaletteColors {
	return Object.fromEntries(
		Object.entries(levels).map(([level, color]) => [
			level,
			{
				level: [color, ...levelAccent],
				brackets: ["dim"],
				message: [color],
				separator: ["dim"],
				context: {
					key: contextColors,
					value: contextColors,
					separator: ["dim"],
				},
			},
		]),
	) as PaletteColors;
}
