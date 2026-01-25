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
return nz(stream).split(/ .;,/g).minInterval(100).value()
```

# Elements

## `asyncMap`

```ts
nz(["hello", "world"]).asyncMap(async x => x.toUpperCase()) // => "HELLO", "WORLD"
nz(["api/users", "api/posts"]).asyncMap(async url => fetch(url).then(r => r.json())) // => [userData], [postsData]
```

Transforms each value from the input stream using the provided async function.
Applies the async function to each item as soon as it comes off the iterator
and yields results as they complete, allowing multiple function calls to run concurrently.

<details><summary>Details</summary>

```ts
function asyncMap<T, U>(iterator: AsyncIterable<T>, fn: (value: T) => Promise<U>): AsyncGenerator<U>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of strings. |
| `fn` | (value: T) =\> Promise\<U\> | An async function that transforms each string value. |
</details>

---

## `filter`

```ts
nz(["Hello", "Hi", "World"]).filter(chunk => chunk.length > 5) // => "Hello", "World"
```

Filters the input stream based on a predicate function.

<details><summary>Details</summary>

```ts
function filter<T, R = any>(iterator: AsyncIterable<T, R>, predicate: (chunk: T) => boolean): AsyncGenerator<T, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T, R\> | An asynchronous iterable of strings. |
| `predicate` | (chunk: T) =\> boolean | A function that returns true for items to keep. |
</details>

---

## `find`

```ts
await nz(["apple", "banana", "cherry"]).find(chunk => chunk.startsWith("b")) // => "banana"
```

Finds the first value from the input stream that matches the predicate.

<details><summary>Details</summary>

```ts
function find<T>(iterator: AsyncIterable<T>, predicate: (chunk: T) => boolean): Promise<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
| `predicate` | (chunk: T) =\> boolean | A function that returns true for the item to find. |
</details>

---

## `map`

```ts
nz(["hello", "world"]).map(x => x.toUpperCase()) // => "HELLO", "WORLD"
```

Transforms each value from the input stream using the provided function.

<details><summary>Details</summary>

```ts
function map<T, U, R = any>(iterator: AsyncIterable<T, R>, fn: (value: T) => U): AsyncGenerator<U, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T, R\> | An asynchronous iterable of strings. |
| `fn` | (value: T) =\> U | A function that transforms each string value. |
</details>

---

# Indexing

## `at`

```ts
await nz(["a", "b", "c", "d", "e"]).at(2) // => "c"
await nz(["a", "b", "c", "d", "e"]).at(-1) // => "e"
```

Returns the element at the specified index in the input stream.
Supports negative indices to count from the end.

<details><summary>Details</summary>

```ts
function at<T>(iterator: AsyncIterable<T>, index: number): Promise<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
| `index` | number | The index to access. Negative values count from the end. |
</details>

---

## `first`

```ts
await nz(["Hello", "World", "!"]).first() // => "Hello"
```

Returns the first value from the input stream.

<details><summary>Details</summary>

```ts
function first<T>(iterator: AsyncIterable<T>): Promise<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
</details>

---

## `head`

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
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
</details>

### See

{@link at}, {@link tail}, {@link initial}, {@link last}

---

## `initial`

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
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
</details>

---

## `last`

```ts
await nz(["Hello", "World", "!"]).last() // => "!"
```

Returns the last value from the input stream.

<details><summary>Details</summary>

```ts
function last<T>(iterator: AsyncIterable<T>): Promise<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
</details>

---

## `slice`

```ts
nz(["a", "b", "c", "d", "e"]).slice(1, 3) // => "b", "c"
nz(["a", "b", "c", "d", "e"]).slice(-2) // => "d", "e"
```

Yields a slice of the input stream between start and end indices.
Supports negative indices by maintaining an internal buffer.

<details><summary>Details</summary>

