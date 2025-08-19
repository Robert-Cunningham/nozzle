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
const stream = await openai.chat.completions.create({ ...args, stream: true })

/*
# Reasoning:
3x3 is equal to 9.

# Answer:
The product is 9.

# Check:
9 / 3 = 3, so I think this answer is correct.

=> 
The product is 9.
*/
// extract the section between # Answer and # Reasoning; return the individual sentences at least 100ms apart.
return nz(stream)
  .after("# Answer")
  .before("# Check")
  .split(/ .;,/g)
  .trim() // trim the overall response of whitespace.
  .minInterval(100)
  .value()
```

// wait, does regex work with ^? probably not, since we truncate all the time, right?
// because really, .trim() should just be .replace(^\s+, '').replace(\s+$, '').
// it could also be

````ts
import { parse, STR, OBJ } from "nozzle-json";

const input = `
Sure, the object that answers your question is:
\`\`\`json
{"product": 9}
\`\`\`
`

// should have .throwifnotfound or something, as well as .throwiffound, .censor, etc?
return nz(stream)
  .after("```json")
  .before("```")
  .trim()
  .accumulate()
  .map((prefix) => parse(prefix))
  .pairs()
  .filter(x => ) // only allow json values which have xyz
  .value()
```
````

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

## API Reference

## Functions

### aperture()

```ts
function aperture<T>(source: Iterable<T>, n: number): AsyncGenerator<T[]>;
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `source` | `Iterable`\<`T`\> |
| `n` | `number` |

## Accumulation

### accumulate()

