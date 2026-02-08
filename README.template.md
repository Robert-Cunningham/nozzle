<div align="center">
  <img src="assets/nozzle%20small.png" alt="Nozzle Logo" width="40%" />
  <br />
  <a href="https://www.npmjs.com/package/nozzle-js"><img src="https://badgen.net/npm/v/nozzle-js" /></a>
  <a href="https://github.com/robert-cunningham/nozzle/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <a href="https://bundlephobia.com/result?p=nozzle-js"><img src="https://badgen.net/bundlephobia/minzip/nozzle-js"></a>
  <br />
  <br />
  <a href="#Quickstart">Quickstart</a>
  <span>&nbsp;&nbsp;•&nbsp;&nbsp;</span>
  <a href="#Reference">Reference</a>
  <br />
  <hr />
</div>

<!-- [![npm version][npm-src]][npm-href]
[![Bundle size][bundlephobia-src]][bundlephobia-href]
[![License][license-src]][license-href]
-->

Nozzle is a utility library for manipulating streams of text, and in particular streamed responses from LLMs.

## Installation

```bash
npm i nozzle-js # or pnpm / bun / yarn
```

nozzle is written in TypeScript and has both cjs and esm builds.

## Usage

```ts
// map inline image ids into objects with attached urls (from the db) using .parse and .asyncMap
const stream = await openai.chat.completions.create({ ...args, stream: true })
return nz(stream).match()
```

```ts
// use nozzle to run actions as soon as they come back from chatGPT; tap for logging; tee for capturing the stream when it's done.
```

````ts
// use before and after to streaming-extract the content between ```ts and ```, then evaluate the response
const code = nz(stream)
  .after("```ts")
  .before("```")
  .tap((x) => websocketSend(x))
  .accumulate()
  .last()

return eval(code)
````

```ts
// re-time an LLM response to be more reasonable. Use buffer() etc.
return nz(stream)
  .split(/ .;,/g)
  .trim() // trim the overall response of whitespace.
  .minInterval(100)
  .value()
```

{{reference}}

## Testing

Install the library:

```bash
git clone https://github.com/Robert-Cunningham/nozzle
cd nozzle
npm i
```

Then run the tests:

```bash
npm run test
```

## License

This library is licensed under the MIT license.
