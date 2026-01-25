# Nozzle Development Guide

This document consolidates implementation guidelines for developing and maintaining Nozzle.

## Async Error Handling Guidelines

### The Problem

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

### The Solution

**Errors must be thrown during await ticks, not in callback contexts.**

#### Rule: Queue Errors for the Next Await

When using timers or background operations:

1. Catch errors in callbacks and store them
2. Check for stored errors before each yield/await
3. Throw stored errors synchronously during the next await operation

### Examples

#### Problematic Pattern

```ts
export async function* minInterval<T>(source: AsyncIterable<T>, delayMs: number) {
  const iterator = source[Symbol.asyncIterator]()

  while (true) {
    const { value, done } = await iterator.next() // <- Error here escapes try/catch

    if (done) break

    // setTimeout callback context - errors here also escape
    await new Promise((resolve) => setTimeout(resolve, remainingDelay))

    yield value
  }
}
```

**Problem**: If `iterator.next()` throws after a setTimeout, the error happens in a callback context and escapes user try/catch blocks.

#### Correct Pattern (Reference: buffer.ts)

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
    if (error) throw error // <- Thrown during await tick

    // ... yield logic
  }
}
```

#### Fixed minInterval Pattern

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

### Testing Error Handling

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

### Functions That Need This Pattern

#### Recently Fixed

- **minInterval.ts** - Fixed to properly handle iterator errors during timing operations
- **throttle.ts** - Fixed to catch and store errors from background consumer, preventing unhandled rejections

#### Already Correct

- **buffer.ts** - Good example of proper error handling with background consumers
- **asyncMap.ts** - Awaits background input processing to propagate errors

#### Functions Using Timing (All Reviewed)

After reviewing all functions that use `setTimeout`, `Promise.race`, or similar timing mechanisms:

- All current functions properly handle errors through background promise awaiting
- The error handling pattern varies but is effective in each case

#### Needs Review (Future Functions)

Any NEW function that uses:

- `setTimeout` or `setInterval`
- `Promise.race` with user-provided iterators
- Background async operations
- `new Promise()` with callbacks

**Important**: When creating new timing-related functions, follow the patterns established in `buffer.ts`, `throttle.ts`, or the fixed `minInterval.ts`.

### Key Principles

1. **Never throw in a callback** - Always store and rethrow during await
2. **Check stored errors frequently** - Before each yield and major operation
3. **Test error propagation** - Ensure try/catch works as expected
4. **Follow the buffer.ts pattern** - It's a good reference implementation

### Migration Checklist

When fixing a function:

- [ ] Add `storedError: Error | null = null` variable
- [ ] Wrap risky operations in try/catch
- [ ] Store errors instead of throwing immediately
- [ ] Check `storedError` before each yield
- [ ] Add tests for error handling
- [ ] Verify try/catch works for consumers

---

## Implementation Gotchas

### Error Timing in Async Generators

You have to make sure to throw errors DURING an await tick, not randomly when they happen. For example, with `throttle()`, if you throw an error inside a setTimeout it will flow all the way to the surface (i.e. the top level rejected promise handler). Almost certainly the behavior the client wants is to throw when they next `await()`, so they can handle it with lexical try/catch.

### Return Type Handling

You must make sure to handle the return types of iterators (not just their yield types) correctly! Functions like `tap()`, for example, have to return their parent's return type.

---

## New Function Development Guide

### Quick Integration Checklist

When creating a new transform function, ensure you complete ALL of these steps:

- [ ] Create the function file in `src/transforms/yourFunction.ts`
- [ ] Export the function from `src/transforms/index.ts`
- [ ] Add the method to the Pipeline class in `src/pipeline.ts`
- [ ] Create comprehensive tests in `test/yourFunction.test.ts`
- [ ] Add JSDoc documentation with appropriate `@group` tag
- [ ] Follow async error handling guidelines (see above)
- [ ] Run tests and linting before committing

### File Structure & Organization

#### Function Files

- Location: `src/transforms/functionName.ts`
- Export the main function as a named export
- Use descriptive function names that match the file name

#### Test Files

- Location: `test/functionName.test.ts`
- Import from `vitest` for testing framework
- Use helper functions from `test/timing-helpers.ts` for timing-related tests
- Test edge cases: empty sources, single items, error conditions

#### Export Integration

1. **transforms/index.ts**: Add your function export

   ```ts
   export { yourFunction } from "./yourFunction"
   ```

2. **pipeline.ts**: Add method to Pipeline class
   - Generic methods (work with any type T) go in the first section
   - String-specific methods go in the second section with type constraints
   ```ts
   yourFunction(param: SomeType) {
     return new Pipeline<ReturnType>(tx.yourFunction(this.src, param))
   }
   ```

### Documentation Standards

#### JSDoc Requirements

- Add comprehensive JSDoc comments to all exported functions
- Include `@group` tag for categorization:
  - `@group Timing` - for timing-related functions
  - `@group Buffering` - for buffering/batching functions
  - `@group Filtering` - for filtering operations
  - `@group Transformation` - for data transformation
  - `@group Utilities` - for utility functions

#### Example Documentation

````ts
/**
 * Brief description of what the function does.
 * More detailed explanation if needed.
 *
 * @group CategoryName
 * @param source The async iterable source of values.
 * @param param Description of parameter.
 * @returns An async iterable that yields transformed values.
 *
 * @example
 * ```ts
 * const result = yourFunction(source, param)
 * ```
 */
````

### Function Patterns & Conventions

#### Async Generator Pattern

Most transform functions follow this pattern:

```ts
export async function* yourFunction<T>(source: AsyncIterable<T>, ...params): AsyncGenerator<T> {
  for await (const item of source) {
    // Transform logic here
    yield transformedItem
  }
}
```

#### Error Handling

**CRITICAL**: Follow async error handling guidelines above.

- Errors must be thrown during await ticks, not in callbacks
- Use try/catch around iterator operations
- Queue errors to rethrow on next yield if using timers

#### Type Safety

- Use generics for reusable functions: `<T>`
- Constrain types when needed: `<T extends string>`
- Return proper AsyncGenerator types
- Follow existing type patterns from similar functions

### Testing Guidelines

#### Required Test Cases

1. **Basic functionality** - normal operation with typical inputs
2. **Edge cases** - empty sources, single items, boundary conditions
3. **Error handling** - source errors, invalid parameters
4. **Type preservation** - ensure output types match expectations
5. **Return value handling** - test that iterator return values are preserved (use generators with explicit return values and verify with consume().return())
6. **Timing behavior** (for timing functions) - use timing helpers

#### Test Structure Example

```ts
import { describe, expect, test } from "vitest"
import { yourFunction } from "../src/transforms/yourFunction"
import { asList } from "../src/transforms/asList"
import { fromList } from "../src/transforms/fromList"