```ts
function accumulate(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

Yields a cumulative prefix of the input stream.

#### Example

```ts
const stream = accumulate(streamOf(["This ", "is ", "a ", "test!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["This ", "This is ", "This is a ", "This is a test!"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

### diff()

```ts
function diff(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

Yields the difference between the current and previous string in the input stream.

#### Example

```ts
const stream = diff(streamOf(["This ", "This is ", "This is a ", "This is a test!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["This ", "is ", "a ", "test!"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

## Buffering

### buffer()

```ts
function buffer<T>(source: AsyncIterable<T>, n?: number): AsyncGenerator<T>;
```

Buffers up to N items from the source iterator, consuming them eagerly
and yielding them on demand. If n is undefined, buffers unlimited items.

The buffer() function "slurps up" as much of the input iterator as it can
as fast as it can, storing items in an internal buffer. When items are
requested from the buffer, they are yielded from this pre-filled buffer.
This creates a decoupling between the consumption rate and the production rate.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md.
This function serves as a reference implementation for proper error handling
with background consumers.

#### Example

```ts
// Buffer up to 10 items
const buffered = buffer(source, 10)

// Buffer unlimited items
const unbuffered = buffer(source)
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of values. |
| `n?` | `number` | The maximum number of items to buffer. If undefined, buffers unlimited items. |

## Conversion

### asList()

```ts
function asList<T>(iterator: AsyncIterable<T>): Promise<T[]>;
```

Consumes an async iterator and returns all values as an array.

#### Example

```ts
const result = await asList(streamOf(["Hello", "World", "!"]))
console.log(result) // => ["Hello", "World", "!"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |

### asString()

```ts
function asString(iterator: AsyncIterable<string>): Promise<string>;
```

Consumes an async iterator and returns the final accumulated string.
Equivalent to calling accumulate().last() but more efficient.

#### Example

```ts
const result = await asString(streamOf(["Hello", " ", "World"]))
console.log(result) // => "Hello World"
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

### fromList()

```ts
function fromList<T>(list: T[]): AsyncGenerator<T>;
```

Converts an array to an async iterator.

#### Example

```ts
const stream = fromList(["Hello", "World", "!"])
for await (const chunk of stream) {
  console.log(chunk)
}
// => "Hello", "World", "!"
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `list` | `T`[] | An array of values. |

## Elements

### asyncMap()

```ts
function asyncMap<T, U>(iterator: AsyncIterable<T>, fn: (value: T) => Promise<U>): AsyncGenerator<U>;
```

Transforms each value from the input stream using the provided async function.
Applies the async function to each item as soon as it comes off the iterator
and yields results as they complete, allowing multiple function calls to run concurrently.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `Promise`\<`U`\> | An async function that transforms each string value. |

#### Examples

```ts
const stream = asyncMap(streamOf(["hello", "world"]), async x => {
  await new Promise(resolve => setTimeout(resolve, 100))
  return x.toUpperCase()
})
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["HELLO", "WORLD"]
```

```ts
// Fetch data for each URL as they come in
const urls = streamOf(["api/users", "api/posts"])
const responses = asyncMap(urls, async url => {
  const response = await fetch(url)
  return await response.json()
})
for await (const data of responses) {
  console.log(data)
}
```

***

### filter()

```ts
function filter<T>(iterator: AsyncIterable<T>, predicate: (chunk: T) => boolean): AsyncGenerator<T>;
```

Filters the input stream based on a predicate function.

#### Example

```ts
const stream = filter(streamOf(["Hello", "Hi", "World"]), (chunk: string) => chunk.length > 5)
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["Hello", "World"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |
| `predicate` | (`chunk`: `T`) => `boolean` | A function that returns true for items to keep. |

### map()

```ts
function map<T, U>(iterator: AsyncIterable<T>, fn: (value: T) => U): AsyncGenerator<U>;
```

Transforms each value from the input stream using the provided function.

#### Example

```ts
const stream = map(streamOf(["hello", "world"]), x => x.toUpperCase())
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["HELLO", "WORLD"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `U` | A function that transforms each string value. |

## Error Handling

### safe()

```ts
function safe<T>(iterator: AsyncIterable<T>): AsyncGenerator<{
  error?: unknown;
  success?: T;
}>;
```

Wraps an iterator to catch any errors and return them in a result object format.
Instead of throwing, errors are yielded as `{error}` and successful values as `{success}`.

#### Example

```ts
const stream = safe(streamOf(["hello", "world"]))
for await (const result of stream) {
  if (result.success !== undefined) {
    console.log("Got:", result.success)
  } else {
    console.log("Error:", result.error)
  }
}
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable. |

## Filtering

### compact()

```ts
function compact(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

Filters out empty strings from the input stream.

#### Example

```ts
const stream = compact(streamOf(["Hello", "", "World", ""]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["Hello", "World"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

## Indexing

### first()

```ts
function first<T>(iterator: AsyncIterable<T>): AsyncGenerator<T>;
```

Yields only the first value from the input stream.

#### Example

```ts
const stream = first(streamOf(["Hello", "World", "!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["Hello"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |

### head()

```ts
function head<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

Yields only the first value from the input stream.

#### Example

```ts
const stream = head(streamOf(["Hello", "World", "!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["Hello"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

### initial()

```ts
function initial<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

Yields all values except the last from the input stream.

#### Example

```ts
const stream = initial(streamOf(["Hello", "World", "!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["Hello", "World"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

### last()

```ts
function last<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

Yields only the last value from the input stream.

#### Example

```ts
const stream = last(streamOf(["Hello", "World", "!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["!"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

### slice()

```ts
function slice<T>(
   iterator: AsyncIterable<T>, 
   start: number, 
end?: number): AsyncGenerator<T>;
```

Yields a slice of the input stream between start and end indices.
Supports negative indices by maintaining an internal buffer.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | The async iterable to slice |
| `start` | `number` | Starting index (inclusive). Negative values count from end. |
| `end?` | `number` | Ending index (exclusive). Negative values count from end. If undefined, slices to end. |

#### Examples

```ts
const stream = slice(streamOf(["a", "b", "c", "d", "e"]), 1, 3)
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["b", "c"]
```

```ts
const stream = slice(streamOf(["a", "b", "c", "d", "e"]), -2)
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["d", "e"]
```

***

### tail()

```ts
function tail<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

Yields all values except the first from the input stream.

#### Example

```ts
const stream = tail(streamOf(["Hello", "World", "!"]))
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["World", "!"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

## Regex

### replace()

```ts
function replace(
   input: AsyncIterable<string>, 
   regex: RegExp, 
replacement: string): AsyncGenerator<string>;
```

Replaces matches of a regex pattern with a replacement string in the input stream.

Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
they don't match the regex, while holding back potential matches until we can
determine if they should be replaced.

#### Example

```ts
const stream = replace(streamOf(["a", "b", "b", "a"]), /a[ab]*a/g, "X")
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["X"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `AsyncIterable`\<`string`\> | - |
| `regex` | `RegExp` | The regular expression pattern to match. |
| `replacement` | `string` | The string to replace matches with. |

## Side Effects

### tap()

```ts
function tap<T>(iterator: AsyncIterable<T>, fn: (value: T) => void): AsyncGenerator<T>;
```

Executes a side effect for each value without modifying the stream.

#### Example

```ts
const stream = tap(streamOf(["Hello", "World", "!"]), console.log)
for await (const chunk of stream) {
  // console.log will have printed each chunk
  console.log("Processed:", chunk)
}
// => logs: "Hello", "World", "!", then "Processed: Hello", "Processed: World", "Processed: !"
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `void` | A function to execute for each value. |

### tee()

```ts
function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncGenerator<T, any, any>[];
```

Splits a single iterator into N independent iterables.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterator`\<`T`\> | The source async iterator to split. |
| `n` | `number` | Number of independent iterables to create. |

## Splitting

### after()

```ts
function after(source: StringIterable, pattern: string | RegExp): AsyncGenerator<string>;
```

Emit everything **after** the accumulated prefix that matches `pattern`.

#### Example

```ts
const stream = after(streamOf(["a", "b", "c", "d", "e"]), /bc/)
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["d", "e"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `StringIterable` | stream or iterable to scan |
| `pattern` | `string` \| `RegExp` | first `RegExp` that marks the cut-off |

### before()

```ts
function before(source: StringIterable, separator: string | RegExp): AsyncGenerator<string>;
```

Emit everything **before** the accumulated prefix that contains `separator`.

#### Example

```ts
const stream = before(streamOf(["a", "b", "c", "d", "e"]), "cd")
for await (const chunk of stream) {
  console.log(chunk)
}
// => ["a", "b"]
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `StringIterable` | stream or iterable to scan |
| `separator` | `string` \| `RegExp` | string that marks the cut-off |

### chunk()

```ts
function chunk(source: AsyncIterable<string>, size: number): AsyncGenerator<string>;
```

Groups input tokens into chunks of the specified size and yields the joined result.
Takes N input items and yields N/size output items, where each output is the concatenation of size input items.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings (tokens). |
| `size` | `number` | The number of input tokens to group together in each output chunk. |

### split()

```ts
function split(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

### splitAfter()

```ts
function splitAfter(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the end of each part (except the last).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

### splitBefore()

```ts
function splitBefore(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the beginning of each part (except the first).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

## Timing

### minInterval()

```ts
function minInterval<T>(source: AsyncIterable<T>, delayMs: number): AsyncGenerator<T>;
```

Enforces a minimum delay between adjacent tokens in a stream.
The first token is yielded immediately, then subsequent tokens are delayed
to ensure at least `delayMs` milliseconds pass between each yield.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of tokens. |
| `delayMs` | `number` | The minimum delay in milliseconds between adjacent tokens. |

### throttle()

```ts
function throttle<T>(
   source: AsyncIterable<T>, 
   intervalMs: number, 
merge: (values: T[]) => T): AsyncGenerator<T>;
```

Throttles the output from a source, with special timing behavior:
- The first chunk is yielded immediately
- Subsequent chunks are batched and yielded together after the interval
- If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of values. |
| `intervalMs` | `number` | The throttling interval in milliseconds. |
| `merge` | (`values`: `T`[]) => `T` | - |

## Transformation

### flatten()

```ts
function flatten<T>(src: Iterable<Iterable<T> | T[]>): AsyncGenerator<T>;
```

Flattens nested arrays or iterables into a single stream.

#### Example

```ts
const stream = fromList([["a", "b"], ["c", "d"], ["e"]])
const flattened = flatten(stream)
for await (const chunk of flattened) {
  console.log(chunk)
}
// => "a", "b", "c", "d", "e"
```

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `Iterable`\<`Iterable`\<`T`\> \| `T`[]\> | The source iterable containing nested arrays or iterables. |

