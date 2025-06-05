import { describe, expect, test } from "vitest"
import { toPrefixRegex } from "../src/regex/standard"

describe("toPrefixRegex", () => {
  test("should create a regex that generates proper prefix structure for literal strings", () => {
    const original = /hello/
    const prefixRegex = toPrefixRegex(original)

    // The generated regex should have a nested optional structure
    expect(prefixRegex.source).toBe("(?:h(?:e(?:l(?:lo?)?)?)?)?")

    // Should match all prefixes
    expect(prefixRegex.test("")).toBe(true)
    expect(prefixRegex.test("h")).toBe(true)
    expect(prefixRegex.test("he")).toBe(true)
    expect(prefixRegex.test("hel")).toBe(true)
    expect(prefixRegex.test("hell")).toBe(true)
    expect(prefixRegex.test("hello")).toBe(true)
  })

  test("should fail when appropriate", () => {
    const original = /hello/
    const prefixRegex = toPrefixRegex(original)

    // The generated regex should have a nested optional structure
    expect(prefixRegex.source).toBe("(?:h(?:e(?:l(?:lo?)?)?)?)?")

    // Should match all prefixes
    expect(prefixRegex.test("")).toBe(true)
    expect(prefixRegex.test("h")).toBe(true)
    expect(prefixRegex.test("hx")).toBe(false)
  })

  test("should handle character classes correctly", () => {
    const original = /[abc]def/
    const prefixRegex = toPrefixRegex(original)

    // Should create proper structure for character classes
    expect(prefixRegex.source).toBe("(?:[abc](?:d(?:ef?)?)?)?")

    // Should match valid prefixes starting with a, b, or c
    expect(prefixRegex.test("a")).toBe(true)
    expect(prefixRegex.test("b")).toBe(true)
    expect(prefixRegex.test("c")).toBe(true)
    expect(prefixRegex.test("ad")).toBe(true)
    expect(prefixRegex.test("bde")).toBe(true)
    expect(prefixRegex.test("cdef")).toBe(true)
  })

  test("should handle alternation patterns", () => {
    const original = /cat|dog/
    const prefixRegex = toPrefixRegex(original)

    // Should create alternation in prefix structure
    expect(prefixRegex.source).toBe("(?:c(?:at?)?|d(?:og?)?)?")

    // Should match prefixes of both alternatives
    expect(prefixRegex.test("c")).toBe(true)
    expect(prefixRegex.test("ca")).toBe(true)
    expect(prefixRegex.test("cat")).toBe(true)
    expect(prefixRegex.test("d")).toBe(true)
    expect(prefixRegex.test("do")).toBe(true)
    expect(prefixRegex.test("dog")).toBe(true)
  })

  test("should handle quantifiers properly", () => {
    const original = /ab+c/
    const prefixRegex = toPrefixRegex(original)

    // Should match prefixes including repeated b's
    expect(prefixRegex.test("a")).toBe(true)
    expect(prefixRegex.test("ab")).toBe(true)
    expect(prefixRegex.test("abb")).toBe(true)
    expect(prefixRegex.test("abbb")).toBe(true)
    expect(prefixRegex.test("abc")).toBe(true)
    expect(prefixRegex.test("abbc")).toBe(true)
  })

  test("should handle optional characters", () => {
    const original = /ab?c/
    const prefixRegex = toPrefixRegex(original)

    // Should match prefixes accounting for optional b
    expect(prefixRegex.test("a")).toBe(true)
    expect(prefixRegex.test("ab")).toBe(true)
    expect(prefixRegex.test("abc")).toBe(true)
    expect(prefixRegex.test("ac")).toBe(true)
  })

  test("should preserve case-insensitive flag", () => {
    const original = /hello/i
    const prefixRegex = toPrefixRegex(original)

    expect(prefixRegex.flags).toContain("i")

    // Should respect case insensitive flag
    expect(prefixRegex.test("H")).toBe(true)
    expect(prefixRegex.test("HEL")).toBe(true)
  })

  test("should handle empty regex", () => {
    const original = /(?:)/
    const prefixRegex = toPrefixRegex(original)

    // Empty regex produces empty group
    expect(prefixRegex.source).toBe("(?:)")
    expect(prefixRegex.test("")).toBe(true)
  })

  test("should handle dot metacharacter", () => {
    const original = /a.c/
    const prefixRegex = toPrefixRegex(original)

    // Should match prefixes with any character in the middle
    expect(prefixRegex.test("a")).toBe(true)
    expect(prefixRegex.test("ab")).toBe(true)
    expect(prefixRegex.test("ax")).toBe(true)
    expect(prefixRegex.test("abc")).toBe(true)
    expect(prefixRegex.test("axc")).toBe(true)
  })

  test("should handle simple patterns without complex features", () => {
    const original = /test/
    const prefixRegex = toPrefixRegex(original)

    // Should create nested optional structure
    expect(prefixRegex.source).toBe("(?:t(?:e(?:st?)?)?)?")

    // Should match incremental prefixes
    expect(prefixRegex.test("t")).toBe(true)
    expect(prefixRegex.test("te")).toBe(true)
    expect(prefixRegex.test("tes")).toBe(true)
    expect(prefixRegex.test("test")).toBe(true)
  })

  test("should return a proper RegExp object", () => {
    const original = /hello/gi
    const prefixRegex = toPrefixRegex(original)

    // Should return a RegExp instance
    expect(prefixRegex).toBeInstanceOf(RegExp)

    // Should preserve flags (except global which doesn't make sense for prefix matching)
    expect(prefixRegex.flags).toContain("i")
  })
})
