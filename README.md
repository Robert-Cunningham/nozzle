**my-ts-lib v0.0.0**

---

# Partial

[![npm version](https://badgen.net/npm/v/my-ts-lib)](https://npm.im/my-ts-lib) [![npm downloads](https://badgen.net/npm/dm/my-ts-lib)](https://npm.im/my-ts-lib)

## Functions

### after()

```ts
function after(src: StringIterable, pattern: RegExp): AsyncIterable<string>
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

| Parameter | Type             | Description                           |
| --------- | ---------------- | ------------------------------------- |
| `src`     | `StringIterable` | stream or iterable to scan            |
| `pattern` | `RegExp`         | first `RegExp` that marks the cut-off |
