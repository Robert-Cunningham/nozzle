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
function chunk(
   source: AsyncIterable<string>, 
   size: number, 
separator: string): AsyncIterable<string>;
```

Buffers tokens from an async iterable source and yields a single merged token
for every `size` tokens received, joined by the specified `separator`.

#### Parameters

| Parameter | Type | Description |
| ------ | ------ | ------ |
| `source` | `AsyncIterable`\<`string`\> | The async iterable source of strings (tokens). |
| `size` | `number` | The number of tokens to accumulate before yielding a merged token. |
| `separator` | `string` | The string to use when joining tokens. |

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

