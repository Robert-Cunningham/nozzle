# Async Error Handling Guidelines

## The Problem

When working with async generators and timing functions, errors thrown inside callback functions (like `setTimeout`, `Promise.race`, etc.) do NOT get caught by lexical `try/catch` blocks. Instead, they bubble up as unhandled promise rejections.

**This breaks the user experience** because developers expect to be able to handle errors with standard try/catch patterns:

```ts
try {
  for await (const item of minInterval(source, 100)) {
    // process item
  }
} catch (error) {
  // User expects this to catch source errors, but it might not!
}
```

## The Solution

**Errors must be thrown during await ticks, not in callback contexts.**

### Rule: Queue Errors for the Next Await

When using timers or background operations:

1. Catch errors in callbacks and store them
2. Check for stored errors before each yield/await
3. Throw stored errors synchronously during the next await operation

## Examples

### ❌ Problematic Pattern (Current minInterval)

```ts
export async function* minInterval<T>(source: AsyncIterable<T>, delayMs: number) {
  const iterator = source[Symbol.asyncIterator]()

  while (true) {
    const { value, done } = await iterator.next() // ← Error here escapes try/catch

    if (done) break

    // setTimeout callback context - errors here also escape
    await new Promise((resolve) => setTimeout(resolve, remainingDelay))

    yield value
  }
}
```

**Problem**: If `iterator.next()` throws after a setTimeout, the error happens in a callback context and escapes user try/catch blocks.

### ✅ Correct Pattern (Reference: buffer.ts)

```ts
export const buffer = async function* <T>(source: AsyncIterable<T>, n?: number) {
  let error: Error | null = null

  // Background consumer catches and stores errors
  const consumerPromise = (async () => {
    try {
      for await (const item of source) {
        // ... processing
      }
    } catch (err) {
      error = err instanceof Error ? err : new Error(String(err))
    }
  })()

  // Main generator checks for stored errors before each yield
  while (true) {
    if (error) throw error // ← Thrown during await tick

    // ... yield logic
  }
}
```

### ✅ Fixed minInterval Pattern

```ts
export async function* minInterval<T>(source: AsyncIterable<T>, delayMs: number) {
  const iterator = source[Symbol.asyncIterator]()
  let storedError: Error | null = null

  while (true) {
    // Check for stored errors before each operation
    if (storedError) throw storedError

    let result: IteratorResult<T>
    try {
      result = await iterator.next()
    } catch (err) {
      // Store error to throw on next tick
      storedError = err instanceof Error ? err : new Error(String(err))
      continue
    }

    if (result.done) break

    // Timing logic with error checking...
    if (storedError) throw storedError

    yield result.value
  }
}
```

## Testing Error Handling

Always test that errors are properly catchable:

```ts
test("errors from source are properly caught", async () => {
  const errorSource = async function* () {
    yield "item1"
    throw new Error("source error")
  }

  await expect(async () => {
    for await (const item of minInterval(errorSource(), 100)) {
      // Should be able to catch the error here
    }
  }).rejects.toThrow("source error")
})

test("errors thrown during timing operations", async () => {
  // Test that errors don't escape during setTimeout/Promise operations
  const problematicSource = async function* () {
    yield "item1"
    // Simulate error that happens during a timing window
    await new Promise((resolve) =>
      setTimeout(() => {
        resolve("item2")
      }, 50),
    )
    throw new Error("delayed error")
  }

  let caughtError: Error | null = null
  try {
    await asList(minInterval(problematicSource(), 100))
  } catch (err) {
    caughtError = err as Error
  }

  expect(caughtError).toBeTruthy()
  expect(caughtError?.message).toBe("delayed error")
})
```

## Functions That Need This Pattern

### Recently Fixed

- **minInterval.ts** - ✅ Fixed to properly handle iterator errors during timing operations
- **throttle.ts** - ✅ Fixed to catch and store errors from background consumer, preventing unhandled rejections

### Already Correct

- **buffer.ts** - Good example of proper error handling with background consumers
- **asyncMap.ts** - Awaits background input processing to propagate errors

### Functions Using Timing (All Reviewed)

After reviewing all functions that use `setTimeout`, `Promise.race`, or similar timing mechanisms:

- All current functions properly handle errors through background promise awaiting
- The error handling pattern varies but is effective in each case

### Needs Review (Future Functions)

Any NEW function that uses:

- `setTimeout` or `setInterval`
- `Promise.race` with user-provided iterators
- Background async operations
- `new Promise()` with callbacks

**Important**: When creating new timing-related functions, follow the patterns established in `buffer.ts`, `throttle.ts`, or the fixed `minInterval.ts`.

## Key Principles

1. **Never throw in a callback** - Always store and rethrow during await
2. **Check stored errors frequently** - Before each yield and major operation
3. **Test error propagation** - Ensure try/catch works as expected
4. **Follow the buffer.ts pattern** - It's a good reference implementation

## Migration Checklist

When fixing a function:

- [ ] Add `storedError: Error | null = null` variable
- [ ] Wrap risky operations in try/catch
- [ ] Store errors instead of throwing immediately
- [ ] Check `storedError` before each yield
- [ ] Add tests for error handling
- [ ] Verify try/catch works for consumers
