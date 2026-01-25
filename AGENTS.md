# Nozzle Development Guide

## Adding New Functions

### Checklist

1. Create `src/transforms/yourFunction.ts`
2. Export from `src/transforms/index.ts`
3. Add method to Pipeline class in `src/pipeline.ts`
4. Create tests in `test/yourFunction.test.ts`
5. Add JSDoc with `@group` tag (Timing, Buffering, Filtering, Transformation, or Utilities)
6. Run `pnpm test && pnpm lint && pnpm build-fast`

### Basic Pattern

```ts
export async function* yourFunction<T>(source: AsyncIterable<T>, param: P): AsyncGenerator<T> {
  for await (const item of source) {
    yield transformedItem
  }
}
```

### Reference Examples

- Simple transforms: `map.ts`, `filter.ts`
- Timing: `minInterval.ts`, `throttle.ts`
- Buffering: `buffer.ts`, `chunk.ts`
- String-specific: `split.ts`, `replace.ts`

---

## Async Error Handling

**Critical rule**: Errors must be thrown during await ticks, not in callbacks.

Errors in `setTimeout`/`Promise.race` callbacks escape user try/catch blocks. Instead, store errors and rethrow on the next await:

```ts
export async function* myTimingFunction<T>(source: AsyncIterable<T>) {
  let error: Error | null = null

  const consumer = (async () => {
    try {
      for await (const item of source) {
        /* ... */
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
    }
  })()

  while (true) {
    if (error) throw error // Thrown during await tick - catchable by user
    // ... yield logic
  }
}
```

**When to apply**: Any function using `setTimeout`, `setInterval`, `Promise.race`, or background async operations.

**Reference**: `buffer.ts` has the canonical error handling pattern.

---

## Testing Requirements

1. Basic functionality with typical inputs
2. Edge cases: empty sources, single items, boundaries
3. Error handling: source errors must be catchable
4. Return value preservation: verify with `consume().return()`
5. Timing behavior (if applicable): use `test/timing-helpers.ts`

---

## Gotchas

- **Return types**: Functions like `tap()` must pass through parent's return type, not just yield type
- **Forgetting exports**: Add to both `transforms/index.ts` AND `pipeline.ts`
- **Pipeline integration**: Generic methods go first in Pipeline class; string-specific methods go in second section with type constraints
