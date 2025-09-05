import { describe, test, expect } from "vitest"
import { last } from "../src/transforms/last"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("last", () => {
  test("should yield only the last value", async () => {
    const result = await (await consume(last(fromList(["a", "b", "c"])))).list()
    const expected = ["c"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await (await consume(last(fromList([])))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle a source with a single item", async () => {
    const result = await (await consume(last(fromList(["lonely"])))).list()
    const expected = ["lonely"]
    expect(result).toEqual(expected)
  })

  test("should handle empty strings in the source", async () => {
    const result = await (await consume(last(fromList(["a", "b", ""])))).list()
    const expected = [""]
    expect(result).toEqual(expected)
  })
})
