import { describe, test, expect } from "vitest"
import { compact } from "../src/transforms/compact"
import { fromList } from "../src/transforms/fromList"
import { consume } from "../src/transforms/consume"

describe("compact", () => {
  test("should filter out empty strings", async () => {
    const result = await (await consume(compact(fromList(["hello", "", "world", ""])))).list()
    const expected = ["hello", "world"]
    expect(result).toEqual(expected)
  })

  test("should handle an empty source", async () => {
    const result = await (await consume(compact(fromList([])))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle source with only empty strings", async () => {
    const result = await (await consume(compact(fromList(["", "", ""])))).list()
    const expected: string[] = []
    expect(result).toEqual(expected)
  })

  test("should handle source with no empty strings", async () => {
    const result = await (await consume(compact(fromList(["hello", "world", "test"])))).list()
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle source with only one non-empty string", async () => {
    const result = await (await consume(compact(fromList(["", "hello", ""])))).list()
    const expected = ["hello"]
    expect(result).toEqual(expected)
  })
})
