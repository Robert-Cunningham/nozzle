import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { asString } from "../src/transforms/asString"
import { fromList } from "../src/transforms/fromList"
import { replace } from "../src/transforms/replace"

describe("replace", () => {
  test("should replace regex matches with replacement string", async () => {
    const result = await asString(replace(fromList(["hello", " ", "world"]), /world/g, "universe"))
    expect(result).toBe("hello universe")
  })

  test("should handle the header.md example: /a[ab]*a/g with ['a', 'b', 'b', 'a']", async () => {
    const result = await asList(replace(fromList(["a", "b", "b", "a"]), /a[ab]*a/g, "X"))
    expect(result).toEqual(["X"])
  })

  test("should handle the header.md example: /a[ab]*a/g with ['a', 'a', 'b', 'b', 'a']", async () => {
    const result = await asList(replace(fromList(["a", "a", "b", "b", "a"]), /a[ab]*a/g, "X"))
    // TODO: This should be ["X"] but the longest match detection logic is broken
    // Currently only matches "aa" instead of the full "aabba"
    expect(result).toEqual(["X"])
  })

  test("should handle Response whitespace pattern", async () => {
    const result = await asString(replace(fromList(["Response:", "   ", "data"]), /Response:\s*/g, ""))
    expect(result).toBe("data")
  })

  test("should handle multiple matches", async () => {
    const result = await asString(replace(fromList(["a", "1", "a", "2", "a"]), /a/g, "X"))
    expect(result).toBe("X1X2X")
  })

  test("should handle non-global regex", async () => {
    const result = await asString(replace(fromList(["a", "1", "a", "2", "a"]), /a/, "X"))
    expect(result).toBe("X1a2a")
  })

  test("should handle no matches", async () => {
    const result = await asString(replace(fromList(["hello", " ", "world"]), /xyz/g, "replacement"))
    expect(result).toBe("hello world")
  })

  test("should handle empty input", async () => {
    const result = await asList(replace(fromList([]), /test/g, "replacement"))
    expect(result).toEqual([])
  })

  test("should handle empty strings in input", async () => {
    const result = await asList(replace(fromList(["", "test", ""]), /test/g, "X"))
    expect(result).toEqual(["X"])
  })

  test("should handle pattern at the beginning", async () => {
    const result = await asString(replace(fromList(["test", "ing", " done"]), /test/g, "X"))
    expect(result).toBe("Xing done")
  })

  test("should handle pattern at the end", async () => {
    const result = await asString(replace(fromList(["start ", "test"]), /test/g, "X"))
    expect(result).toBe("start X")
  })

  test("should handle overlapping potential matches", async () => {
    const result = await asString(replace(fromList(["a", "a", "a"]), /aa/g, "X"))
    expect(result).toBe("Xa")
  })

  test("should handle complex regex with groups", async () => {
    const result = await asString(replace(fromList(["start", "123", "end"]), /(\d+)/g, "[$1]"))
    expect(result).toBe("start[123]end")
  })

  test("should handle case-insensitive regex", async () => {
    const result = await asString(replace(fromList(["Hello", " ", "WORLD"]), /hello/gi, "hi"))
    expect(result).toBe("hi WORLD")
  })

  test("should handle single character chunks building up a match", async () => {
    const result = await asList(replace(fromList(["h", "e", "l", "l", "o"]), /hello/g, "X"))
    expect(result).toEqual(["X"])
  })

  test("should preserve unmatched content around matches", async () => {
    const result = await asString(replace(fromList(["before", "match", "after"]), /match/g, "X"))
    expect(result).toBe("beforeXafter")
  })

  describe("realistic scenarios with complex patterns", () => {
    test("should replace phone numbers in fragmented text", async () => {
      const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
      const result = await asString(
        replace(
          fromList([
            "Call me at (",
            "555",
            ")",
            " ",
            "123",
            "-",
            "4567",
            " or reach out to ",
            "800",
            ".",
            "555",
            ".",
            "0199",
            " for support.",
          ]),
          phoneRegex,
          "[PHONE]",
        ),
      )
      expect(result).toBe("Call me at [PHONE] or reach out to [PHONE] for support.")
    })

    test("should replace email addresses split across multiple tokens", async () => {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const result = await asString(
        replace(
          fromList([
            "Contact ",
            "john",
            ".",
            "doe",
            "+",
            "test",
            "@",
            "example",
            ".",
            "com",
            " or ",
            "support",
            "@",
            "my",
            "-",
            "company",
            ".",
            "co",
            " for help.",
          ]),
          emailRegex,
          "[EMAIL]",
        ),
      )
      expect(result).toBe("Contact [EMAIL] or [EMAIL] for help.")
    })

    test("should replace JSON code blocks with varied formatting", async () => {
      const jsonBlockRegex = /```json\s*\n?.*?\n?```/gs
      const result = await asString(
        replace(
          fromList([
            "Here's the config:\n",
            "```",
            "json",
            "\n",
            "{",
            "\n",
            '  "',
            "name",
            '": "',
            "test",
            '",',
            "\n",
            '  "',
            "version",
            '": "',
            "1.0",
            '"',
            "\n",
            "}",
            "\n",
            "```",
            "\n",
            "And another example: ",
            "```",
            "json",
            "\n",
            '{"simple": true}',
            "\n",
            "```",
          ]),
          jsonBlockRegex,
          "[JSON_BLOCK]",
        ),
      )
      expect(result).toBe("Here's the config:\n[JSON_BLOCK]\nAnd another example: [JSON_BLOCK]")
    })

    test("should handle Social Security Numbers with various formats", async () => {
      const ssnRegex = /\d{3}[-\s]?\d{2}[-\s]?\d{4}/g
      const result = await asString(
        replace(
          fromList([
            "SSN: ",
            "123",
            "-",
            "45",
            "-",
            "6789",
            " or ",
            "987",
            " ",
            "65",
            " ",
            "4321",
            " formats accepted.",
          ]),
          ssnRegex,
          "[SSN]",
        ),
      )
      expect(result).toBe("SSN: [SSN] or [SSN] formats accepted.")
    })

    test("should replace credit card numbers in different formats", async () => {
      const cardRegex = /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g
      const result = await asString(
        replace(
          fromList([
            "Card ending in ",
            "4532",
            " ",
            "1234",
            " ",
            "5678",
            " ",
            "9012",
            " or ",
            "5555-",
            "5555-",
            "5555-",
            "4444",
            " are valid.",
          ]),
          cardRegex,
          "[CARD]",
        ),
      )
      expect(result).toBe("Card ending in [CARD] or [CARD] are valid.")
    })

    test("should handle URLs split across many small tokens", async () => {
      const urlRegex = /https?:\/\/[^\s]+/g
      const result = await asString(
        replace(
          fromList([
            "Visit ",
            "https",
            "://",
            "www",
            ".",
            "example",
            ".",
            "com",
            "/",
            "path",
            "?",
            "param",
            "=",
            "value",
            "&",
            "other",
            "=",
            "123",
            " and ",
            "http",
            "://",
            "api",
            ".",
            "test",
            ".",
            "org",
            "/",
            "v1",
          ]),
          urlRegex,
          "[URL]",
        ),
      )
      expect(result).toBe("Visit [URL] and [URL]")
    })

    test("should replace dates in various formats", async () => {
      const dateRegex = /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}|\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}/g
      const result = await asString(
        replace(
          fromList(["Born on ", "12", "/", "25", "/", "1990", " and graduated ", "2023", "-", "05", "-", "15", "."]),
          dateRegex,
          "[DATE]",
        ),
      )
      expect(result).toBe("Born on [DATE] and graduated [DATE].")
    })

    test("should handle IPv4 addresses fragmented across tokens", async () => {
      const ipRegex = /\b(?:\d{1,3}\.){3}\d{1,3}\b/g
      const result = await asString(
        replace(
          fromList([
            "Server at ",
            "192",
            ".",
            "168",
            ".",
            "1",
            ".",
            "100",
            " and backup at ",
            "10",
            ".",
            "0",
            ".",
            "0",
            ".",
            "1",
          ]),
          ipRegex,
          "[IP]",
        ),
      )
      expect(result).toBe("Server at [IP] and backup at [IP]")
    })

    test("should replace multi-line code blocks with complex content", async () => {
      const codeBlockRegex = /```(\w+)?\s*\n.*?\n```/gs
      const result = await asString(
        replace(
          fromList([
            "Example:\n",
            "```",
            "python",
            "\n",
            "def ",
            "hello",
            "(",
            "name",
            "):",
            "\n",
            "    ",
            "return ",
            "f",
            '"Hello {',
            "name",
            '}!"',
            "\n",
            "```",
            "\n",
            "And JavaScript:\n",
            "```",
            "js",
            "\n",
            "const ",
            "x ",
            "= ",
            "42",
            "\n",
            "```",
          ]),
          codeBlockRegex,
          "[CODE_BLOCK]",
        ),
      )
      expect(result).toBe("Example:\n[CODE_BLOCK]\nAnd JavaScript:\n[CODE_BLOCK]")
    })

    test("should handle hashtags and mentions split across tokens", async () => {
      const hashtagRegex = /#[a-zA-Z0-9_]+/g
      const mentionRegex = /@[a-zA-Z0-9_.]+/g

      let result = await asString(
        replace(
          fromList(["Check out ", "#", "awesome", "Project", " by ", "@", "john", "_", "doe", "!"]),
          hashtagRegex,
          "[HASHTAG]",
        ),
      )

      result = await asString(replace(fromList([result]), mentionRegex, "[MENTION]"))

      expect(result).toBe("Check out [HASHTAG] by [MENTION]!")
    })

    test("should replace HTML tags when split across many small chunks", async () => {
      const htmlTagRegex = /<[^>]+>/g
      const result = await asString(
        replace(
          fromList([
            "<",
            "div",
            " ",
            "class",
            "=",
            '"',
            "container",
            '"',
            ">",
            "Content",
            "<",
            "/",
            "div",
            ">",
            " and ",
            "<",
            "span",
            " ",
            "id",
            "=",
            '"',
            "test",
            '"',
            ">",
            "more",
            "<",
            "/",
            "span",
            ">",
          ]),
          htmlTagRegex,
          "[TAG]",
        ),
      )
      expect(result).toBe("[TAG]Content[TAG] and [TAG]more[TAG]")
    })

    test("should handle extremely fragmented text with single character tokens", async () => {
      const result = await asString(
        replace(
          fromList(["t", "e", "s", "t", "@", "e", "x", "a", "m", "p", "l", "e", ".", "c", "o", "m"]),
          /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
          "[EMAIL]",
        ),
      )
      expect(result).toBe("[EMAIL]")
    })

    test("should handle mixed sensitive data in realistic document format", async () => {
      const input = [
        "Customer Record:\n",
        "Name: John Doe\n",
        "Email: j",
        "ohn",
        ".",
        "doe",
        "@",
        "company",
        ".",
        "com",
        "\n",
        "Phone: (",
        "555",
        ")",
        " ",
        "123",
        "-",
        "4567",
        "\n",
        "SSN: ",
        "123",
        "-",
        "45",
        "-",
        "6789",
        "\n",
        "Card: ",
        "4532",
        " ",
        "1234",
        " ",
        "5678",
        " ",
        "9012",
        "\n",
        "Notes: Contact before ",
        "12",
        "/",
        "25",
        "/",
        "2023",
      ]

      let result = await asString(
        replace(fromList(input), /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, "[EMAIL]"),
      )
      result = await asString(replace(fromList([result]), /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g, "[PHONE]"))
      result = await asString(replace(fromList([result]), /\d{3}[-\s]?\d{2}[-\s]?\d{4}/g, "[SSN]"))
      result = await asString(replace(fromList([result]), /\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}/g, "[CARD]"))
      result = await asString(replace(fromList([result]), /\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/g, "[DATE]"))

      expect(result).toBe(
        "Customer Record:\n" +
          "Name: John Doe\n" +
          "Email: [EMAIL]\n" +
          "Phone: [PHONE]\n" +
          "SSN: [SSN]\n" +
          "Card: [CARD]\n" +
          "Notes: Contact before [DATE]",
      )
    })
  })

  test("should handle json blocks", async () => {
    const input = fromList(["```json", "{}", "```"])
    const result = replace(input, /```json\s*\n?.*?\n?```/gs, "[json]")
    expect(await asString(result)).toBe("[json]")
  })

  test("should handle double json blocks", async () => {
    const input = fromList(["```json", "1", "```", "```json", "2", "```"])
    const result = await asString(replace(input, /```json.*?```/gms, "[json]"))
    expect(result).toBe("[json][json]")
  })

  test("should handle double json blocks", async () => {
    const input = fromList(["```json", "1", "```", "```json", "2", "```"])
    const result = await asString(replace(input, /```json.*```/gms, "[json]"))
    expect(result).toBe("[json]")
  })
})
