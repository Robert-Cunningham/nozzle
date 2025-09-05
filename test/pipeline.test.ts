import { describe, test, expect } from "vitest"
import { nz } from "../src/index"
import { fromList } from "../src/transforms/fromList"

// Helper functions for creating test async iterables
async function* createAsyncIterable<T>(items: T[]): AsyncGenerator<T> {
  for (const item of items) {
    yield item
  }
}

async function* createDelayedAsyncIterable<T>(items: T[], delayMs: number = 10): AsyncGenerator<T> {
  for (const item of items) {
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    yield item
  }
}

describe("Pipeline with nz()", () => {
  describe("Basic Pipeline Creation", () => {
    test("should create pipeline directly from array", async () => {
      const input = ["a", "b", "c"]
      const pipeline = nz(input)
      const consumed = await pipeline.consume()
      const output = consumed.list()
      expect(output).toEqual(input)
    })

    test("should create pipeline from number array", async () => {
      const numbers = [1, 2, 3, 4, 5]
      const pipeline = nz(numbers)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    test("should create pipeline from Set", async () => {
      const set = new Set(["x", "y", "z"])
      const pipeline = nz(set)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["x", "y", "z"])
    })

    test("should create pipeline from string (as char iterable)", async () => {
      const str = "hello"
      const pipeline = nz(str)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["h", "e", "l", "l", "o"])
    })

    test("should create pipeline from Set", async () => {
      const set = new Set([1, 2, 3, 4, 5])
      const pipeline = nz(set)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    test("should create pipeline from Map (iterates over entries)", async () => {
      const map = new Map([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ])
      const pipeline = nz(map)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([
        ["a", 1],
        ["b", 2],
        ["c", 3],
      ])
    })

    test("should create pipeline from array using nz() with fromList", async () => {
      const source = ["a", "b", "c"]
      const pipeline = nz(fromList(source))
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["a", "b", "c"])
    })

    test("should create pipeline from string array", async () => {
      const source = fromList(["hello", "world"])
      const pipeline = nz(source)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["hello", "world"])
    })

    test("should create pipeline from generic typed array", async () => {
      const numbers = [1, 2, 3, 4, 5]
      const pipeline = nz(fromList(numbers))
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    test("should create pipeline from async iterable directly", async () => {
      const source = createAsyncIterable(["x", "y", "z"])
      const pipeline = nz(source)
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["x", "y", "z"])
    })

    test("should handle empty array", async () => {
      const pipeline = nz(fromList([]))
      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([])
    })
  })

  describe("Generic Pipeline Operations", () => {
    test("should chain map operations on array directly", async () => {
      const numbers = [1, 2, 3, 4]
      const pipeline = nz(numbers)
        .map((x) => x * 2)
        .map((x) => x + 1)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([3, 5, 7, 9])
    })

    test("should chain map operations with fromList", async () => {
      const numbers = [1, 2, 3, 4]
      const pipeline = nz(fromList(numbers))
        .map((x) => x * 2)
        .map((x) => x + 1)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([3, 5, 7, 9])
    })

    test("should filter values", async () => {
      const numbers = [1, 2, 3, 4, 5, 6]
      const pipeline = nz(fromList(numbers)).filter((x) => x % 2 === 0)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([2, 4, 6])
    })

    test("should slice values", async () => {
      const items = ["a", "b", "c", "d", "e"]
      const pipeline = nz(fromList(items)).slice(1, 4)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["b", "c", "d"])
    })

    test("should find first matching value", async () => {
      const numbers = [1, 3, 5, 8, 10, 12]
      const pipeline = nz(fromList(numbers))

      const result = await pipeline.find((x) => x % 2 === 0)
      expect(result).toBe(8)
    })

    test("should return undefined when find doesn't match", async () => {
      const numbers = [1, 3, 5, 7]
      const pipeline = nz(fromList(numbers))

      const result = await pipeline.find((x) => x % 2 === 0)
      expect(result).toBeUndefined()
    })

    test("should get first value", async () => {
      const items = ["first", "second", "third"]
      const pipeline = nz(fromList(items))

      const result = await pipeline.first()
      expect(result).toBe("first")
    })

    test("should get last value", async () => {
      const items = ["first", "second", "last"]
      const pipeline = nz(fromList(items))

      const result = await pipeline.last()
      expect(result).toBe("last")
    })

    test("should flatten nested arrays", async () => {
      const nested = [[1, 2], [3, 4], [5]]
      const pipeline = nz(fromList(nested)).flatten()

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([1, 2, 3, 4, 5])
    })

    test("should create apertures", async () => {
      const items = [1, 2, 3, 4, 5]
      const pipeline = nz(fromList(items)).aperture(3)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([
        [1, 2, 3],
        [2, 3, 4],
        [3, 4, 5],
      ])
    })

    test("should use tap for side effects", async () => {
      const items = ["a", "b", "c"]
      const sideEffects: string[] = []

      const pipeline = nz(fromList(items)).tap((x) => sideEffects.push(x.toUpperCase()))

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["a", "b", "c"])
      expect(sideEffects).toEqual(["A", "B", "C"])
    })
  })

  describe("String-Specific Operations", () => {
    test("should accumulate strings", async () => {
      const chunks = ["Hel", "lo ", "Wor", "ld"]
      const pipeline = nz(fromList(chunks)).accumulate()

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["Hel", "Hello ", "Hello Wor", "Hello World"])
    })

    test("should split strings", async () => {
      const text = ["Hello,World", ",How,Are,You"]
      const pipeline = nz(fromList(text)).split(",")

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["Hello", "World", "How", "Are", "You"])
    })

    test("should extract text after pattern", async () => {
      const text = ["prefix", "START", "content1", "content2", "END", "suffix"]
      const pipeline = nz(fromList(text)).after("START")

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["content1", "content2", "END", "suffix"])
    })

    test("should extract text before pattern", async () => {
      const text = ["content1", "content2", "STOP", "ignored1", "ignored2"]
      const pipeline = nz(fromList(text)).before("STOP")

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["content1", "content2"])
    })

    test("should chunk tokens by grouping them", async () => {
      const tokens = ["a", "b", "c", "d", "e", "f"]
      const pipeline = nz(fromList(tokens)).chunk(3)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["abc", "def"])
    })

    test("should compact empty strings", async () => {
      const text = ["hello", "", "world", "", "!"]
      const pipeline = nz(fromList(text)).compact()

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["hello", "world", "!"])
    })

    test("should replace text with regex", async () => {
      const text = ["Hello World"]
      const pipeline = nz(fromList(text)).replace(/o/g, "0")

      const consumed = await pipeline.consume()
      const result = consumed.list()
      const joined = result.join("")
      expect(joined).toBe("Hell0 W0rld")
    })
  })

  describe("Async Iterable Sources", () => {
    test("should work with delayed async iterable", async () => {
      const source = createDelayedAsyncIterable(["slow", "async", "data"], 5)
      const pipeline = nz(source).map((x) => x.toUpperCase())

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["SLOW", "ASYNC", "DATA"])
    })

    test("should chain operations on async iterable", async () => {
      const numbers = createAsyncIterable([1, 2, 3, 4, 5, 6])
      const pipeline = nz(numbers)
        .filter((x) => x % 2 === 0)
        .map((x) => x * 10)
        .slice(0, 2)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([20, 40])
    })

    test("should use asyncMap with async operations", async () => {
      const items = ["a", "b", "c"]
      const pipeline = nz(fromList(items)).asyncMap(async (x) => {
        await new Promise((resolve) => setTimeout(resolve, 1))
        return x.toUpperCase()
      })

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["A", "B", "C"])
    })
  })

  describe("Edge Cases", () => {
    test("should handle empty async iterable", async () => {
      const source = createAsyncIterable([])
      const pipeline = nz(source).map((x) => x)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual([])
    })

    test("should handle single element pipeline", async () => {
      const pipeline = nz(fromList(["single"]))
        .map((x) => x.toUpperCase())
        .filter((x) => x.length > 0)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["SINGLE"])
    })

    test("should return undefined for first() on empty pipeline", async () => {
      const pipeline = nz(fromList([]))
      const result = await pipeline.first()
      expect(result).toBeUndefined()
    })

    test("should return undefined for last() on empty pipeline", async () => {
      const pipeline = nz(fromList([]))
      const result = await pipeline.last()
      expect(result).toBeUndefined()
    })

    test("should work with mixed type transformations", async () => {
      const numbers = [1, 2, 3]
      const pipeline = nz(fromList(numbers))
        .map((x) => x.toString())
        .map((x) => `item-${x}`)

      const consumed = await pipeline.consume()
      const result = consumed.list()
      expect(result).toEqual(["item-1", "item-2", "item-3"])
    })
  })

  describe("Pipeline Consumption", () => {
    test("should iterate using for await", async () => {
      const items = ["a", "b", "c"]
      const pipeline = nz(fromList(items)).map((x) => x.toUpperCase())

      const result: string[] = []
      for await (const item of pipeline) {
        result.push(item)
      }

      expect(result).toEqual(["A", "B", "C"])
    })

    test("should get raw async iterable via value()", async () => {
      const items = [1, 2, 3]
      const pipeline = nz(fromList(items)).map((x) => x * 2)
      const iterable = pipeline.value()

      const result: number[] = []
      for await (const item of iterable) {
        result.push(item)
      }

      expect(result).toEqual([2, 4, 6])
    })

    test("should consume and get both list and return value", async () => {
      const items = [1, 2, 3]
      const pipeline = nz(fromList(items)).map((x) => x * 2)
      const consumed = await pipeline.consume()

      const list = await consumed.list()
      expect(list).toEqual([2, 4, 6])
    })
  })
})
