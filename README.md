**my-ts-lib v0.0.0**

***

# Partial

[![npm version](https://badgen.net/npm/v/my-ts-lib)](https://npm.im/my-ts-lib) [![npm downloads](https://badgen.net/npm/dm/my-ts-lib)](https://npm.im/my-ts-lib)

## Classes

### Pipeline

#### Implements

- `AsyncIterable`\<`string`\>

#### Constructors

##### Constructor

```ts
new Pipeline(src: StringIterable): Pipeline;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `src` | `StringIterable` |

###### Returns

[`Pipeline`](#pipeline)

#### Methods

##### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<string, any, any>;
```

###### Returns

`AsyncIterator`\<`string`, `any`, `any`\>

###### Implementation of

```ts
AsyncIterable.[asyncIterator]
```

##### after()

```ts
after(pattern: RegExp): Pipeline;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `pattern` | `RegExp` |

###### Returns

[`Pipeline`](#pipeline)

##### value()

```ts
value(): StringIterable;
```

###### Returns

`StringIterable`

## Variables

### p

```ts
const p: (src: StringIterable) => Pipeline & typeof tx;
```

## Functions

### after()

```ts
function after(src: StringIterable, pattern: RegExp): AsyncIterable<string>;
```

Emit everything **after** the first chunk that matches `pattern`.

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
| `src` | `StringIterable` | stream or iterable to scan |
| `pattern` | `RegExp` | first `RegExp` that marks the cut-off |

#### Returns

`AsyncIterable`\<`string`\>

async stream with the leading section removed
