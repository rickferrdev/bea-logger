# Bea Logger

> A small, flexible and transport-agnostic logger for TypeScript.

Bea keeps logging simple: a formatter decides how a log looks, while one or
more transports decide where it goes.

## Install

```bash
bun add @rickferrdevelop/bea-logger
# or: npm install @rickferrdevelop/bea-logger
```

Requires Node.js 20.12.0 or newer.

## Quick start

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.createLogger({
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

### Using logger methods with or without `await`

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

## Choose a format

Bea includes concise, pretty and timestamped formats:

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.createLogger({
  formatter: bea.format.verbose,
  transport: bea.transports.console,
});

await logger.info("Ready to accept connections");
```

Available presets are `bea.format.pretty`, `bea.format.simple`,
`bea.format.verbose` and `bea.format.json`.

## Write logs to a file

The file transport appends one entry at a time and can use its own formatter:

```ts
const logger = bea.createLogger({
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

The destination directory must already exist. File writes are synchronous, so
this transport is best suited to small applications and moderate log volumes.

## Make it yours

A formatter receives structured log data and returns a string:

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

### Asynchronous transports

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

const logger = bea.createLogger({ transport: remote });
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

## License

[MIT](LICENSE) &copy; 2026 [Henrick Ferreira Saraiva](https://github.com/rickferrdev)
