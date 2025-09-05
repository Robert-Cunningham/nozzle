import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { tee } from "../src/transforms/tee"
import { consume } from "../src/transforms/consume"
import { random } from "./helper"

describe("tee", () => {
  test("should split iterator into multiple independent iterators", async () => {
    const [a, b, c] = tee(fromList(["1", "2", "3"]), 3)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()
    const resultsC = await (await consume(c)).list()

    expect(resultsA).toEqual(["1", "2", "3"])
    expect(resultsB).toEqual(["1", "2", "3"])
    expect(resultsC).toEqual(["1", "2", "3"])
  })

  test("should handle empty iterator", async () => {
    const [a, b] = tee(fromList([]), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA).toEqual([])
    expect(resultsB).toEqual([])
  })

  test("should handle single item", async () => {
    const [a] = tee(fromList(["test"]), 1)

    const result = await (await consume(a)).list()

    expect(result).toEqual(["test"])
  })

  test("should work with string data", async () => {
    const [a, b] = tee(fromList(["hello", "world"]), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA).toEqual(["hello", "world"])
    expect(resultsB).toEqual(["hello", "world"])
  })

  test("should work with random generator", async () => {
    const [a, b] = tee(random(10), 2)

    const resultsA = await (await consume(a)).list()
    const resultsB = await (await consume(b)).list()

    expect(resultsA.join("")).toEqual(resultsB.join(""))
    expect(resultsA.join("").length).toBe(10)
  })
})
