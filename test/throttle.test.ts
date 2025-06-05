import { describe, test, expect } from "vitest"
import { throttle } from "../src/transforms/throttle"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("throttle", () => {
  test("should queue and yield all values with throttling", async () => {
    const values = ["a", "b", "c", "d"]
    const source = fromList(values)
    const throttled = throttle(source, 10) // Short interval for testing
    
    const result = await asList(throttled)
    expect(result).toEqual(["a", "b", "c", "d"]) // All values preserved
  })

  test("should yield immediately for first value", async () => {
    const values = ["first"]
    const source = fromList(values)
    const throttled = throttle(source, 100)
    
    const result = await asList(throttled)
    expect(result).toEqual(["first"])
  })

  test("should handle empty source", async () => {
    const source = fromList([])
    const throttled = throttle(source, 100)
    
    const result = await asList(throttled)
    expect(result).toEqual([])
  })

  test("should preserve all values in order", async () => {
    const values = ["a", "b", "c", "d", "e"]
    const source = fromList(values)
    const throttled = throttle(source, 1) // Very short interval
    
    const result = await asList(throttled)
    expect(result).toEqual(["a", "b", "c", "d", "e"])
  })

  test("should work with different data types", async () => {
    const values = [1, 2, 3, 4, 5]
    const source = fromList(values)
    const throttled = throttle(source, 1) // Very short interval
    
    const result = await asList(throttled)
    expect(result).toEqual([1, 2, 3, 4, 5]) // All values preserved
  })

  test("should handle zero interval", async () => {
    const values = ["a", "b", "c"]
    const source = fromList(values)
    const throttled = throttle(source, 0)
    
    const result = await asList(throttled)
    expect(result).toEqual(["a", "b", "c"]) // All values should pass through
  })

  test("should handle single value", async () => {
    const source = fromList(["only"])
    const throttled = throttle(source, 100)
    
    const result = await asList(throttled)
    expect(result).toEqual(["only"])
  })

  test("should throttle timing between yields", async () => {
    const values = ["a", "b", "c"]
    const source = fromList(values)
    const throttled = throttle(source, 50) // 50ms interval
    
    const start = Date.now()
    const result = await asList(throttled)
    const duration = Date.now() - start
    
    expect(result).toEqual(["a", "b", "c"])
    // Should take at least 100ms (2 intervals between 3 items)
    expect(duration).toBeGreaterThanOrEqual(90) // Allow some tolerance
  })
})