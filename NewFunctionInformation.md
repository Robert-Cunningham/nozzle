# New Function Development Guide

This document provides essential information for developers adding new functions to the nozzle-js library.

## Quick Integration Checklist

When creating a new transform function, ensure you complete ALL of these steps:

- [ ] Create the function file in `src/transforms/yourFunction.ts`
- [ ] Export the function from `src/transforms/index.ts`
- [ ] Add the method to the Pipeline class in `src/pipeline.ts`
- [ ] Create comprehensive tests in `test/yourFunction.test.ts`
- [ ] Add JSDoc documentation with appropriate `@group` tag
- [ ] Follow async error handling guidelines (see ASYNC_ERROR_HANDLING.md)
- [ ] Run tests and linting before committing

## File Structure & Organization

### Function Files

- Location: `src/transforms/functionName.ts`
- Export the main function as a named export
- Use descriptive function names that match the file name

### Test Files

- Location: `test/functionName.test.ts`
- Import from `vitest` for testing framework
- Use helper functions from `test/timing-helpers.ts` for timing-related tests
- Test edge cases: empty sources, single items, error conditions

### Export Integration

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

## Documentation Standards

### JSDoc Requirements

- Add comprehensive JSDoc comments to all exported functions
- Include `@group` tag for categorization:
  - `@group Timing` - for timing-related functions
  - `@group Buffering` - for buffering/batching functions
  - `@group Filtering` - for filtering operations
  - `@group Transformation` - for data transformation
  - `@group Utilities` - for utility functions

### Example Documentation

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

## Function Patterns & Conventions

### Async Generator Pattern

Most transform functions follow this pattern:

```ts
export async function* yourFunction<T>(source: AsyncIterable<T>, ...params): AsyncGenerator<T> {
  for await (const item of source) {
    // Transform logic here
    yield transformedItem
  }
}
```

### Error Handling

**CRITICAL**: Follow async error handling guidelines in ASYNC_ERROR_HANDLING.md

- Errors must be thrown during await ticks, not in callbacks
- Use try/catch around iterator operations
- Queue errors to rethrow on next yield if using timers

### Type Safety

- Use generics for reusable functions: `<T>`
- Constrain types when needed: `<T extends string>`
- Return proper AsyncGenerator types
- Follow existing type patterns from similar functions

## Testing Guidelines

### Required Test Cases

1. **Basic functionality** - normal operation with typical inputs
2. **Edge cases** - empty sources, single items, boundary conditions
3. **Error handling** - source errors, invalid parameters
4. **Type preservation** - ensure output types match expectations
5. **Timing behavior** (for timing functions) - use timing helpers

### Test Structure Example

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

## Build & Quality Commands

Before committing, always run:

```bash
pnpm test          # Run all tests
pnpm lint          # Check code formatting
pnpm build-fast    # Quick build check
```

## Common Pitfalls

1. **Forgetting exports** - Function works in isolation but not when imported
2. **Missing Pipeline integration** - Function can't be chained fluently
3. **Poor error handling** - Errors escape try/catch blocks (see ASYNC_ERROR_HANDLING.md)
4. **Inadequate testing** - Missing edge cases or error scenarios
5. **Wrong @group tag** - Makes documentation organization inconsistent

## Examples to Reference

- **Simple transform**: `map.ts`, `filter.ts`
- **Timing functions**: `minInterval.ts`, `throttle.ts`
- **Buffering**: `buffer.ts`, `chunk.ts`
- **String-specific**: `split.ts`, `replace.ts`
- **Good error handling**: `buffer.ts`
