import { describe, expect, test } from "vitest"
import { first } from "../src/transforms/first"
import { fromList } from "../src/transforms/fromList"
describe("first", () => {
  test("should return only the first value", async () => {
    const result = await first(fromList(["a", "b", "c"]))
    expect(result).toEqual("a")
  })

  test("should handle an empty source", async () => {
    const result = await first(fromList([]))
    expect(result).toBeUndefined()
  })

  test("should handle a source with a single item", async () => {
    const result = await first(fromList(["lonely"]))
    expect(result).toEqual("lonely")
  })

  test("should handle empty strings in the source", async () => {
    const result = await first(fromList(["", "b", "c"]))
    expect(result).toEqual("")
  })
})
