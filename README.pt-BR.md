# 🌸 Bea Logger

[![npm version](https://img.shields.io/npm/v/%40rickferrdevelop%2Fbea-logger?color=ff69b4&label=npm)](https://www.npmjs.com/package/@rickferrdevelop/bea-logger)
[![npm downloads](https://img.shields.io/npm/dm/%40rickferrdevelop%2Fbea-logger?color=8b5cf6)](https://www.npmjs.com/package/@rickferrdevelop/bea-logger)
[![Node.js](https://img.shields.io/node/v/%40rickferrdevelop%2Fbea-logger?color=339933)](package.json)
[![TypeScript](https://img.shields.io/badge/TypeScript-ready-3178c6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Licença: MIT](https://img.shields.io/badge/license-MIT-f5c2e7)](LICENSE)

> Um logger pequeno, flexível e independente de transporte para TypeScript.

O Bea mantém os logs simples: `Logger` oferece um ponto de partida consistente,
um formatador define a aparência do log e um ou mais transportes definem seu
destino.

> [!IMPORTANT]
> Este pacote substitui [`@rickferrdev/bea-logger`](https://www.npmjs.com/package/@rickferrdev/bea-logger).
> Projetos novos e atualizações devem usar `@rickferrdevelop/bea-logger`.

## 🌳 Conteúdo

- [✨ Recursos](#-recursos)
- [📦 Instalação](#-instalação)
  - [🌱 Migração do pacote antigo](#-migração-do-pacote-antigo)
- [🚀 Início rápido](#-início-rápido)
  - [🧱 API do Logger](#-api-do-logger)
  - [⏳ Usando métodos com ou sem `await`](#-usando-métodos-com-ou-sem-await)
- [🎨 Escolha um formato](#-escolha-um-formato)
- [🧩 Adicione contexto estruturado](#-adicione-contexto-estruturado)
  - [🔒 Oculte campos sensíveis](#-oculte-campos-sensíveis)
- [📝 Grave logs em arquivo](#-grave-logs-em-arquivo)
- [🌊 Grave logs em uma stream](#-grave-logs-em-uma-stream)
- [🛠️ Personalização](#️-personalização)
- [📄 Licença](#-licença)

## ✨ Recursos

- 🌸 API pequena, tipada e independente de transporte.
- 🎨 Formatadores integrados pretty, simple, verbose e JSON.
- 🧩 Contexto estruturado com serialização segura de erros e referências circulares.
- 🔒 Redação recursiva de campos sensíveis do contexto.
- 📝 Transportes para console, arquivo e fallback combinável.
- 🌐 Formatadores e transportes síncronos ou assíncronos.
- 🛟 Comportamento configurável em falhas: interromper ou continuar.
- 📦 Pacote ESM com declarações TypeScript incluídas.

## 📦 Instalação

```bash
bun add @rickferrdevelop/bea-logger
# ou: npm install @rickferrdevelop/bea-logger
```

Requer Node.js 20.12.0 ou superior.

### 🌱 Migração do pacote antigo

```bash
npm uninstall @rickferrdev/bea-logger
npm install @rickferrdevelop/bea-logger
```

## 🚀 Início rápido

```ts
import * as bea from "@rickferrdevelop/bea-logger";

const logger = bea.Logger({
  transport: bea.transports.console,
});

await logger.info("Servidor iniciado");
await logger.warn("A resposta está demorando mais que o esperado");
await logger.error("Não foi possível conectar ao banco de dados");
await logger.fatal("A aplicação não pode continuar");
await logger.debug("Cache não encontrado para user:42");
```

### 🧱 API do Logger

`Logger` é a forma recomendada de criar e gerenciar instâncias. Ele oferece a
API completa do logger e mantém a configuração próxima da instância usada pela
aplicação.

```ts
import { Logger, format, transports } from "@rickferrdevelop/bea-logger";

const logger = new Logger({
  formatter: format.pretty,
  transport: transports.console,
});

await logger.info("Servidor iniciado");
```

O construtor aceita as mesmas opções de `createLogger()`:

- `formatter`: formatador de cada entrada; padrão: `format.pretty`.
- `transport`: um transporte ou uma lista; padrão: `transports.console`.
- `transportFailure`: `"throw"` ou `"continue"`; padrão: `"throw"`.
- `onTransportError`: callback síncrono ou assíncrono chamado quando um transporte falha.
- `redact`: nomes de chaves sensíveis ou `{ paths, censor }`; desativado por padrão.

As instâncias expõem `info`, `warn`, `error`, `fatal` e `debug`. Cada método
aceita `(message, context?)` e retorna `Promise<void>`.

Se preferir uma configuração baseada em factory, `createLogger()` continua
disponível e aceita a mesma configuração:

```ts
const logger = new bea.Logger({ /* ...configurações */ });
// ou
const logger = bea.createLogger({ /* ...configurações */ });
```

### ⏳ Usando métodos com ou sem `await`

Todos os métodos retornam `Promise<void>`. Chamar um método sem `await` é válido
e inicia o processamento imediatamente. Use `await` quando a entrega precisar
terminar antes da próxima operação ou quando quiser propagar falhas:

```ts
await logger.info("Servidor iniciado");
```

Para lidar com a conclusão sem tornar a função assíncrona:

```ts
logger.info("Servidor iniciado").catch((error) => {
  console.error("Não foi possível entregar o log", error);
});
```

## 🎨 Escolha um formato

```ts
const logger = new bea.Logger({
  formatter: bea.format.verbose,
  transport: bea.transports.console,
});

await logger.info("Pronto para aceitar conexões");
```

Os presets disponíveis são `bea.format.pretty`, `bea.format.simple`,
`bea.format.verbose` e `bea.format.json`.

## 🧩 Adicione contexto estruturado

Todo método aceita um objeto de contexto com strings, números, booleanos,
valores nulos, arrays, objetos, datas e erros:

```ts
await logger.info("Usuário criado", {
  userId: "42",
  role: "admin",
});
```

Formatadores personalizados recebem o contexto em `data.context` e como segundo
argumento:

```ts
const formatter: bea.Formatter = (data, context) =>
  `${data.level}: ${data.message} (${context?.requestId ?? "sem requisição"})`;
```

### 🔒 Oculte campos sensíveis

Use `redact` para substituir chaves correspondentes em qualquer profundidade
antes que a entrada chegue aos formatadores, transportes ou callbacks de erro.
A comparação ignora maiúsculas e minúsculas e não altera o contexto original:

```ts
const logger = new bea.Logger({
  redact: {
    paths: ["password", "token", "authorization"],
    censor: "***", // padrão: "[REDACTED]"
  },
});

await logger.info("Usuário autenticado", {
  username: "bea",
  credentials: { token: "secret" },
});
```

Nesta versão, os itens de `paths` são nomes de chaves procurados recursivamente,
e não caminhos separados por pontos. Valores sensíveis devem ficar no contexto
estruturado, pois textos interpolados na mensagem não são modificados.

## 📝 Grave logs em arquivo

O transporte de arquivo adiciona uma entrada por vez e pode usar seu próprio
formatador:

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
```

O diretório de destino deve existir. As gravações são assíncronas e
`await logger.info(...)` aguarda a conclusão do append.

## 🌊 Grave logs em uma stream

O transporte de stream escreve entradas formatadas em qualquer `Writable` do
Node.js, como `process.stdout`, uma stream de arquivo, um socket ou uma stream de
compactação:

```ts
const logger = new bea.Logger({
  formatter: bea.format.simple,
  transport: bea.transports.stream({
    stream: process.stdout,
    eol: "\n", // padrão
  }),
});

await logger.info("Escrito no stdout");
```

Cada chamada do logger aguarda o callback de escrita. Assim, erros de escrita
seguem o comportamento configurado em `transportFailure`. O transporte não
fecha a stream; o código que a criou continua responsável pelo ciclo de vida.

## 🛠️ Personalização

Um formatador recebe os dados estruturados e retorna uma string ou uma promise:

```ts
const json: bea.Formatter = (data) => JSON.stringify(data);

const logger = new bea.Logger({
  formatter: json,
  transport: bea.transports.console,
});
```

Um transporte recebe os dados originais e sua representação formatada:

```ts
const collect: bea.Transport = (data, formatted) => {
  logs.push({ data, formatted });
};

const logger = new bea.Logger({
  transport: [bea.transports.console, collect],
});
```

Transportes podem ser assíncronos e enviar logs para APIs, filas ou serviços de
observabilidade. Eles são aguardados na ordem configurada.

Para continuar após uma falha, use `transportFailure: "continue"` e
`onTransportError`. O padrão é `transportFailure: "throw"`.

## 📄 Licença

[MIT](LICENSE) &copy; 2026 [Henrick Ferreira Saraiva](https://github.com/rickferrdev)
