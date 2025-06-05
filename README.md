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

