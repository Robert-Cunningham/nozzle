<div align="center">
  <img src="assets/nozzle.webp" alt="Nozzle" width="220" />
  <p><strong>Regex, split, and pace streaming LLM text — across chunk boundaries.</strong></p>
  <a href="https://www.npmjs.com/package/nozzle-js"><img src="https://badgen.net/npm/v/nozzle-js" /></a>
  <a href="https://bundlejs.com/?q=nozzle-js"><img src="https://img.shields.io/bundlejs/size/nozzle-js?label=minzip" /></a>
  <img src="https://badgen.net/badge/dependencies/0/green" />
  <a href="https://github.com/robert-cunningham/nozzle/blob/main/LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue" /></a>
  <br />
  <br />
  <a href="#quickstart">Quickstart</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#recipes">Recipes</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#api-at-a-glance">API</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#guarantees-and-limits">Guarantees</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#reference">Reference</a>
</div>

---

Nozzle is a small TypeScript library for handling text streamed from LLMs. Its regex, split, and extract functions match across chunk boundaries, emitting text as soon as it can't be part of a match and buffering anything that might be used for a future match.

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/demo-parse-dark.gif" />
  <img src="assets/demo-parse.gif" alt="Parse demo: an image marker split across chunks is detected and replaced with an object" />
</picture>

## Quickstart

```bash
npm i nozzle-js # or pnpm / bun / yarn
```

```ts
import { nz } from "nozzle-js"

const parts = nz(textStream).parse(/img-(\w+)/g, (m) => ({ type: "image", id: m[1] }))

for await (const part of parts) {
  // "Here is ", { type: "image", id: "abc123" }, " and ", { type: "image", id: "xyz789" }, "."
}
```

`nz()` accepts any sync or async iterable.

<details><summary>Getting a text stream from your provider</summary>

```ts
// Vercel AI SDK
const { textStream } = streamText({ model, prompt })
nz(textStream)

// OpenAI
const stream = await openai.chat.completions.create({ ...args, stream: true })
nz(stream).map((chunk) => chunk.choices[0]?.delta?.content ?? "")

// Anthropic
const stream = anthropic.messages.stream({ ...args })
nz(stream).map((e) => (e.type === "content_block_delta" && e.delta.type === "text_delta" ? e.delta.text : ""))

// fetch
const res = await fetch(url)
nz(res.body!.pipeThrough(new TextDecoderStream()))
```

</details>

## Recipes

### Extract a generated section

Stream just the code block to a preview while the model is still writing, then save it.

<!-- prettier-ignore -->
````ts
const code = await nz(stream)
  .after("```ts\n")
  .before("```")
  .tap(sendToPreview)
  .consume()

await saveSnippet(code.string())
````

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/demo-extract-dark.gif" />
  <img src="assets/demo-extract.gif" alt="Extracting a fenced code block whose fences are split across chunks" />
</picture>

### Smooth chunky provider output

Providers often deliver text in bursts. Re-chunk into words and release them at a steady pace.

<!-- prettier-ignore -->
```ts
const smooth = nz(stream)
  .splitAfter(" ")
  .compact()
  .minInterval(40)
```

<picture>
  <source media="(prefers-color-scheme: dark)" srcset="assets/demo-timing-dark.gif" />
  <img src="assets/demo-timing.gif" alt="Bursty source chunks released as evenly paced words" />
</picture>

## Versus

- **A hand-written `for await` loop.** Fine for `map` and `filter`. Matching `/img-(\w+)/` when the marker spans chunks means writing a buffer that knows how much text is safe to release. Nozzle is that buffer, tested for regexes, separators, and prefixes/suffixes.
- **RxJS / IxJS.** General-purpose operator libraries without text operators that work across chunk boundaries. Nozzle stays in plain async iterables, so pipelines drop into `for await`, `Response`, and SDKs that already use them, and it preserves generator return values.
- **Your SDK's smoothing.** Nozzle's timing operators work on any source and compose with the parsing ones.

## Guarantees and limits

- Pipelines are lazy: nothing runs until you `for await` or `.consume()`. Generator sources are single-use.
- Breaking out of a loop early closes upstream iterators. Cancelling in-flight I/O is up to the source/provider.
- Errors from the source, including errors raised in timers, surface where you `await`, so `try/catch` works.
- Generator return values pass through transforms (see `mapReturn`, `consume().return()`).

## API at a glance

| Group              | Functions                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Regex**          | [`parse`](#parse) · [`scan`](#scan) · [`match`](#match) · [`replace`](#replace)                                                               |
| **Splitting**      | [`split`](#split) · [`splitAfter`](#splitafter) · [`splitBefore`](#splitbefore) · [`after`](#after) · [`before`](#before) · [`chunk`](#chunk) |
| **Timing**         | [`minInterval`](#mininterval) · [`throttle`](#throttle)                                                                                       |
| **Elements**       | [`map`](#map) · [`asyncMap`](#asyncmap) · [`filter`](#filter) · [`find`](#find)                                                               |
| **Transformation** | [`flatMap`](#flatmap) · [`flatten`](#flatten)                                                                                                 |
| **Filtering**      | [`compact`](#compact) · [`takeWhile`](#takewhile) · [`takeUntil`](#takeuntil)                                                                 |
| **Indexing**       | [`first`](#first) · [`last`](#last) · [`at`](#at) · [`head`](#head) · [`tail`](#tail) · [`initial`](#initial) · [`slice`](#slice)             |
| **Accumulation**   | [`accumulate`](#accumulate) · [`diff`](#diff) · [`reduce`](#reduce)                                                                           |
| **Buffering**      | [`batch`](#batch) · [`buffer`](#buffer) · [`withContext`](#withcontext) · [`aperture`](#aperture)                                             |
| **Side effects**   | [`tap`](#tap) · [`tee`](#tee)                                                                                                                 |
| **Errors**         | [`recover`](#recover) · [`wrap`](#wrap) · [`unwrap`](#unwrap)                                                                                 |
| **Conversion**     | [`consume`](#consume) · [`toReadableStream`](#toreadablestream) · [`fromList`](#fromlist) · [`mapReturn`](#mapreturn)                         |

## Reference

{{reference}}

## Development

```sh
pnpm install --frozen-lockfile
pnpm run check
```

Run `pnpm run docs` after editing API comments or the README template.
Run `pnpm run release:dry` to validate package contents without publishing.

## License

MIT
