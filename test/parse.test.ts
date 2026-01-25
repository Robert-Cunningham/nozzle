import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { parse } from "../src/transforms/parse"
import { consume } from "../src/transforms/consume"

describe("parse", () => {
  async function collectResults<T>(asyncIterable: AsyncIterable<string | T>) {
    const results: (string | T)[] = []
    for await (const result of asyncIterable) {
      results.push(result)
    }
    return results
  }

  describe("UUID example from plan", () => {
    test("should extract UUIDs as objects", async () => {
      const input = fromList(["Now I'm taking uuid-asdf-flkj and adding it to uuid-fslkj-alkjlsf."])
      const results = await collectResults(parse(input, /uuid-(?<id>\w+)-\w+/g, (m) => ({ id: m.groups!.id })))

      expect(results).toEqual(["Now I'm taking ", { id: "asdf" }, " and adding it to ", { id: "fslkj" }, "."])
    })
  })

  describe("named capture groups", () => {
    test("should extract multiple named groups", async () => {
      const input = fromList(["User: john_doe, Age: 30"])
      const results = await collectResults(
        parse(input, /User: (?<name>\w+), Age: (?<age>\d+)/g, (m) => ({
          name: m.groups!.name,
          age: parseInt(m.groups!.age, 10),
        })),
      )

      expect(results).toEqual([{ name: "john_doe", age: 30 }])
    })

    test("should handle optional named groups", async () => {
      const input = fromList(["hello-world and foo"])
      const results = await collectResults(
        parse(input, /(?<first>\w+)(-(?<second>\w+))?/g, (m) => ({
          first: m.groups!.first,
          second: m.groups!.second || null,
        })),
      )

      expect(results).toEqual([
        { first: "hello", second: "world" },
        " ",
        { first: "and", second: null },
        " ",
        { first: "foo", second: null },
      ])
    })
  })

  describe("multiple matches", () => {
    test("should handle multiple matches in sequence", async () => {
      const input = fromList(["1 2 3"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual([1, " ", 2, " ", 3])
    })

    test("should handle adjacent matches", async () => {
      const input = fromList(["abc123def456"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual(["abc", 123, "def", 456])
    })
  })

  describe("no matches", () => {
    test("should return all text when no matches", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual(["hello world"])
    })
  })

  describe("transform functions", () => {
    test("should support complex transformations", async () => {
      const input = fromList(["price: $100, quantity: 5"])
      const results = await collectResults(
        parse(input, /(\w+): (\$?\d+)/g, (m) => ({
          field: m[1],
          value: m[2].startsWith("$") ? parseInt(m[2].slice(1), 10) : parseInt(m[2], 10),
        })),
      )

      expect(results).toEqual([{ field: "price", value: 100 }, ", ", { field: "quantity", value: 5 }])
    })

    test("should support returning arrays", async () => {
      const input = fromList(["a=1,b=2"])
      const results = await collectResults(
        parse(input, /(\w+)=(\d+)/g, (m) => [m[1], parseInt(m[2], 10)] as [string, number]),
      )

      expect(results).toEqual([["a", 1], ",", ["b", 2]])
    })

    test("should support returning primitives", async () => {
      const input = fromList(["The answer is 42"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual(["The answer is ", 42])
    })
  })

  describe("streaming behavior", () => {
    test("should handle fragmented input", async () => {
      const input = fromList(["us", "er", "-", "12", "3"])
      const results = await collectResults(parse(input, /user-(\d+)/g, (m) => ({ userId: parseInt(m[1], 10) })))

      expect(results).toEqual([{ userId: 123 }])
    })

    test("should handle text before and after matches across chunks", async () => {
      const input = fromList(["prefix-123-suffix"])
      const results = await collectResults(parse(input, /-(\d+)-/g, (m) => parseInt(m[1], 10)))

      expect(results).toEqual(["prefix", 123, "suffix"])
    })
  })

  describe("real-world use cases", () => {
    test("should parse log entries", async () => {
      const input = fromList([
        "[2024-01-15 10:30:45] ERROR: Connection failed\n",
        "[2024-01-15 10:30:46] INFO: Retrying...\n",
      ])
      const results = await collectResults(
        parse(input, /\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\] (\w+): ([^\n]+)/g, (m) => ({
          timestamp: m[1],
          level: m[2],
          message: m[3],
        })),
      )

      expect(results).toEqual([
        { timestamp: "2024-01-15 10:30:45", level: "ERROR", message: "Connection failed" },
        "\n",
        { timestamp: "2024-01-15 10:30:46", level: "INFO", message: "Retrying..." },
        "\n",
      ])
    })

    test("should parse CSV-like data", async () => {
      const input = fromList(["name,age,city\njohn,30,NYC\njane,25,LA"])
      const results = await collectResults(
        parse(input, /(\w+),(\d+),(\w+)/g, (m) => ({
          name: m[1],
          age: parseInt(m[2], 10),
          city: m[3],
        })),
      )

      expect(results).toEqual([
        "name,age,city\n",
        { name: "john", age: 30, city: "NYC" },
        "\n",
        { name: "jane", age: 25, city: "LA" },
      ])
    })

    test("should extract and transform URLs", async () => {
      const input = fromList(["Visit https://example.com/path?q=test or http://api.example.org/v1"])
      const results = await collectResults(
        parse(input, /(https?):\/\/([^\/\s]+)(\/[^\s]*)?/g, (m) => ({
          protocol: m[1],
          host: m[2],
          path: m[3] || "/",
        })),
      )

      expect(results).toEqual([
        "Visit ",
        { protocol: "https", host: "example.com", path: "/path?q=test" },
        " or ",
        { protocol: "http", host: "api.example.org", path: "/v1" },
      ])
    })
  })

  describe("edge cases", () => {
    test("should handle empty input", async () => {
      const input = fromList([])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual([])
    })

    test("should handle match at very start", async () => {
      const input = fromList(["123 abc"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual([123, " abc"])
    })

    test("should handle match at very end", async () => {
      const input = fromList(["abc 123"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual(["abc ", 123])
    })

    test("should handle entire input as single match", async () => {
      const input = fromList(["12345"])
      const results = await collectResults(parse(input, /\d+/g, (m) => parseInt(m[0], 10)))

      expect(results).toEqual([12345])
    })
  })
})
