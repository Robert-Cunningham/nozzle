# Testing Guidelines

This document outlines the standard testing patterns for the incremental package to ensure consistency across all test files.

## Test Structure Pattern

All tests should follow this standardized structure:

```typescript
import { describe, test, expect } from "vitest"
import { functionUnderTest } from "./functionUnderTest"
import { fromList } from "./fromList"
import { asList } from "./asList"

describe("functionUnderTest", () => {
  test("should do something", async () => {
    const result = await asList(functionUnderTest(fromList(["input", "data"])))
    const expected = ["expected", "output"]
    expect(result).toEqual(expected)
  })
})
```

## Key Principles

### 1. Use Package Utilities
- **Always use `fromList([...])` to create test input streams**
- **Always use `asList(...)` to convert async iterators to arrays for assertions**
- **Never import external testing utilities** - use the package's own functions

### 2. Standard Pattern
Every test should follow the pattern:
```typescript
const result = await asList(transformFunction(fromList([input_array])))
const expected = [expected_array]
expect(result).toEqual(expected)
```

### 3. For String-Returning Functions
For functions that return strings (like `asString`), use:
```typescript
const result = await asString(fromList([input_array]))
expect(result).toBe("expected_string")
```

## Test Cases to Include

Every transform function should include these standard test cases:

1. **Normal operation** - Test with typical input
2. **Empty input** - Test with `fromList([])`
3. **Single item** - Test with `fromList(["single"])`
4. **Edge cases** - Test with empty strings, special characters, etc.

## Examples

### Transform Function Test
```typescript
// accumulate.test.ts
test("should yield the accumulated string at each step", async () => {
  const result = await asList(accumulate(fromList(["a", "b", "c"])))
  const expected = ["a", "ab", "abc"]
  expect(result).toEqual(expected)
})
```

### Utility Function Test
```typescript
// asString.test.ts
test("should accumulate all strings into one", async () => {
  const result = await asString(fromList(["Hello", " ", "World", "!"]))
  expect(result).toBe("Hello World!")
})
```

## Benefits of This Pattern

1. **Consistency** - All tests follow the same structure
2. **Self-contained** - Tests only use the package's own utilities
3. **Readable** - Clear input → transformation → expected output flow
4. **Maintainable** - Easy to understand and modify tests

## Migration Notes

When updating existing tests:
- Replace external `aiter()` calls with `fromList()`
- Replace `assertAsyncIterableEqual()` with `asList()` + `expect().toEqual()`
- Simplify to the single-line pattern where possible