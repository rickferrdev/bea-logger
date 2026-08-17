import { appendFile } from "node:fs/promises";
import type { FileTransportOptions, LogData, Transport } from "./types";

export default {
	console: _console,
	file,
};

function _console(_data: Readonly<LogData>, formatted: string): void {
	console.log(formatted);
}

function file({
	filename,
	eol = "\n",
	formatter,
}: FileTransportOptions): Transport {
	return async (data, formatted) => {
		const output = formatter
			? await formatter(data, data.context)
			: formatted;
		await appendFile(filename, output + eol, "utf-8");
	};
}

export type { FileTransportOptions, Transport };
