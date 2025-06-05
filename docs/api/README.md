**my-ts-lib v0.0.0**

***

## Classes

### Pipeline\<T\>

#### Implements

- `AsyncIterable`\<`T`\>

#### Constructors

##### Constructor

```ts
new Pipeline<T>(src: AnyIterable<T>): Pipeline<T>;
```

###### Parameters

| Parameter | Type |
| ------ | ------ |
| `src` | `AnyIterable`\<`T`\> |

###### Methods

##### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<T, any, any>;
```

#### Variables

### p

```ts
const p: <T>(src: AnyIterable<T>) => Pipeline<T> & typeof tx;
```

## Functions

### after()

```ts
function after<T>(src: AnyIterable<T>, pattern: RegExp): AsyncIterable<T>;
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
| `src` | `AnyIterable`\<`T`\> | stream or iterable to scan |
| `pattern` | `RegExp` | first `RegExp` that marks the cut-off |

