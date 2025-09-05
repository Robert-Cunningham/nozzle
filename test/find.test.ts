import { describe, test, expect } from "vitest"
import { find } from "../src/transforms/find"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("find", () => {
  test("should find the first value matching the predicate", async () => {
    const result = await asList(find(fromList(["apple", "banana", "cherry"]), (x: string) => x.startsWith("b")))
    const expected = ["banana"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await asList(find(fromList([]), (x: string) => x.length > 0))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle no matches", async () => {
    const result = await asList(find(fromList(["apple", "banana", "cherry"]), (x: string) => x.startsWith("z")))
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should find the first match when multiple matches exist", async () => {
    const result = await asList(find(fromList(["banana", "blueberry", "blackberry"]), (x: string) => x.startsWith("b")))
    const expected = ["banana"]
    expect(result).toEqual(expected)
  })

  test("should find at the beginning of the stream", async () => {
    const result = await asList(find(fromList(["target", "other", "values"]), (x: string) => x === "target"))
    const expected = ["target"]
    expect(result).toEqual(expected)
  })

  test("should find at the end of the stream", async () => {
    const result = await asList(find(fromList(["other", "values", "target"]), (x: string) => x === "target"))
    const expected = ["target"]
    expect(result).toEqual(expected)
  })

  test("should work with numbers", async () => {
    const result = await asList(find(fromList([1, 3, 5, 8, 10]), (x: number) => x % 2 === 0))
    const expected = [8]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings", async () => {
    const result = await asList(find(fromList(["", "hello", "", "world"]), (x: string) => x === ""))
    const expected = [""]
    expect(result).toEqual(expected)
  })

  test("should stop iterating after finding first match", async () => {
    let callCount = 0
    const predicate = (x: string) => {
      callCount++
      return x === "banana"
    }

    const result = await asList(find(fromList(["apple", "banana", "cherry", "date"]), predicate))
    const expected = ["banana"]

    expect(result).toEqual(expected)
    expect(callCount).toBe(2) // Should only check "apple" and "banana"
  })

  test("should work with complex predicate conditions", async () => {
    const result = await asList(find(fromList(["a", "bb", "ccc", "dddd"]), (x: string) => x.length > 2))
    const expected = ["ccc"]
    expect(result).toEqual(expected)
  })
})
