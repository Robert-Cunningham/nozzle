<div align="center">
  <img src="assets/nozzle.webp" alt="Nozzle" width="220" />
  <p><strong>Chunk-aware primitives for streaming text.</strong></p>
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
  <a href="#guarantees">Guarantees</a>
  <span>&nbsp;•&nbsp;</span>
  <a href="#reference">Reference</a>
</div>

---

Nozzle is a small TypeScript library for handling text streamed from LLMs. Its functions buffer only where necessary and otherwise emit chunks as soon as possible. For example, regexes buffer a potential match only until it's confirmed or rejected, and emit everything around it immediately.

## Quickstart

```bash
npm i nozzle-js # or pnpm / bun / yarn
```

```ts
import { nz } from "nozzle-js"

const parts = nz(textStream).parse(/img-(\w+)/g, (m) => ({ src: m[1] }))

for await (const part of parts) console.log(part)

/*
 * in:   "Here is im"  "g-abc"  "123 and im"                "g-xyz"  "789."
 * out:  "Here is "             { src: "abc123" }  " and "           { src: "xyz789" }  "."
 */
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

/*
 * in:   "Sure!\n``"  "`ts\nconst x = "  "await f()\n"  "return x\n``"  "`\nDone!"
 * out:               "const x = "       "await f()\n"  "return x\n"
 */
````

### Smooth chunky provider output

Providers often deliver text in bursts. Re-chunk into words and release them at a steady pace.

<!-- prettier-ignore -->
```ts
const smooth = nz(stream)
  .splitAfter(" ")
  .compact()
  .minInterval(40)

/*
 * in:   The quick ...... brown fox jumps over ................ the lazy dog.
 * out:  The .. quick .. brown .. fox .. jumps .. over .. the .. lazy .. dog.
 */
```

## Guarantees

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
