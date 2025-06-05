**my-ts-lib v0.0.0**

***

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

###### Methods

##### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<string, any, any>;
```

#### Variables

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