```ts
function slice<T>(iterator: AsyncIterable<T>, start: number, end?: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | The async iterable to slice |
| `start` | number | Starting index (inclusive). Negative values count from end. |
| `end` | number | Ending index (exclusive). Negative values count from end. If undefined, slices to end. |
</details>

---

## `tail`

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
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable of values. |
</details>

---

# Filtering

## `compact`

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
| `iterator` | AsyncIterable\<string\> | An asynchronous iterable of strings. |
</details>

---

# Splitting

## `after`

```ts
nz(["a", "b", "c", "d", "e"]).after(/bc/) // => "d", "e"
```

Emit everything **after** the accumulated prefix that matches `pattern`.

Built on: `scan(source, regex)` skipping until first match, then yielding everything after

<details><summary>Details</summary>

```ts
function after(source: StringIterable, pattern: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | StringIterable | stream or iterable to scan |
| `pattern` | string \| RegExp | first `RegExp` that marks the cut-off |
</details>

---

## `before`

```ts
nz(["a", "b", "c", "d", "e"]).before("cd") // => "a", "b"
```

Emit everything **before** the accumulated prefix that contains `separator`.

Built on: `scan(source, regex)` taking text until first match

<details><summary>Details</summary>

```ts
function before(source: StringIterable, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | StringIterable | stream or iterable to scan |
| `separator` | string \| RegExp | string that marks the cut-off |
</details>

---

## `chunk`

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
| `source` | AsyncIterable\<string\> | The async iterable source of strings (tokens). |
| `size` | number | The number of input tokens to group together in each output chunk. |
</details>

---

## `split`

```ts
nz(["hello,world,test"]).split(",") // => "hello", "world", "test"
```

Takes incoming chunks, merges them, and then splits them by a string separator.

Built on: `scan(source, regex)` accumulating text between matches

<details><summary>Details</summary>

```ts
function split(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<string\> | The async iterable source of strings. |
| `separator` | string \| RegExp | The string separator to split by. |
</details>

---

## `splitAfter`

```ts
nz(["hello,world,test"]).splitAfter(",") // => "hello,", "world,", "test"
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the end of each part (except the last).

Built on: `scan(source, regex)` with separator appended to each segment

<details><summary>Details</summary>

```ts
function splitAfter(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<string\> | The async iterable source of strings. |
| `separator` | string \| RegExp | The string separator to split by. |
</details>

---

## `splitBefore`

```ts
nz(["hello,world,test"]).splitBefore(",") // => "hello", ",world", ",test"
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the beginning of each part (except the first).

Built on: `scan(source, regex)` with separator prepended to each segment after first

<details><summary>Details</summary>

```ts
function splitBefore(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<string\> | The async iterable source of strings. |
| `separator` | string \| RegExp | The string separator to split by. |
</details>

---

# Accumulation

## `accumulate`

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
| `iterator` | AsyncIterable\<string\> | An asynchronous iterable of strings. |
</details>

---

## `diff`

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
| `iterator` | AsyncIterable\<string\> | An asynchronous iterable of strings. |
</details>

---

## `reduce`

```ts
nz([1, 2, 3, 4]).reduce((acc, n) => acc + n, 0) // => 1, 3, 6, 10
```

Yields progressive accumulated values using a reducer function.

<details><summary>Details</summary>

```ts
function reduce<T, A>(source: AsyncIterable<T>, reducer: (accumulator: A, current: T, index: number) => A, initial: A): AsyncGenerator<A>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<T\> | An asynchronous iterable of values. |
| `reducer` | (accumulator: A, current: T, index: number) =\> A | A function that combines the accumulator with each value. |
| `initial` | A | The initial accumulator value. |
</details>

---

# Transformation

## `flatten`

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
| `src` | Iterable\<Iterable\<T\> \| T[]\> | The source iterable containing nested arrays or iterables. |
</details>

---

# Regex

These functions use JavaScript regular expressions to search, match, and transform streaming text.

Nozzle handles matching patterns across chunk boundaries by buffering text internally.
Non-matching text is yielded as soon as it's certain not to be part of a match, while
potential matches are held back until confirmed.

### Unsupported Features

These features throw an error because they cannot work reliably with streaming:

| Feature | Example | Why |
| ------- | ------- | --- |
| Lookaheads | `(?=...)`, `(?!...)` | Content to look ahead may not have arrived yet |
| Lookbehinds | `(?<=...)`, `(?<!...)` | Content to look behind may have already been yielded |
| Backreferences | `\1`, `\k<name>` | Referenced group may span chunks or be partially buffered |
| Multiline mode | `/pattern/m` | `^`/`$` would behave inconsistently at arbitrary chunk boundaries |

### Patterns That Delay Output

Some patterns force nozzle to buffer text longer than you might expect:

- **Open-ended quantifiers at pattern end**: `/hello.+/g` buffers everything after "hello"
  until the stream ends—`.+` can always match more. Use a delimiter instead: `/hello[^!]+/g`
  matches until `!`, allowing earlier output.

- **Alternations with shared prefixes**: `/cat|caterpillar/g` buffers "cat" until enough
  text arrives to rule out "caterpillar". Put longer alternatives first: `/caterpillar|cat/g`.

- **Optional suffixes**: `/items?/g` buffers "item" to check for a trailing "s". This is
  usually fine, but `/data.*?end/g` buffers from "data" until "end" appears.

### Global vs Non-Global

- **Global (`/pattern/g`)**: Finds all matches throughout the stream
- **Non-global (`/pattern/`)**: Finds only the first match, then passes remaining text through unchanged

## `match`

```ts
nz(["a", "b", "b", "a"]).match(/a([ab]*)a/g) // => ["abba", "bb"] (match arrays with capture groups)
```

Extracts matches of a regex pattern from the input stream.

Uses earliestPossibleMatchIndex to efficiently skip tokens as soon as we know
they don't match the regex, while holding back potential matches until we can
determine if they match.

Built on: `scan(input, regex).filter(x => 'match' in x).map(x => x.match)`

<details><summary>Details</summary>

```ts
function match(input: AsyncIterable<string>, regex: RegExp): AsyncGenerator<RegExpExecArray>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | AsyncIterable\<string\> | - |
| `regex` | RegExp | The regular expression pattern to match. |
</details>

---

## `parse`

```ts
// Extract UUIDs from text
nz(["Now I'm taking uuid-asdf-flkj and adding it to uuid-fslkj-alkjlsf."])
  .parse(/uuid-(?<id>\w+)-\w+/g, m => ({ id: m.groups!.id }))
// yields: "Now I'm taking ", { id: "asdf" }, " and adding it to ", { id: "fslkj" }, "."

// Parse numbers from text
nz(["The answer is 42 and also 123"])
  .parse(/\d+/g, m => parseInt(m[0], 10))
// yields: "The answer is ", 42, " and also ", 123
```

Parses input for regex matches, yielding text as-is and transforming matches.

This transform is useful for extracting structured data from text streams.
Non-matching text is passed through as strings, while matches are transformed
using the provided function.

<details><summary>Details</summary>

```ts
function parse<T>(input: AsyncIterable<string>, regex: RegExp, transform: (match: RegExpExecArray) => T): AsyncGenerator<string | T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | AsyncIterable\<string\> | An asynchronous iterable of strings. |
| `regex` | RegExp | The regular expression pattern to match. |
| `transform` | (match: RegExpExecArray) =\> T | A function that transforms each match into a desired type. |
</details>

---

## `replace`

```ts
nz(["a", "b", "b", "a"]).replace(/a[ab]*a/g, "X") // => "X"
```

Replaces matches of a regex pattern with a replacement string in the input stream.

Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
they don't match the regex, while holding back potential matches until we can
determine if they should be replaced.

Built on: `scan(input, regex).map(x => 'text' in x ? x.text : x.match[0].replace(regex, replacement))`

<details><summary>Details</summary>

```ts
function replace(input: AsyncIterable<string>, regex: RegExp, replacement: string): AsyncGenerator<string>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | AsyncIterable\<string\> | - |
| `regex` | RegExp | The regular expression pattern to match. |
| `replacement` | string | The string to replace matches with. |
</details>

---

## `scan`

```ts
nz(["hello world"]).scan(/\w+/g)
// yields: { match: [...] }, { text: " " }, { match: [...] }

nz(["Now I'm taking uuid-asdf-flkj..."]).scan(/uuid-(\w+)-\w+/g)
// yields: { text: "Now I'm taking " }, { match: [...] }, { text: "..." }
```

Scans input for regex matches, yielding interleaved text and match results.

This is the foundational regex transform that other transforms build on.
It efficiently yields non-matching text as soon as we're certain it can't match,
while holding back potential matches until we can determine their boundaries.

Note: Empty text strings are never yielded.

<details><summary>Details</summary>

```ts
function scan(input: AsyncIterable<string>, regex: RegExp): AsyncGenerator<ScanResult>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `input` | AsyncIterable\<string\> | An asynchronous iterable of strings. |
| `regex` | RegExp | The regular expression pattern to match. |
</details>

---

# Timing

## `minInterval`

```ts
nz(["a", "b", "c"]).minInterval(100) // => "a" (0ms), "b" (100ms), "c" (200ms)
```

Enforces a minimum delay between adjacent tokens in a stream.
The first token is yielded immediately, then subsequent tokens are delayed
to ensure at least `delayMs` milliseconds pass between each yield.

<details><summary>Details</summary>

```ts
function minInterval<T>(source: AsyncIterable<T>, delayMs: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<T\> | The async iterable source of tokens. |
| `delayMs` | number | The minimum delay in milliseconds between adjacent tokens. |
</details>

---

## `throttle`

```ts
nz(["a", "b", "c", "d"]).throttle(100, chunks => chunks.join("")) // => "a" (0ms), "bcd" (100ms)
```

Throttles the output from a source, with special timing behavior:
- The first chunk is yielded immediately
- Subsequent chunks are batched and yielded together after the interval
- If no chunks arrive during an interval, the next chunk is yielded immediately when it arrives

<details><summary>Details</summary>

```ts
function throttle<T>(source: AsyncIterable<T>, intervalMs: number, merge: (values: T[]) => T): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<T\> | The async iterable source of values. |
| `intervalMs` | number | The throttling interval in milliseconds. |
| `merge` | (values: T[]) =\> T | - |
</details>

---

# Buffering

## `buffer`

```ts
nz(["a", "b", "c"]).tap(x => console.log(`consumed: ${x}`)).buffer(2).tap(x => console.log(`yielded: ${x}`)) // => consumed: a, consumed: b, yielded: a, consumed: c, yielded: b, yielded: c
```

Buffers up to N items from the source iterator, consuming them eagerly
and yielding them on demand. If n is undefined, buffers unlimited items.

The buffer() function "slurps up" as much of the input iterator as it can
as fast as it can, storing items in an internal buffer. When items are
requested from the buffer, they are yielded from this pre-filled buffer.
This creates a decoupling between the consumption rate and the production rate.

<details><summary>Details</summary>

```ts
function buffer<T>(source: AsyncIterable<T>, n?: number): AsyncGenerator<T>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | AsyncIterable\<T\> | The async iterable source of values. |
| `n` | number | The maximum number of items to buffer. If undefined, buffers unlimited items. |
</details>

---

# Side Effects

## `tap`

```ts
nz(["Hello", "World", "!"]).tap(x => console.log(`yielded: ${x}`)) // => "Hello", "World", "!" (logs: yielded: Hello, yielded: World, yielded: !)
```

Executes a side effect for each value without modifying the stream.

<details><summary>Details</summary>

```ts
function tap<T, R = any>(iterator: AsyncIterable<T, R>, fn: (value: T) => void): AsyncGenerator<T, R, undefined>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T, R\> | An asynchronous iterable of strings. |
| `fn` | (value: T) =\> void | A function to execute for each value. |
</details>

---

## `tee`

```ts
const [stream1, stream2] = nz(["a", "b", "c"]).tee(2) // => Two independent streams of "a", "b", "c"
```

Splits a single iterator into N independent iterables.

<details><summary>Details</summary>

```ts
function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncGenerator<T, any, any>[];
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterator\<T\> | The source async iterator to split. |
| `n` | number | Number of independent iterables to create. |
</details>

---

# Error Handling

## `unwrap`

```ts
nz(["hello", "world"]).wrap().unwrap() // => "hello", "world"
```

Unwraps results from wrap() back into a normal iterator that throws/returns/yields.
The opposite of wrap() - takes {value, return, error} objects and converts them back
to normal iterator behavior.

<details><summary>Details</summary>

```ts
function unwrap<T, R = any>(iterator: AsyncIterable<{ error?: any; return?: R; value?: T }>): AsyncGenerator<T, R, any>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<{ error?: any; return?: R; value?: T }\> | An asynchronous iterable of wrapped result objects. |
</details>

---

## `wrap`

```ts
nz(["hello", "world"]).wrap() // => {value: "hello"}, {value: "world"}, {return: undefined}
```

Wraps an iterator to catch any errors and return them in a result object format.
Instead of throwing, errors are yielded as `{error}` and successful values as `{value}`.

<details><summary>Details</summary>

```ts
function wrap<T>(iterator: AsyncIterable<T>): AsyncGenerator<{ error?: unknown; return?: any; value?: T }>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T\> | An asynchronous iterable. |
</details>

---

# Return Values

## `mapReturn`

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
| `iterator` | AsyncIterable\<T, R\> | An asynchronous iterable. |
| `fn` | (value: R) =\> U | A function that transforms the return value. |
</details>

---

# Conversion

## `consume`

```ts
const consumed = await nz(["a", "b"]).consume()
consumed.list()   // => ["a", "b"]
consumed.return() // => undefined (or iterator's return value)
```

Consumes an async iterator completely, collecting both yielded values and the return value.

Returns a ConsumedPipeline which provides access to both yielded values and return values:
- `.list()` - Returns all yielded values as an array (`T[]`)
- `.return()` - Returns the iterator's return value (`R`)

<details><summary>Details</summary>

```ts
function consume<T, R>(iterator: AsyncIterable<T, R>): Promise<ConsumedPipeline<T, R>>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `iterator` | AsyncIterable\<T, R\> | An asynchronous iterable to consume |
</details>

---

## `fromList`

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
| `list` | T[] | An array of values. |
</details>

---

# Functions

## `aperture`

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
| `source` | Iterable\<T\> | An iterable to create windows over. |
| `n` | number | The size of each window. |
</details>

---

## `window`

```ts
// Simple passthrough with lookahead
nz([1, 2, 3, 4]).window(({ current, upcoming, done }) => {
  if (!done && upcoming.length === 0) {
    return { value: current, advance: 0 } // peek ahead
  }
  return { value: current } // advance by 1 (default)
})
```

Provides a windowed view of the stream with lookahead/lookbehind capabilities.

<details><summary>Details</summary>

```ts
function window<T, U, R = any>(source: Iterable<T, R>, fn: (ctx: { current: T; done: boolean; index: number; past: T[]; upcoming: T[] }) => { advance?: number; value: U }, options?: { maxPast?: number }): AsyncGenerator<U, R>;
```

### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | Iterable\<T, R\> | The async iterable to window over |
| `fn` | (ctx: { current: T; done: boolean; index: number; past: T[]; upcoming: T[] }) =\> { advance?: number; value: U } | Callback receiving context and returning value and advance amount |
| `options` | { maxPast?: number } | Optional configuration |
</details>

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
