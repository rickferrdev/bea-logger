# 🌸 Bea Logger

[![npm version](https://img.shields.io/npm/v/%40rickferrdevelop%2Fbea-logger?color=ff69b4&label=npm)](https://www.npmjs.com/package/@rickferrdevelop/bea-logger)
[![npm downloads](https://img.shields.io/npm/dm/%40rickferrdevelop%2Fbea-logger?color=8b5cf6)](https://www.npmjs.com/package/@rickferrdevelop/bea-logger)
[![Node.js](https://img.shields.io/node/v/%40rickferrdevelop%2Fbea-logger?color=339933)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/license-MIT-f5c2e7)](LICENSE)

> A small, flexible and transport-agnostic logger for TypeScript.

Bea keeps logging simple: `Logger` gives you a consistent starting point, a
formatter decides how a log looks, while one or more transports decide where
it goes.

> [!IMPORTANT]
> This package replaces [`@rickferrdev/bea-logger`](https://www.npmjs.com/package/@rickferrdev/bea-logger).
> New projects and upgrades should use `@rickferrdevelop/bea-logger`.

## 🌳 Contents

- 🌸 **Bea Logger**
  - [✨ Features](#-features)
  - [📦 Install](#-install)
    - [🌱 Migrating from the old package](#-migrating-from-the-old-package)
  - [🚀 Quick start](#-quick-start)
    - [🧱 Logger API](#-logger-api)
    - [⏳ Using logger methods with or without `await`](#-using-logger-methods-with-or-without-await)
  - [🎨 Choose a format](#-choose-a-format)
  - [🧩 Add structured context](#-add-structured-context)
    - [🔒 Redact sensitive fields](#-redact-sensitive-fields)
    - [🌈 Customize pretty-format colors](#-customize-pretty-format-colors)
  - [📝 Write logs to a file](#-write-logs-to-a-file)
  - [🌊 Write logs to a stream](#-write-logs-to-a-stream)
  - [🛠️ Make it yours](#️-make-it-yours)
    - [🌐 Asynchronous transports](#-asynchronous-transports)
    - [🛟 Handling transport failures](#-handling-transport-failures)
  - [📄 License](#-license)

## ✨ Features

- 🌸 Small, typed and transport-agnostic API.
- 🎨 Built-in pretty, simple, verbose and JSON formatters.
- 🧩 Structured context with safe error and circular-reference serialization.
- 🔒 Recursive redaction of sensitive context fields.
- 📝 Console, file and composable fallback transports.
- 🌐 Synchronous or asynchronous custom formatters and transports.
- 🛟 Configurable fail-fast or continue-on-error transport behavior.
- 📦 ESM package with bundled TypeScript declarations.

## 📦 Install

```bash
bun add @rickferrdevelop/bea-logger
# or: npm install @rickferrdevelop/bea-logger
```

Requires Node.js 20.12.0 or newer.

### 🌱 Migrating from the old package

Replace the previous package and update its import scope:

```bash
npm uninstall @rickferrdev/bea-logger
npm install @rickferrdevelop/bea-logger
```

## 🚀 Quick start

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.Logger({
  transport: bea.transports.console,
});

await logger.info("Server started");
await logger.warn("Response is taking longer than expected");
await logger.error("Could not connect to the database");
await logger.fatal("Application cannot continue");
await logger.debug("Cache miss for user:42");
```

```text
[INFO]: Server started
[WARN]: Response is taking longer than expected
[ERROR]: Could not connect to the database
```

### 🧱 Logger API

`Logger` is the recommended way to create and manage logger instances. It
provides the complete logger API and keeps the setup close to the instance
that will be used by the application.

```ts
import { Logger, format, transports } from "@rickferrdevelop/bea-logger";

const logger = new Logger({
  formatter: format.pretty,
  transport: transports.console,
});

await logger.info("Server started");
await logger.warn("Response is taking longer than expected");
await logger.error("Could not connect to the database");
```

The constructor accepts the same options as `createLogger()`:

- `formatter`: formatter used for every entry; defaults to `format.pretty`.
- `transport`: one transport or an array of transports; defaults to
  `transports.console`.
- `transportFailure`: `"throw"` or `"continue"`; defaults to `"throw"`.
- `onTransportError`: synchronous or asynchronous callback invoked when a
  transport fails.
- `redact`: sensitive key names or `{ paths, censor }`; disabled by default.

Instances expose `info`, `warn`, `error`, `fatal` and `debug`. Every method
accepts `(message, context?)` and returns `Promise<void>`.

If you prefer a factory-based setup, `createLogger()` remains available and
accepts the same configuration:

```ts
import * as bea from "@rickferrdevelop/bea-logger"

const logger = new bea.Logger({
  // ...configs
});
// or
const logger = bea.createLogger({
  // ...configs
});
```

### ⏳ Using logger methods with or without `await`

Every logger method returns `Promise<void>`. Calling a method without `await`
is valid and starts processing the log immediately:

```ts
logger.info("Server started");
```

The calling code then continues without waiting for the transports to finish.
Use `await` when delivery must complete before the next operation or when you
want transport failures to be propagated:

```ts
await logger.info("Server started");
```

You can also handle completion without making the surrounding function async:

```ts
logger.info("Server started").catch((error) => {
  console.error("Could not deliver the log entry", error);
});
```

For an intentionally detached log, use `void` and still handle rejection:

```ts
void logger.debug("Cache miss").catch((error) => {
  console.error("Could not deliver the diagnostic log", error);
});
```

## 🎨 Choose a format

Bea includes concise, pretty and timestamped formats:

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = new bea.Logger({
  formatter: bea.format.verbose,
  transport: bea.transports.console,
});

await logger.info("Ready to accept connections");
```

Available presets are `bea.format.pretty`, `bea.format.simple`,
`bea.format.verbose` and `bea.format.json`.

## 🧩 Add structured context

Every log method accepts an optional context object with strings, numbers,
booleans, nullish values, arrays, objects, dates and errors. The
context is available to formatters and transports, and the `pretty`, `simple`
and `json` presets include it in their output:

```ts
await logger.info("User created", {
  userId: "42",
  role: "admin",
});
```

The simple formatter renders this as:

```text
info: User created userId=42 role=admin
```

Custom formatters receive the context both as `data.context` and as their
second argument:

```ts
const formatter: bea.Formatter = (data, context) =>
  `${data.level}: ${data.message} (${context?.requestId ?? "no request"})`;
```

### 🔒 Redact sensitive fields

Use `redact` to replace matching context keys at any nesting level before the
entry reaches formatters, transports or transport-error handlers. Matching is
case-insensitive and does not mutate the original context:

```ts
const logger = new bea.Logger({
  redact: {
    paths: ["password", "token", "authorization"],
    censor: "***", // defaults to "[REDACTED]"
  },
});

await logger.info("User authenticated", {
  username: "bea",
  credentials: { token: "secret" },
});
```

The current `paths` entries are key names matched recursively, rather than dot
paths. Put sensitive values in structured context instead of interpolating them
into the message, since message text is not redacted.

### 🌈 Customize pretty-format colors

Use `format.custom` to override any pretty-format color while retaining the
defaults for all unspecified levels and fields:

```ts
const logger = new bea.Logger({
  formatter: bea.format.custom({
    pretty: {
      debug: {
        context: { key: ["bold"], value: ["cyan"] },
      },
    },
  }),
});
```

## 📝 Write logs to a file

The file transport appends one entry at a time and can use its own formatter:

```ts
const logger = new bea.Logger({
  transport: [
    bea.transports.console,
    bea.transports.file({
      filename: "./logs/app.json",
      formatter: bea.format.json,
    }),
  ],
});

await logger.info("Saved to the console and file");
```

The destination directory must already exist. File writes are asynchronous and
`await logger.info(...)` waits until the append completes. Transports are
ordered within one log call; separate calls made without `await` may overlap.

## 🌊 Write logs to a stream

The stream transport writes formatted entries to any Node.js `Writable`, such
as `process.stdout`, a file stream, a socket, or a compression stream:

```ts
const logger = new bea.Logger({
  formatter: bea.format.simple,
  transport: bea.transports.stream({
    stream: process.stdout,
    eol: "\n", // default
  }),
});

await logger.info("Written to stdout");
```

Each logger call waits for the write callback. Write errors are therefore
handled by the logger's configured `transportFailure` behavior. The transport
does not close the stream; the code that created it remains responsible for its
lifecycle.

## 🛠️ Make it yours

A formatter receives structured log data and returns a string or a promise:

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const json: bea.Formatter = (data) => JSON.stringify(data);

// or
// use bea.format.json

const logger = bea.createLogger({
  formatter: json,
  transport: bea.transports.console,
});
```

Text formatters render nested objects and arrays as JSON, dates as ISO strings,
and errors with their stack or message. The JSON formatter preserves error
details and replaces circular references with `"[Circular]"`. Properties whose
value is `undefined` follow `JSON.stringify` behavior and are omitted.

Async formatters are also supported:

```ts
const formatter: bea.Formatter = async (data) => {
  const prefix = await loadPrefix();
  return `${prefix} ${data.level}: ${data.message}`;
};
```

A transport receives both the original data and its formatted representation:

```ts
const collect: bea.Transport = (data, formatted) => {
  // Send to a file, queue, API or observability service.
  logs.push({ data, formatted });
};

const logger = bea.createLogger({
  transport: [bea.transports.console, collect],
});
```

### 🌐 Asynchronous transports

A transport may return `Promise<void>`, which is useful for sending logs to an
API, queue or observability service:

```ts
const remote: bea.Transport = async (data, formatted) => {
  const response = await fetch("https://logs.example.com/events", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ data, formatted }),
  });

  if (!response.ok) {
    throw new Error(`Log delivery failed: ${response.status}`);
  }
};

const logger = new bea.Logger({ transport: remote });
await logger.info("Delivered remotely");
```

Every logger method returns `Promise<void>` and awaits each transport in the
order it was configured. If a transport rejects, the logger method rejects with
the same error and does not execute later transports:

```ts
try {
  await logger.error("Payment failed");
} catch (error) {
  console.error("Could not deliver the log entry", error);
}
```

### 🛟 Handling transport failures

To observe failures and allow the remaining transports to run, use
`transportFailure: "continue"` with `onTransportError`:

```ts
const logger = new bea.Logger({
  transport: [remote, bea.transports.console],
  transportFailure: "continue",
  onTransportError: async ({ error, transportIndex, data }) => {
    await reportDeliveryFailure({ error, transportIndex, data });
  },
});

await logger.error("The remote transport may fail, but console still runs");
```

The default is `transportFailure: "throw"`, preserving fail-fast behavior.
The error callback is awaited before the logger continues or rejects.

For a fallback that only applies to one transport, compose it explicitly:

```ts
const resilientRemote = bea.transports.fallback({
  transport: remote,
  fallback: bea.transports.file({ filename: "failed-deliveries.log" }),
  onError: async (error) => {
    await reportDeliveryFailure({ error });
  },
});

const logger = new bea.Logger({ transport: resilientRemote });
```

The fallback and its optional error callback are both awaited. If either one
rejects, the logger method rejects with that error.

## 📄 License

[MIT](LICENSE) &copy; 2026 [Henrick Ferreira Saraiva](https://github.com/rickferrdev)
