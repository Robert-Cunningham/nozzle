import { describe, it, expect } from "vitest"
import { aperture } from "../src/transforms/aperture"
import { fromList } from "../src/transforms/fromList"

describe("aperture", () => {
  it("should create sliding windows of size 2", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = aperture(source, 2)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([
      [1, 2],
      [2, 3],
      [3, 4],
      [4, 5],
    ])
  })

  it("should create sliding windows of size 3", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = aperture(source, 3)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([
      [1, 2, 3],
      [2, 3, 4],
      [3, 4, 5],
    ])
  })

  it("should return empty for window size larger than source", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = aperture(source, 7)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([])
  })

  it("should return empty for window size 0", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = aperture(source, 0)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([])
  })

  it("should return empty for negative window size", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = aperture(source, -1)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([])
  })

  it("should handle empty source", async () => {
    const source = fromList<number>([])
    const windowed = aperture(source, 2)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([])
  })

  it("should handle single item source", async () => {
    const source = fromList([1])
    const windowed = aperture(source, 2)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([])
  })

  it("should work with strings", async () => {
    const source = fromList(["a", "b", "c", "d"])
    const windowed = aperture(source, 2)

    const result: string[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    expect(result).toEqual([
      ["a", "b"],
      ["b", "c"],
      ["c", "d"],
    ])
  })

  it("should create independent window arrays", async () => {
    const source = fromList([1, 2, 3])
    const windowed = aperture(source, 2)

    const result: number[][] = []
    for await (const window of windowed) {
      result.push(window)
    }

    // Modify first window to ensure they're independent
    result[0][0] = 999

    expect(result).toEqual([
      [999, 2],
      [2, 3],
    ])
    expect(result[0]).not.toBe(result[1])
  })
})
