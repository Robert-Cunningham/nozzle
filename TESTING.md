# Testing Guidelines

This document outlines the standard testing patterns for the incremental package to ensure consistency across all test files.

## Test Structure Pattern

Tests should generally follow this structure:

```typescript
import { describe, test, expect } from "vitest"
import { functionUnderTest } from "./functionUnderTest"
import { fromList } from "./fromList"
import { asList } from "./asList"

describe("functionUnderTest", () => {
  test("should do something", async () => {
    const input = fromList(["input", "data"])
    const result = functionUnderTest(input)
    const expected = ["expected", "output"]
    expect(asList(result)).toEqual(expected)
  })
})
```

- Always use `fromList([...])` to create test input streams
- Always use `asList(...)` to convert async iterators to arrays for assertions
- Always include a test with `assertTimingResultEquals`, to make sure that the streaming behavior works.