describe("yourFunction", () => {
  test("basic functionality", async () => {
    const source = fromList(["a", "b", "c"])
    const result = await asList(yourFunction(source, params))
    expect(result).toEqual(expectedOutput)
  })

  test("empty source", async () => {
    const source = fromList([])
    const result = await asList(yourFunction(source, params))
    expect(result).toEqual([])
  })

  test("error handling", async () => {
    const errorSource = async function* () {
      yield "item"
      throw new Error("test error")
    }

    await expect(async () => {
      await asList(yourFunction(errorSource(), params))
    }).rejects.toThrow("test error")
  })
})
```

### Build & Quality Commands

Before committing, always run:

```bash
pnpm test          # Run all tests
pnpm lint          # Check code formatting
pnpm build-fast    # Quick build check
```

### Common Pitfalls

1. **Forgetting exports** - Function works in isolation but not when imported
2. **Missing Pipeline integration** - Function can't be chained fluently
3. **Poor error handling** - Errors escape try/catch blocks
4. **Inadequate testing** - Missing edge cases or error scenarios
5. **Wrong @group tag** - Makes documentation organization inconsistent

### Examples to Reference

- **Simple transform**: `map.ts`, `filter.ts`
- **Timing functions**: `minInterval.ts`, `throttle.ts`
- **Buffering**: `buffer.ts`, `chunk.ts`
- **String-specific**: `split.ts`, `replace.ts`
- **Good error handling**: `buffer.ts`
