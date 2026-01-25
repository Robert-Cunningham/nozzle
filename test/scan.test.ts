import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { scan, ScanResult } from "../src/transforms/scan"
import { consume } from "../src/transforms/consume"

describe("scan", () => {
  async function collectResults(asyncIterable: AsyncIterable<ScanResult>) {
    const results: ScanResult[] = []
    for await (const result of asyncIterable) {
      results.push(result)
    }
    return results
  }

  describe("basic text/match interleaving", () => {
    test("should yield text and match objects interleaved", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(scan(input, /world/g))

      expect(results).toEqual([{ text: "hello " }, { match: expect.arrayContaining(["world"]) }])
    })

    test("should yield only text when no matches", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(scan(input, /xyz/g))

      expect(results).toEqual([{ text: "hello world" }])
    })

    test("should yield only match when entire input matches", async () => {
      const input = fromList(["hello"])
      const results = await collectResults(scan(input, /hello/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["hello"]) }])
    })

    test("should handle multiple matches", async () => {
      const input = fromList(["a1b2c3"])
      const results = await collectResults(scan(input, /\d/g))

      expect(results).toEqual([
        { text: "a" },
        { match: expect.arrayContaining(["1"]) },
        { text: "b" },
        { match: expect.arrayContaining(["2"]) },
        { text: "c" },
        { match: expect.arrayContaining(["3"]) },
      ])
    })
  })

  describe("global vs non-global behavior", () => {
    test("global regex should match all occurrences", async () => {
      const input = fromList(["a", "bc", "a", "bc"])
      const results = await collectResults(scan(input, /a/g))

      expect(results).toEqual([
        { match: expect.arrayContaining(["a"]) },
        { text: "bc" },
        { match: expect.arrayContaining(["a"]) },
        { text: "bc" },
      ])
    })

    test("non-global regex should match only first occurrence", async () => {
      const input = fromList(["a", "bc", "a", "bc"])
      const results = await collectResults(scan(input, /a/))

      expect(results).toEqual([{ match: expect.arrayContaining(["a"]) }, { text: "bc" }, { text: "a" }, { text: "bc" }])
    })
  })

  describe("edge cases", () => {
    test("should handle empty input", async () => {
      const input = fromList([])
      const results = await collectResults(scan(input, /test/g))

      expect(results).toEqual([])
    })

    test("should handle empty chunks", async () => {
      const input = fromList(["", "hello", "", "world", ""])
      const results = await collectResults(scan(input, /hello/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["hello"]) }, { text: "world" }])
    })

    test("should handle pattern at start of input", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(scan(input, /hello/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["hello"]) }, { text: " world" }])
    })

    test("should handle pattern at end of input", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(scan(input, /world/g))

      expect(results).toEqual([{ text: "hello " }, { match: expect.arrayContaining(["world"]) }])
    })

    test("should handle pattern spanning multiple chunks", async () => {
      const input = fromList(["hel", "lo"])
      const results = await collectResults(scan(input, /hello/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["hello"]) }])
    })
  })

  describe("buffer boundary conditions", () => {
    test("should handle single character chunks", async () => {
      const input = fromList(["h", "e", "l", "l", "o"])
      const results = await collectResults(scan(input, /hello/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["hello"]) }])
    })

    test("should handle pattern split across chunks", async () => {
      const input = fromList(["ab", "cd", "ef"])
      const results = await collectResults(scan(input, /cde/g))

      expect(results).toEqual([{ text: "ab" }, { match: expect.arrayContaining(["cde"]) }, { text: "f" }])
    })

    test("should handle multiple patterns across chunk boundaries", async () => {
      const input = fromList(["a", "1", "b", "2", "c"])
      const results = await collectResults(scan(input, /\d/g))

      expect(results).toEqual([
        { text: "a" },
        { match: expect.arrayContaining(["1"]) },
        { text: "b" },
        { match: expect.arrayContaining(["2"]) },
        { text: "c" },
      ])
    })
  })

  describe("greedy vs non-greedy", () => {
    test("should handle greedy quantifiers", async () => {
      const input = fromList(["aaa"])
      const results = await collectResults(scan(input, /a+/g))

      expect(results).toEqual([{ match: expect.arrayContaining(["aaa"]) }])
    })

    test("should handle non-greedy quantifiers", async () => {
      const input = fromList(["<div>text</div>"])
      const results = await collectResults(scan(input, /<.*?>/g))

      expect(results).toEqual([
        { match: expect.arrayContaining(["<div>"]) },
        { text: "text" },
        { match: expect.arrayContaining(["</div>"]) },
      ])
    })
  })

  describe("capture groups", () => {
    test("should include capture groups in match", async () => {
      const input = fromList(["uuid-abc-123"])
      const results = await collectResults(scan(input, /uuid-(\w+)-(\w+)/g))

      expect(results).toHaveLength(1)
      expect(results[0]).toHaveProperty("match")
      const match = (results[0] as { match: RegExpExecArray }).match
      expect(match[0]).toBe("uuid-abc-123")
      expect(match[1]).toBe("abc")
      expect(match[2]).toBe("123")
    })

    test("should include named capture groups in match", async () => {
      const input = fromList(["uuid-abc-123"])
      const results = await collectResults(scan(input, /uuid-(?<id>\w+)-(?<suffix>\w+)/g))

      expect(results).toHaveLength(1)
      const match = (results[0] as { match: RegExpExecArray }).match
      expect(match.groups).toEqual({ id: "abc", suffix: "123" })
    })
  })

  describe("supported regex features", () => {
    test("should handle character classes", async () => {
      const input = fromList(["a1b2c3"])
      const results = await collectResults(scan(input, /[0-9]/g))

      expect(results).toHaveLength(6)
    })

    test("should handle alternation", async () => {
      const input = fromList(["cat or dog"])
      const results = await collectResults(scan(input, /cat|dog/g))

      expect(results).toEqual([
        { match: expect.arrayContaining(["cat"]) },
        { text: " or " },
        { match: expect.arrayContaining(["dog"]) },
      ])
    })

    test("should handle word boundaries", async () => {
      const input = fromList(["hello world"])
      const results = await collectResults(scan(input, /\bworld\b/g))

      expect(results).toEqual([{ text: "hello " }, { match: expect.arrayContaining(["world"]) }])
    })

    test("should handle case-insensitive flag", async () => {
      const input = fromList(["Hello WORLD"])
      const results = await collectResults(scan(input, /hello/gi))

      expect(results).toEqual([{ match: expect.arrayContaining(["Hello"]) }, { text: " WORLD" }])
    })

    test("should handle dotall flag (s)", async () => {
      const input = fromList(["line1\nline2"])
      const results = await collectResults(scan(input, /line1.line2/gs))

      expect(results).toEqual([{ match: expect.arrayContaining(["line1\nline2"]) }])
    })
  })

  describe("empty pattern handling", () => {
    test("should handle empty pattern", async () => {
      const input = fromList(["abc"])
      const results = await collectResults(scan(input, /(?:)/g))

      // Empty pattern matches between every character
      expect(results.length).toBeGreaterThan(0)
    })
  })

  describe("realistic scenarios", () => {
    test("should handle UUID extraction from text", async () => {
      const input = fromList(["Now I'm taking uuid-asdf-flkj and adding it to uuid-fslkj-alkjlsf."])
      const results = await collectResults(scan(input, /uuid-(\w+)-\w+/g))

      expect(results).toEqual([
        { text: "Now I'm taking " },
        { match: expect.arrayContaining(["uuid-asdf-flkj"]) },
        { text: " and adding it to " },
        { match: expect.arrayContaining(["uuid-fslkj-alkjlsf"]) },
        { text: "." },
      ])
    })

    test("should handle email extraction", async () => {
      const input = fromList(["Contact us at support@example.com!"])
      const results = await collectResults(scan(input, /[\w.]+@[\w.]+/g))

      expect(results).toEqual([
        { text: "Contact us at " },
        { match: expect.arrayContaining(["support@example.com"]) },
        { text: "!" },
      ])
    })

    test("should handle markdown link extraction", async () => {
      const input = fromList(["Check out [Google](https://google.com) and [GitHub](https://github.com)"])
      const results = await collectResults(scan(input, /\[([^\]]+)\]\(([^)]+)\)/g))

      // Results: text, match, text, match (4 items)
      expect(results).toHaveLength(4)
      expect(results[0]).toEqual({ text: "Check out " })
      expect((results[1] as { match: RegExpExecArray }).match[1]).toBe("Google")
      expect((results[1] as { match: RegExpExecArray }).match[2]).toBe("https://google.com")
      expect(results[2]).toEqual({ text: " and " })
      expect((results[3] as { match: RegExpExecArray }).match[1]).toBe("GitHub")
    })
  })
})
