import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { last } from "../src/transforms/last"
describe("last", () => {
  test("should return only the last value", async () => {
    const result = await last(fromList(["a", "b", "c"]))
    expect(result).toEqual("c")
  })

  test("should handle an empty source", async () => {
    const result = await last(fromList([]))
    expect(result).toBeUndefined()
  })

  test("should handle a source with a single item", async () => {
    const result = await last(fromList(["lonely"]))
    expect(result).toEqual("lonely")
  })

  test("should handle empty strings in the source", async () => {
    const result = await last(fromList(["a", "b", ""]))
    expect(result).toEqual("")
  })
})
