**my-ts-lib v0.0.0**

---

## Classes

### Pipeline\<T\>

Defined in: [pipeline.ts:4](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/pipeline.ts#L4)

#### Type Parameters

| Type Parameter |
| -------------- |
| `T`            |

#### Implements

- `AsyncIterable`\<`T`\>

#### Constructors

##### Constructor

```ts
new Pipeline<T>(src): Pipeline<T>;
```

Defined in: [pipeline.ts:5](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/pipeline.ts#L5)

###### Parameters

| Parameter | Type                 |
| --------- | -------------------- |
| `src`     | `AnyIterable`\<`T`\> |

###### Returns

[`Pipeline`](#pipeline)\<`T`\>

#### Methods

##### \[asyncIterator\]()

```ts
asyncIterator: AsyncIterator<T, any, any>
```

Defined in: [pipeline.ts:17](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/pipeline.ts#L17)

###### Returns

`AsyncIterator`\<`T`, `any`, `any`\>

###### Implementation of

```ts
AsyncIterable.[asyncIterator]
```

##### after()

```ts
after(pattern): Pipeline<string>;
```

Defined in: [pipeline.ts:8](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/pipeline.ts#L8)

###### Parameters

| Parameter | Type     |
| --------- | -------- |
| `pattern` | `RegExp` |

###### Returns

[`Pipeline`](#pipeline)\<`string`\>

##### value()

```ts
value(): AnyIterable<T>;
```

Defined in: [pipeline.ts:13](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/pipeline.ts#L13)

###### Returns

`AnyIterable`\<`T`\>

## Variables

### p

```ts
const p: <T>(src) => Pipeline<T> & typeof tx
```

Defined in: [index.ts:11](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/index.ts#L11)

## Functions

### after()

```ts
function after<T>(src, pattern): AsyncIterable<T>
```

Defined in: [transforms/after.ts:10](https://github.com/Robert-Cunningham/partial/blob/13bf2e98014796b8f841a27e6072095d0d9afae4/src/transforms/after.ts#L10)

Emit everything **after** the first chunk that matches `pattern`.

#### Type Parameters

| Type Parameter         |
| ---------------------- |
| `T` _extends_ `string` |

#### Parameters

| Parameter | Type                 | Description                           |
| --------- | -------------------- | ------------------------------------- |
| `src`     | `AnyIterable`\<`T`\> | stream or iterable to scan            |
| `pattern` | `RegExp`             | first `RegExp` that marks the cut-off |

#### Returns

`AsyncIterable`\<`T`\>

async stream with the leading section removed
