import { appendFile } from "node:fs/promises";
import type {
	FallbackTransportOptions,
	FileTransportOptions,
	LogData,
	Transport,
} from "../types";

export default {
	console: _console,
	file,
	fallback,
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
		const output = formatter ? await formatter(data, data.context) : formatted;
		await appendFile(filename, output + eol, "utf-8");
	};
}

function fallback({
	transport,
	fallback,
	onError,
}: FallbackTransportOptions): Transport {
	return async (data, formatted) => {
		try {
			await transport(data, formatted);
		} catch (error) {
			await onError?.(error);
			await fallback(data, formatted);
		}
	};
}

export type { FileTransportOptions, Transport };
