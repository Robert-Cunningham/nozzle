**my-ts-lib v0.0.0**

***

# my-ts-lib v0.0.0

## Classes

### Pipeline\<T\>

Defined in: [pipeline.ts:4](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/pipeline.ts#L4)

#### Type Parameters

##### T

`T`

#### Implements

- `AsyncIterable`\<`T`\>

#### Constructors

##### Constructor

> **new Pipeline**\<`T`\>(`src`): [`Pipeline`](#pipeline)\<`T`\>

Defined in: [pipeline.ts:5](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/pipeline.ts#L5)

###### Parameters

###### src

`AnyIterable`\<`T`\>

###### Returns

[`Pipeline`](#pipeline)\<`T`\>

#### Methods

##### \[asyncIterator\]()

> **\[asyncIterator\]**(): `AsyncIterator`\<`T`, `any`, `any`\>

Defined in: [pipeline.ts:17](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/pipeline.ts#L17)

###### Returns

`AsyncIterator`\<`T`, `any`, `any`\>

###### Implementation of

`AsyncIterable.[asyncIterator]`

##### after()

> **after**(`pattern`): [`Pipeline`](#pipeline)\<`string`\>

Defined in: [pipeline.ts:8](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/pipeline.ts#L8)

###### Parameters

###### pattern

`RegExp`

###### Returns

[`Pipeline`](#pipeline)\<`string`\>

##### value()

> **value**(): `AnyIterable`\<`T`\>

Defined in: [pipeline.ts:13](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/pipeline.ts#L13)

###### Returns

`AnyIterable`\<`T`\>

## Variables

### p

> `const` **p**: \<`T`\>(`src`) => [`Pipeline`](#pipeline)\<`T`\> & *typeof* `tx`

Defined in: [index.ts:11](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/index.ts#L11)

## Functions

### after()

> **after**\<`T`\>(`src`, `pattern`): `AsyncIterable`\<`T`\>

Defined in: [transforms/after.ts:10](https://github.com/Robert-Cunningham/partial/blob/ee430098f5401b046db6a637f4a926420101ad8c/src/transforms/after.ts#L10)

Emit everything **after** the first chunk that matches `pattern`.

#### Type Parameters

##### T

`T` *extends* `string`

#### Parameters

##### src

`AnyIterable`\<`T`\>

stream or iterable to scan

##### pattern

`RegExp`

first `RegExp` that marks the cut-off

#### Returns

`AsyncIterable`\<`T`\>

async stream with the leading section removed
