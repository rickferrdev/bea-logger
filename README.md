# Bea Logger

> A small, flexible and transport-agnostic logger for TypeScript.

Bea keeps logging simple: a formatter decides how a log looks, while one or
more transports decide where it goes.

## Install

```bash
bun add @rickferrdevelop/bea-logger
```

## Quick start

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.createLogger({
  transport: bea.transports.console,
});

logger.info("Server started");
logger.warn("Response is taking longer than expected");
logger.error("Could not connect to the database");
logger.fatal("Application cannot continue");
logger.debug("Cache miss for user:42");
```

```text
[INFO]: Server started
[WARN]: Response is taking longer than expected
[ERROR]: Could not connect to the database
```

## Choose a format

Bea includes concise, pretty and timestamped formats:

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.createLogger({
  formatter: bea.format.verbose,
  transport: bea.transports.console,
});

logger.info("Ready to accept connections");
```

Available presets are `bea.format.pretty`, `bea.format.simple` and
`bea.format.verbose`.

## Make it yours

A formatter receives structured log data and returns a string:

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const json: bea.Formatter = (data) => JSON.stringify(data);

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

## License

[MIT](LICENSE) &copy; 2026 [rickferrdev](https://github.com/rickferrdev)
