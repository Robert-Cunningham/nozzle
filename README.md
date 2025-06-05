# Partial

[![npm version](https://badgen.net/npm/v/partialjs)](https://npm.im/partialjs) [![npm downloads](https://badgen.net/npm/dm/partialjs)](https://npm.im/partialjs)

## Functions

### accumulate()

```ts
function accumulate(iterator: AsyncIterable<string>): AsyncGenerator<string, void, unknown>;
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

### after()

```ts
function after(source: StringIterable, pattern: RegExp): AsyncIterable<string>;
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
| `pattern` | `RegExp` | first `RegExp` that marks the cut-off |

### asList()

```ts
function asList(iterator: AsyncIterable<string>): Promise<string[]>;
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
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

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

### chunk()

```ts
function chunk(source: AsyncIterable<string>, size: number): AsyncIterable<string>;
```

Groups input tokens into chunks of the specified size and yields the joined result.
Takes N input items and yields N/size output items, where each output is the concatenation of size input items.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings (tokens). |
| `size` | `number` | The number of input tokens to group together in each output chunk. |

### diff()

```ts
function diff(iterator: AsyncIterable<string>): AsyncGenerator<string, void, unknown>;
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

### first()

```ts
function first(iterator: AsyncIterable<string>): AsyncGenerator<string, void, unknown>;
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
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

### fromList()

```ts
function fromList(list: string[]): AsyncGenerator<string>;
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
| `list` | `string`[] | An array of strings. |

### last()

```ts
function last(iterator: AsyncIterable<string>): AsyncGenerator<string, void, unknown>;
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
| `iterator` | `AsyncIterable`\<`string`\> | An asynchronous iterable of strings. |

### split()

```ts
function split(source: AsyncIterable<string>, separator: string): AsyncIterable<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` | The string separator to split by. |

### splitAfter()

```ts
function splitAfter(source: AsyncIterable<string>, separator: string): AsyncIterable<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the end of each part (except the last).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` | The string separator to split by. |

### splitBefore()

```ts
function splitBefore(source: AsyncIterable<string>, separator: string): AsyncIterable<string>;
```

Takes incoming chunks, merges them, and then splits them by a string separator,
keeping the separator at the beginning of each part (except the first).

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings. |
| `separator` | `string` | The string separator to split by. |

### tee()

```ts
function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncIterable<T, any, any>[];
```

#### Parameters

| Parameter | Type |
| ------ | ------ |
| `iterator` | `AsyncIterator`\<`T`\> |
| `n` | `number` |

