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

Main nozzle-js library module

## accumulate()

```ts
nz(["This ", "is ", "a ", "test!"]).accumulate() // => "This ", "This is ", "This is a ", "This is a test!"
```

Yields a cumulative prefix of the input stream.

<details><summary>Details</summary>

```ts
function accumulate(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

</details>

***

## after()

```ts
nz(["a", "b", "c", "d", "e"]).after(/bc/) // => "d", "e"
```

Emit everything **after** the accumulated prefix that matches `pattern`.

<details><summary>Details</summary>

```ts
function after(source: StringIterable, pattern: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `StringIterable` | stream or iterable to scan |
| `pattern` | `string` \| `RegExp` | first `RegExp` that marks the cut-off |

</details>

***

## aperture()

```ts
nz([1, 2, 3, 4, 5]).aperture(3) // => [1, 2, 3], [2, 3, 4], [3, 4, 5]
```

Creates a sliding window of size n over the input stream, yielding arrays of consecutive elements.

<details><summary>Details</summary>

```ts
function aperture<T>(source: Iterable<T>, n: number): AsyncGenerator<T[]>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `Iterable`\<`T`\> | An iterable to create windows over. |
| `n` | `number` | The size of each window. |

</details>

***

## asyncMap()

```ts
nz(["hello", "world"]).asyncMap(async x => x.toUpperCase()) // => "HELLO", "WORLD"
nz(["api/users", "api/posts"]).asyncMap(async url => fetch(url).then(r => r.json())) // => [userData], [postsData]
```

Transforms each value from the input stream using the provided async function.
Applies the async function to each item as soon as it comes off the iterator
and yields results as they complete, allowing multiple function calls to run concurrently.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

<details><summary>Details</summary>

```ts
function asyncMap<T, U>(iterator: AsyncIterable<T>, fn: (value: T) => Promise<U>): AsyncGenerator<U>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `Promise`\<`U`\> | An async function that transforms each string value. |

</details>

***

## at()

```ts
await nz(["a", "b", "c", "d", "e"]).at(2) // => "c"
await nz(["a", "b", "c", "d", "e"]).at(-1) // => "e"
```

Returns the element at the specified index in the input stream.
Supports negative indices to count from the end.

<details><summary>Details</summary>

```ts
function at<T>(iterator: AsyncIterable<T>, index: number): Promise<undefined | T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |
| `index` | `number` | The index to access. Negative values count from the end. |

</details>

***

## before()

```ts
nz(["a", "b", "c", "d", "e"]).before("cd") // => "a", "b"
```

Emit everything **before** the accumulated prefix that contains `separator`.

<details><summary>Details</summary>

```ts
function before(source: StringIterable, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `StringIterable` | stream or iterable to scan |
| `separator` | `string` \| `RegExp` | string that marks the cut-off |

</details>

***

## buffer()

```ts
nz(["a", "b", "c"]).tap(x => console.log(`consumed: ${x}`)).buffer(2).tap(x => console.log(`yielded: ${x}`)) // => consumed: a, consumed: b, yielded: a, consumed: c, yielded: b, yielded: c
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

<details><summary>Details</summary>

```ts
function buffer<T>(source: AsyncIterable<T>, n?: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of values. |
| `n?` | `number` | The maximum number of items to buffer. If undefined, buffers unlimited items. |

</details>

***

## chunk()

```ts
nz(["a", "b", "c", "d", "e", "f"]).chunk(3) // => "abc", "def"
```

Groups input tokens into chunks of the specified size and yields the joined result.
Takes N input items and yields N/size output items, where each output is the concatenation of size input items.

<details><summary>Details</summary>

```ts
function chunk(source: AsyncIterable<string>, size: number): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings (tokens). |
| `size` | `number` | The number of input tokens to group together in each output chunk. |

</details>

***

## compact()

```ts
nz(["Hello", "", "World", ""]).compact() // => "Hello", "World"
```

Filters out empty strings from the input stream.

<details><summary>Details</summary>

```ts
function compact(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

</details>

***

## consume()

```ts
await nz(["a", "b"]).consume().list() // => ["a", "b"]
await nz(["a", "b"]).consume().return() // => undefined (or iterator's return value)
```

Consumes an async iterator completely, collecting both yielded values and the return value.

<details><summary>Details</summary>

```ts
function consume<T, R>(iterator: AsyncIterable<T, R>): Promise<ConsumedPipeline<T, R>>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`, `R`\> | An asynchronous iterable to consume |

</details>

***

## diff()

```ts
nz(["This ", "This is ", "This is a ", "This is a test!"]).diff().value() // => "This ", "is ", "a ", "test!"
```

Yields the difference between the current and previous string in the input stream.

<details><summary>Details</summary>

```ts
function diff(iterator: AsyncIterable<string>): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

</details>

***

## filter()

```ts
nz(["Hello", "Hi", "World"]).filter(chunk => chunk.length > 5) // => "Hello", "World"
```

Filters the input stream based on a predicate function.

<details><summary>Details</summary>

```ts
function filter<T, R>(iterator: AsyncIterable<T, R>, predicate: (chunk: T) => boolean): AsyncGenerator<T, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`, `R`\> | An asynchronous iterable of strings. |
| `predicate` | (`chunk`: `T`) => `boolean` | A function that returns true for items to keep. |

</details>

***

## find()

```ts
await nz(["apple", "banana", "cherry"]).find(chunk => chunk.startsWith("b")) // => "banana"
```

Finds the first value from the input stream that matches the predicate.

<details><summary>Details</summary>

```ts
function find<T>(iterator: AsyncIterable<T>, predicate: (chunk: T) => boolean): Promise<undefined | T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |
| `predicate` | (`chunk`: `T`) => `boolean` | A function that returns true for the item to find. |

</details>

***

## first()

```ts
await nz(["Hello", "World", "!"]).first() // => "Hello"
```

Returns the first value from the input stream.

<details><summary>Details</summary>

```ts
function first<T>(iterator: AsyncIterable<T>): Promise<undefined | T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

</details>

***

## flatten()

```ts
nz([["a", "b"], ["c", "d"], ["e"]]).flatten() // => "a", "b", "c", "d", "e"
```

Flattens nested arrays or iterables into a single stream.

<details><summary>Details</summary>

```ts
function flatten<T>(src: Iterable<Iterable<T> | T[]>): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `src` | `Iterable`\<`Iterable`\<`T`\> \| `T`[]\> | The source iterable containing nested arrays or iterables. |

</details>

***

## fromList()

```ts
nz(["Hello", "World", "!"]) // => "Hello", "World", "!"
```

Converts an array to an async iterator.

<details><summary>Details</summary>

```ts
function fromList<T>(list: T[]): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `list` | `T`[] | An array of values. |

</details>

***

## head()

```ts
nz(["Hello", "World", "!"]).head() // => "Hello"
```

Yields only the first value from the input stream.

<details><summary>Details</summary>

```ts
function head<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

</details>

### See

[at](#at), [tail](#tail), [initial](#initial), [last](#last)

***

## initial()

```ts
nz(["Hello", "World", "!"]).initial() // => "Hello", "World"
```

Yields all values except the last from the input stream.

<details><summary>Details</summary>

```ts
function initial<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

</details>

***

## last()

```ts
await nz(["Hello", "World", "!"]).last() // => "!"
```

Returns the last value from the input stream.

<details><summary>Details</summary>

```ts
function last<T>(iterator: AsyncIterable<T>): Promise<undefined | T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

</details>

***

## map()

```ts
nz(["hello", "world"]).map(x => x.toUpperCase()) // => "HELLO", "WORLD"
```

Transforms each value from the input stream using the provided function.

<details><summary>Details</summary>

```ts
function map<T, U, R>(iterator: AsyncIterable<T, R>, fn: (value: T) => U): AsyncGenerator<U, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`, `R`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `U` | A function that transforms each string value. |

</details>

***

## mapReturn()

```ts
nz(["a", "b"]).mapReturn(returnValue => returnValue?.toString() ?? "default") // => "a", "b" (with mapped return value)
```

Maps the return type of an iterator while preserving all yielded values unchanged.

<details><summary>Details</summary>

```ts
function mapReturn<T, R, U>(iterator: AsyncIterable<T, R>, fn: (value: R) => U): AsyncGenerator<T, U, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`, `R`\> | An asynchronous iterable. |
| `fn` | (`value`: `R`) => `U` | A function that transforms the return value. |

</details>

***

## minInterval()

```ts
nz(["a", "b", "c"]).minInterval(100) // => "a" (0ms), "b" (100ms), "c" (200ms)
```

Enforces a minimum delay between adjacent tokens in a stream.
The first token is yielded immediately, then subsequent tokens are delayed
to ensure at least `delayMs` milliseconds pass between each yield.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

<details><summary>Details</summary>

```ts
function minInterval<T>(source: AsyncIterable<T>, delayMs: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of tokens. |
| `delayMs` | `number` | The minimum delay in milliseconds between adjacent tokens. |

</details>

***

## replace()

```ts
nz(["a", "b", "b", "a"]).replace(/a[ab]*a/g, "X") // => "X"
```

Replaces matches of a regex pattern with a replacement string in the input stream.

Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
they don't match the regex, while holding back potential matches until we can
determine if they should be replaced.

<details><summary>Details</summary>

```ts
function replace(
   input: AsyncIterable<string>, 
   regex: RegExp, 
replacement: string): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | `AsyncIterable`\<`string`\> | - |
| `regex` | `RegExp` | The regular expression pattern to match. |
| `replacement` | `string` | The string to replace matches with. |

</details>

***

## slice()

```ts
nz(["a", "b", "c", "d", "e"]).slice(1, 3) // => "b", "c"
nz(["a", "b", "c", "d", "e"]).slice(-2) // => "d", "e"
```

Yields a slice of the input stream between start and end indices.
Supports negative indices by maintaining an internal buffer.

<details><summary>Details</summary>

```ts
function slice<T>(
   iterator: AsyncIterable<T>, 
   start: number, 
end?: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | The async iterable to slice |
| `start` | `number` | Starting index (inclusive). Negative values count from end. |
| `end?` | `number` | Ending index (exclusive). Negative values count from end. If undefined, slices to end. |

</details>

***

## split()

```ts
nz(["hello,world,test"]).split(",") // => "hello", "world", "test"
```

Takes incoming chunks, merges them, and then splits them by a string separator.

<details><summary>Details</summary>

```ts
function split(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

</details>

***

## splitAfter()

```ts
nz(["hello,world,test"]).splitAfter(",") // => "hello,", "world,", "test"
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the end of each part (except the last).

<details><summary>Details</summary>

```ts
function splitAfter(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

</details>

***

## splitBefore()

```ts
nz(["hello,world,test"]).splitBefore(",") // => "hello", ",world", ",test"
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the beginning of each part (except the first).

<details><summary>Details</summary>

```ts
function splitBefore(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` \| `RegExp` | The string separator to split by. |

</details>

***

## tail()

```ts
nz(["Hello", "World", "!"]).tail() // => "World", "!"
```

Yields all values except the first from the input stream.

<details><summary>Details</summary>

```ts
function tail<T>(iterator: AsyncIterable<T>): AsyncGenerator<T, any, any>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable of values. |

</details>

***

## tap()

```ts
nz(["Hello", "World", "!"]).tap(x => console.log(`yielded: ${x}`)) // => "Hello", "World", "!" (logs: yielded: Hello, yielded: World, yielded: !)
```

Executes a side effect for each value without modifying the stream.

<details><summary>Details</summary>

```ts
function tap<T, R>(iterator: AsyncIterable<T, R>, fn: (value: T) => void): AsyncGenerator<T, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`, `R`\> | An asynchronous iterable of strings. |
| `fn` | (`value`: `T`) => `void` | A function to execute for each value. |

</details>

***

## tee()

```ts
const [stream1, stream2] = nz(["a", "b", "c"]).tee(2) // => Two independent streams of "a", "b", "c"
```

Splits a single iterator into N independent iterables.

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

<details><summary>Details</summary>

```ts
function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncGenerator<T, any, any>[];
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterator`\<`T`\> | The source async iterator to split. |
| `n` | `number` | Number of independent iterables to create. |

</details>

***

## throttle()

```ts
nz(["a", "b", "c", "d"]).throttle(100, chunks => chunks.join("")) // => "a" (0ms), "bcd" (100ms)
```

Throttles the output from a source, with special timing behavior:
- The first chunk is yielded immediately
- Subsequent chunks are batched and yielded together after the interval
- If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives

Error handling follows the pattern described in file://./../../ASYNC\_ERROR\_HANDLING.md
to ensure errors are thrown during await ticks for proper try/catch handling.

<details><summary>Details</summary>

```ts
function throttle<T>(
   source: AsyncIterable<T>, 
   intervalMs: number, 
merge: (values: T[]) => T): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`T`\> | The async iterable source of values. |
| `intervalMs` | `number` | The throttling interval in milliseconds. |
| `merge` | (`values`: `T`[]) => `T` | - |

</details>

***

## unwrap()

```ts
nz(["hello", "world"]).wrap().unwrap() // => "hello", "world"
```

Unwraps results from wrap() back into a normal iterator that throws/returns/yields.
The opposite of wrap() - takes {value, return, error} objects and converts them back
to normal iterator behavior.

<details><summary>Details</summary>

```ts
function unwrap<T, R>(iterator: AsyncIterable<{
  error?: any;
  return?: R;
  value?: T;
}>): AsyncGenerator<T, undefined | R, any>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<\{ `error?`: `any`; `return?`: `R`; `value?`: `T`; \}\> | An asynchronous iterable of wrapped result objects. |

</details>

***

## wrap()

```ts
nz(["hello", "world"]).wrap() // => {value: "hello"}, {value: "world"}, {return: undefined}
```

Wraps an iterator to catch any errors and return them in a result object format.
Instead of throwing, errors are yielded as `{error}` and successful values as `{value}`.

<details><summary>Details</summary>

```ts
function wrap<T>(iterator: AsyncIterable<T>): AsyncGenerator<{
  error?: unknown;
  return?: any;
  value?: T;
}>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | `AsyncIterable`\<`T`\> | An asynchronous iterable. |

</details>
