import { describe, expect, test } from "vitest"
import { at } from "./at"
import { fromList } from "./fromList"

describe("at", () => {
  test("should return element at positive index", async () => {
    const result = await at(fromList(["a", "b", "c", "d", "e"]), 2)
    expect(result).toBe("c")

    const firstResult = await at(fromList(["hello", "world", "test"]), 0)
    expect(firstResult).toBe("hello")

    const lastResult = await at(fromList(["x", "y", "z"]), 2)
    expect(lastResult).toBe("z")
  })

  test("should return element at negative index (counting from end)", async () => {
    const result = await at(fromList(["a", "b", "c", "d", "e"]), -1)
    expect(result).toBe("e")

    const secondToLastResult = await at(fromList(["hello", "world", "test"]), -2)
    expect(secondToLastResult).toBe("world")

    const thirdToLastResult = await at(fromList(["w", "x", "y", "z"]), -3)
    expect(thirdToLastResult).toBe("x")
  })

  test("should return undefined for out of bounds indices", async () => {
    // Positive index out of bounds
    const positiveResult = await at(fromList(["a", "b", "c"]), 10)
    expect(positiveResult).toBeUndefined()

    // Negative index out of bounds
    const negativeResult = await at(fromList(["a", "b", "c"]), -5)
    expect(negativeResult).toBeUndefined()

    // Empty stream
    const emptyResult = await at(fromList([]), 0)
    expect(emptyResult).toBeUndefined()

    // Empty stream with negative index
    const emptyNegativeResult = await at(fromList([]), -1)
    expect(emptyNegativeResult).toBeUndefined()
  })
})
