import { describe, expect, test } from "vitest"
import { assertSupportedRegex } from "../src/regex"
import { fromList } from "../src/transforms/fromList"
import { scan } from "../src/transforms/scan"

describe("assertSupportedRegex", () => {
  describe("backreferences", () => {
    test("should throw for numeric backreference \\1", () => {
      expect(() => assertSupportedRegex(/(.)\1/)).toThrow(/backreference/)
    })

    test("should throw for numeric backreference \\2", () => {
      expect(() => assertSupportedRegex(/(.)(.)\2/)).toThrow(/backreference/)
    })

    test("should throw for named backreference \\k<name>", () => {
      expect(() => assertSupportedRegex(/(?<char>.)\k<char>/)).toThrow(/backreference/)
    })
  })

  describe("lookaheads", () => {
    test("should throw for positive lookahead (?=...)", () => {
      expect(() => assertSupportedRegex(/foo(?=bar)/)).toThrow(/lookahead/)
    })

    test("should throw for negative lookahead (?!...)", () => {
      expect(() => assertSupportedRegex(/foo(?!bar)/)).toThrow(/lookahead/)
    })
  })

  describe("lookbehinds", () => {
    test("should throw for positive lookbehind (?<=...)", () => {
      expect(() => assertSupportedRegex(/(?<=foo)bar/)).toThrow(/lookbehind/)
    })

    test("should throw for negative lookbehind (?<!...)", () => {
      expect(() => assertSupportedRegex(/(?<!foo)bar/)).toThrow(/lookbehind/)
    })
  })

  describe("multiline mode", () => {
    test("should throw for multiline flag", () => {
      expect(() => assertSupportedRegex(/^foo$/m)).toThrow(/multiline/)
    })

    test("should throw for multiline flag combined with others", () => {
      expect(() => assertSupportedRegex(/foo/gim)).toThrow(/multiline/)
    })
  })

  describe("allowed patterns", () => {
    test("should allow named capture groups", () => {
      expect(() => assertSupportedRegex(/(?<name>\w+)/)).not.toThrow()
    })

    test("should allow non-capturing groups", () => {
      expect(() => assertSupportedRegex(/(?:foo)/)).not.toThrow()
    })

    test("should allow regular capture groups", () => {
      expect(() => assertSupportedRegex(/(foo)/)).not.toThrow()
    })

    test("should allow global flag", () => {
      expect(() => assertSupportedRegex(/foo/g)).not.toThrow()
    })

    test("should allow case-insensitive flag", () => {
      expect(() => assertSupportedRegex(/foo/i)).not.toThrow()
    })

    test("should allow dotall flag", () => {
      expect(() => assertSupportedRegex(/foo.bar/s)).not.toThrow()
    })

    test("should allow unicode flag", () => {
      expect(() => assertSupportedRegex(/\p{L}/u)).not.toThrow()
    })

    test("should allow character classes", () => {
      expect(() => assertSupportedRegex(/[a-z]/)).not.toThrow()
    })

    test("should allow quantifiers", () => {
      expect(() => assertSupportedRegex(/a+b*c?/)).not.toThrow()
    })

    test("should allow alternation", () => {
      expect(() => assertSupportedRegex(/foo|bar/)).not.toThrow()
    })

    test("should allow word boundaries", () => {
      expect(() => assertSupportedRegex(/\bfoo\b/)).not.toThrow()
    })

    test("should allow anchors without multiline", () => {
      expect(() => assertSupportedRegex(/^foo$/)).not.toThrow()
    })
  })
})

describe("scan validation integration", () => {
  test("should throw when scan is called with unsupported regex", async () => {
    const input = fromList(["test"])

    // The error is thrown when iteration starts
    await expect(async () => {
      for await (const _ of scan(input, /(.)\1/g)) {
        // Should not reach here
      }
    }).rejects.toThrow(/backreference/)
  })

  test("should throw for lookahead in scan", async () => {
    const input = fromList(["test"])

    await expect(async () => {
      for await (const _ of scan(input, /foo(?=bar)/g)) {
        // Should not reach here
      }
    }).rejects.toThrow(/lookahead/)
  })

  test("should throw for lookbehind in scan", async () => {
    const input = fromList(["test"])

    await expect(async () => {
      for await (const _ of scan(input, /(?<=foo)bar/g)) {
        // Should not reach here
      }
    }).rejects.toThrow(/lookbehind/)
  })

  test("should throw for multiline in scan", async () => {
    const input = fromList(["test"])

    await expect(async () => {
      for await (const _ of scan(input, /^foo$/gm)) {
        // Should not reach here
      }
    }).rejects.toThrow(/multiline/)
  })
})
