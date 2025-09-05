import { describe, test, expect } from "vitest"
import { find } from "../src/transforms/find"
import { fromList } from "../src/transforms/fromList"

describe("find", () => {
  test("should find the first value matching the predicate", async () => {
    const result = await find(fromList(["apple", "banana", "cherry"]), (x: string) => x.startsWith("b"))
    expect(result).toEqual("banana")
  })

  test("should handle an empty source", async () => {
    const result = await find(fromList([]), (x: string) => x.length > 0)
    expect(result).toBeUndefined()
  })

  test("should handle no matches", async () => {
    const result = await find(fromList(["apple", "banana", "cherry"]), (x: string) => x.startsWith("z"))
    expect(result).toBeUndefined()
  })

  test("should find the first match when multiple matches exist", async () => {
    const result = await find(fromList(["banana", "blueberry", "blackberry"]), (x: string) => x.startsWith("b"))
    expect(result).toEqual("banana")
  })

  test("should find at the beginning of the stream", async () => {
    const result = await find(fromList(["target", "other", "values"]), (x: string) => x === "target")
    expect(result).toEqual("target")
  })

  test("should find at the end of the stream", async () => {
    const result = await find(fromList(["other", "values", "target"]), (x: string) => x === "target")
    expect(result).toEqual("target")
  })

  test("should work with numbers", async () => {
    const result = await find(fromList([1, 3, 5, 8, 10]), (x: number) => x % 2 === 0)
    expect(result).toEqual(8)
  })

  test("should handle empty strings", async () => {
    const result = await find(fromList(["", "hello", "", "world"]), (x: string) => x === "")
    expect(result).toEqual("")
  })

  test("should stop iterating after finding first match", async () => {
    let callCount = 0
    const predicate = (x: string) => {
      callCount++
      return x === "banana"
    }

    const result = await find(fromList(["apple", "banana", "cherry", "date"]), predicate)
    expect(result).toEqual("banana")
    expect(callCount).toBe(2) // Should only check "apple" and "banana"
  })

  test("should work with complex predicate conditions", async () => {
    const result = await find(fromList(["a", "bb", "ccc", "dddd"]), (x: string) => x.length > 2)
    expect(result).toEqual("ccc")
  })
})
