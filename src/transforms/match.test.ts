import { describe, expect, test } from "vitest"
import { asList } from "./asList"
import { fromList } from "./fromList"
import { match } from "./match"

describe("match", () => {
  test("should extract basic regex matches", async () => {
    const result = await asList(
      match(fromList(["hello", " ", "world"]), /world/g),
    )
    console.log("result", result)
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("world")
    // expect(result[0].index).toBe(6)
  })

  test("should handle the header.md example: /a[ab]*a/g with ['a', 'b', 'b', 'a']", async () => {
    const result = await asList(
      match(fromList(["a", "b", "b", "a"]), /a[ab]*a/g),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("abba")
  })

  test("should handle the header.md example: /a[ab]*a/g with ['a', 'a', 'b', 'b', 'a']", async () => {
    const result = await asList(
      match(fromList(["a", "a", "b", "b", "a"]), /a[ab]*a/g),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("aabba")
  })

  test("should extract capture groups", async () => {
    const result = await asList(
      match(fromList(["start", "123", "end"]), /(\d+)/g),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("123")
    expect(result[0][1]).toBe("123")
    // expect(result[0].index).toBe(5)
  })

  test("should handle multiple capture groups", async () => {
    const result = await asList(
      match(
        fromList(["user", ":", "john", "@", "example.com"]),
        /(\w+)@(\w+\.\w+)/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("john@example.com")
    expect(result[0][1]).toBe("john")
    expect(result[0][2]).toBe("example.com")
  })

  test("should handle nested capture groups", async () => {
    const result = await asList(
      match(
        fromList(["prefix", "(", "123", "-", "456", ")", "suffix"]),
        /\((\d+)-(\d+)\)/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("(123-456)")
    expect(result[0][1]).toBe("123")
    expect(result[0][2]).toBe("456")
  })

  test("should handle multiple matches", async () => {
    const result = await asList(
      match(fromList(["a", "1", "a", "2", "a"]), /a/g),
    )
    expect(result).toHaveLength(3)
    expect(result[0][0]).toBe("a")
    expect(result[1][0]).toBe("a")
    expect(result[2][0]).toBe("a")
  })

  test("should handle non-global regex", async () => {
    const result = await asList(match(fromList(["a", "1", "a", "2", "a"]), /a/))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("a")
    // expect(result[0].index).toBe(0)
  })

  test("should handle no matches", async () => {
    const result = await asList(
      match(fromList(["hello", " ", "world"]), /xyz/g),
    )
    expect(result).toHaveLength(0)
  })

  test("should handle empty input", async () => {
    const result = await asList(match(fromList([]), /test/g))
    expect(result).toHaveLength(0)
  })

  test("should handle empty strings in input", async () => {
    const result = await asList(match(fromList(["", "test", ""]), /test/g))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("test")
  })

  test("should handle pattern at the beginning", async () => {
    const result = await asList(
      match(fromList(["test", "ing", " done"]), /test/g),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("test")
    // expect(result[0].index).toBe(0)
  })

  test("should handle pattern at the end", async () => {
    const result = await asList(match(fromList(["start ", "test"]), /test/g))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("test")
    // expect(result[0].index).toBe(6)
  })

  test("should handle overlapping potential matches", async () => {
    const result = await asList(match(fromList(["a", "a", "a"]), /aa/g))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("aa")
    // expect(result[0].index).toBe(0)
  })

  test("should handle case-insensitive regex", async () => {
    const result = await asList(
      match(fromList(["Hello", " ", "WORLD"]), /hello/gi),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("Hello")
  })

  test("should handle single character chunks building up a match", async () => {
    const result = await asList(
      match(fromList(["h", "e", "l", "l", "o"]), /hello/g),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("hello")
  })

  test("should handle word boundaries", async () => {
    const result = await asList(
      match(
        fromList(["the", " ", "cat", " in ", "cat", "astrophe"]),
        /\bcat\b/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("cat")
    // expect(result[0].index).toBe(4)
  })

  /*
  test("should handle lookaheads and lookbehinds", async () => {
    const result = await asList(
      match(
        fromList(["test", "123", "hello", "456", "world"]),
        /\d+(?=hello)/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("123")
  })
    */

  test("should handle optional groups", async () => {
    const result = await asList(
      match(fromList(["color", " and ", "colour"]), /(colou?r)/g),
    )
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBe("color")
    expect(result[0][1]).toBe("color")
    expect(result[1][0]).toBe("colour")
    expect(result[1][1]).toBe("colour")
  })

  test("should handle quantifiers correctly", async () => {
    const result = await asList(
      match(fromList(["a", "bb", "ccc", "dddd"]), /\w{3}/g),
    )
    expect(result).toHaveLength(3)
    expect(result[0][0]).toBe("abb")
    expect(result[1][0]).toBe("ccc")
    expect(result[2][0]).toBe("ddd")
  })

  test("should handle greedy vs non-greedy quantifiers", async () => {
    const greedyResult = await asList(
      match(
        fromList([
          "<",
          "div",
          "><",
          "span",
          ">",
          "text",
          "<",
          "/span",
          "><",
          "/div",
          ">",
        ]),
        /<.*>/g,
      ),
    )
    expect(greedyResult).toHaveLength(1)
    expect(greedyResult[0][0]).toBe("<div><span>text</span></div>")

    const nonGreedyResult = await asList(
      match(
        fromList([
          "<",
          "div",
          "><",
          "span",
          ">",
          "text",
          "<",
          "/span",
          "><",
          "/div",
          ">",
        ]),
        /<.*?>/g,
      ),
    )
    expect(nonGreedyResult).toHaveLength(4)
    expect(nonGreedyResult[0][0]).toBe("<div>")
    expect(nonGreedyResult[1][0]).toBe("<span>")
    expect(nonGreedyResult[2][0]).toBe("</span>")
    expect(nonGreedyResult[3][0]).toBe("</div>")
  })

  test("should handle named capture groups", async () => {
    const result = await asList(
      match(
        fromList(["user", ":", "john", "@", "example.com"]),
        /(?<user>\w+)@(?<domain>\w+\.\w+)/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("john@example.com")
    expect(result[0].groups?.user).toBe("john")
    expect(result[0].groups?.domain).toBe("example.com")
  })

  test("should handle Unicode and special characters", async () => {
    const result = await asList(
      match(
        fromList(["Hello", " ", "🌍", " ", "café", " ", "naïve"]),
        /[\u{1F300}-\u{1F6FF}]|[àáâãäåæçèéêëìíîïðñòóôõöøùúûüýþÿ]/gu,
      ),
    )
    expect(result).toHaveLength(3)
    expect(result[0][0]).toBe("🌍")
    expect(result[1][0]).toBe("é")
    expect(result[2][0]).toBe("ï")
  })

  describe("realistic scenarios with complex patterns", () => {
    test("should extract phone numbers from fragmented text", async () => {
      const phoneRegex = /\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("(555) 123-4567")
      expect(result[1][0]).toBe("800.555.0199")
    })

    test("should extract email addresses split across multiple tokens", async () => {
      const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("john.doe+test@example.com")
      expect(result[1][0]).toBe("support@my-company.co")
    })

    test("should extract JSON code blocks with capture groups", async () => {
      const jsonBlockRegex = /```(json)\s*\n?(.*?)\n?```/gs
      const result = await asList(
        match(
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
            "And another: ",
            "```",
            "json",
            "\n",
            '{"simple": true}',
            "\n",
            "```",
          ]),
          jsonBlockRegex,
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][1]).toBe("json")
      expect(result[0][2]).toContain('"name": "test"')
      expect(result[1][1]).toBe("json")
      expect(result[1][2]).toBe('{"simple": true}')
    })

    test("should extract Social Security Numbers with various formats", async () => {
      const ssnRegex = /(\d{3})[-\s]?(\d{2})[-\s]?(\d{4})/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("123-45-6789")
      expect(result[0][1]).toBe("123")
      expect(result[0][2]).toBe("45")
      expect(result[0][3]).toBe("6789")
      expect(result[1][0]).toBe("987 65 4321")
    })

    test("should extract credit card numbers in different formats", async () => {
      const cardRegex = /(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})[-\s]?(\d{4})/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("4532 1234 5678 9012")
      expect(result[0][1]).toBe("4532")
      expect(result[0][4]).toBe("9012")
      expect(result[1][0]).toBe("5555-5555-5555-4444")
    })

    test("should extract URLs split across many small tokens", async () => {
      const urlRegex = /(https?):\/\/([^\s]+)/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe(
        "https://www.example.com/path?param=value&other=123",
      )
      expect(result[0][1]).toBe("https")
      expect(result[0][2]).toBe("www.example.com/path?param=value&other=123")
      expect(result[1][0]).toBe("http://api.test.org/v1")
      expect(result[1][1]).toBe("http")
    })

    test("should extract dates in various formats with capture groups", async () => {
      const dateRegex =
        /(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})|(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})/g
      const result = await asList(
        match(
          fromList([
            "Born on ",
            "12",
            "/",
            "25",
            "/",
            "1990",
            " and graduated ",
            "2023",
            "-",
            "05",
            "-",
            "15",
            ".",
          ]),
          dateRegex,
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("12/25/1990")
      expect(result[0][1]).toBe("12")
      expect(result[0][2]).toBe("25")
      expect(result[0][3]).toBe("1990")
      expect(result[1][0]).toBe("2023-05-15")
      expect(result[1][4]).toBe("2023")
      expect(result[1][5]).toBe("05")
      expect(result[1][6]).toBe("15")
    })

    test("should extract IPv4 addresses fragmented across tokens", async () => {
      const ipRegex = /\b((?:\d{1,3}\.){3}\d{1,3})\b/g
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe("192.168.1.100")
      expect(result[0][1]).toBe("192.168.1.100")
      expect(result[1][0]).toBe("10.0.0.1")
    })

    test("should extract multi-line code blocks with language capture", async () => {
      const codeBlockRegex = /```(\w+)?\s*\n(.*?)\n```/gs
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][1]).toBe("python")
      expect(result[0][2]).toContain("def hello(name):")
      expect(result[1][1]).toBe("js")
      expect(result[1][2]).toBe("const x = 42")
    })

    test("should extract hashtags and mentions with capture groups", async () => {
      const socialRegex = /(#|@)([a-zA-Z0-9_.]+)/g
      const result = await asList(
        match(
          fromList([
            "Check out ",
            "#",
            "awesome",
            "Project",
            " by ",
            "@",
            "john",
            "_",
            "doe",
            " and ",
            "#",
            "coding",
            "!",
          ]),
          socialRegex,
        ),
      )
      expect(result).toHaveLength(3)
      expect(result[0][0]).toBe("#awesomeProject")
      expect(result[0][1]).toBe("#")
      expect(result[0][2]).toBe("awesomeProject")
      expect(result[1][0]).toBe("@john_doe")
      expect(result[1][1]).toBe("@")
      expect(result[1][2]).toBe("john_doe")
      expect(result[2][0]).toBe("#coding")
    })

    test("should extract HTML tags with attributes when split across chunks", async () => {
      const htmlTagRegex = /<(\w+)(\s+[^>]*)?>(.*?)<\/\1>/gs
      const result = await asList(
        match(
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
        ),
      )
      expect(result).toHaveLength(2)
      expect(result[0][0]).toBe('<div class="container">Content</div>')
      expect(result[0][1]).toBe("div")
      expect(result[0][2]).toBe(' class="container"')
      expect(result[0][3]).toBe("Content")
      expect(result[1][0]).toBe('<span id="test">more</span>')
      expect(result[1][1]).toBe("span")
    })

    test("should handle extremely fragmented text with single character tokens", async () => {
      const result = await asList(
        match(
          fromList([
            "t",
            "e",
            "s",
            "t",
            "@",
            "e",
            "x",
            "a",
            "m",
            "p",
            "l",
            "e",
            ".",
            "c",
            "o",
            "m",
          ]),
          /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        ),
      )
      expect(result).toHaveLength(1)
      expect(result[0][0]).toBe("test@example.com")
      expect(result[0][1]).toBe("test")
      expect(result[0][2]).toBe("example.com")
    })

    test("should extract multiple data types from realistic document", async () => {
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

      const emailResults = await asList(
        match(
          fromList(input),
          /([a-zA-Z0-9._%+-]+)@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
        ),
      )
      expect(emailResults).toHaveLength(1)
      expect(emailResults[0][0]).toBe("john.doe@company.com")
      expect(emailResults[0][1]).toBe("john.doe")
      expect(emailResults[0][2]).toBe("company.com")

      const phoneResults = await asList(
        match(fromList(input), /\((\d{3})\)\s?(\d{3})-(\d{4})/g),
      )
      expect(phoneResults).toHaveLength(1)
      expect(phoneResults[0][0]).toBe("(555) 123-4567")
      expect(phoneResults[0][1]).toBe("555")
      expect(phoneResults[0][2]).toBe("123")
      expect(phoneResults[0][3]).toBe("4567")

      const ssnResults = await asList(
        match(fromList(input), /(\d{3})-(\d{2})-(\d{4})/g),
      )
      expect(ssnResults).toHaveLength(1)
      expect(ssnResults[0][0]).toBe("123-45-6789")

      const cardResults = await asList(
        match(fromList(input), /(\d{4})\s(\d{4})\s(\d{4})\s(\d{4})/g),
      )
      expect(cardResults).toHaveLength(1)
      expect(cardResults[0][0]).toBe("4532 1234 5678 9012")

      const dateResults = await asList(
        match(fromList(input), /(\d{1,2})\/(\d{1,2})\/(\d{4})/g),
      )
      expect(dateResults).toHaveLength(1)
      expect(dateResults[0][0]).toBe("12/25/2023")
      expect(dateResults[0][1]).toBe("12")
      expect(dateResults[0][2]).toBe("25")
      expect(dateResults[0][3]).toBe("2023")
    })
  })

  test("should handle json blocks with capture", async () => {
    const input = fromList(["```json", "{}", "```"])
    const result = await asList(match(input, /```(json)\s*\n?(.*?)\n?```/gs))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("```json{}```")
    expect(result[0][1]).toBe("json")
    expect(result[0][2]).toBe("{}")
  })

  test("should handle double json blocks with separate matches", async () => {
    const input = fromList(["```json", "1", "```", "```json", "2", "```"])
    const result = await asList(match(input, /```json.*?```/gms))
    expect(result).toHaveLength(2)
    expect(result[0][0]).toBe("```json1```")
    expect(result[1][0]).toBe("```json2```")
  })

  test("should handle greedy matching across blocks", async () => {
    const input = fromList(["```json", "1", "```", "```json", "2", "```"])
    const result = await asList(match(input, /```json.*```/gms))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("```json1``````json2```")
  })

  test("should handle complex backreference patterns", async () => {
    const result = await asList(
      match(
        fromList(["<", "tag", ">", "content", "<", "/", "tag", ">"]),
        /<(\w+)>.*?<\/\1>/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("<tag>content</tag>")
    expect(result[0][1]).toBe("tag")
  })

  test("should handle edge case: match at exact buffer boundary", async () => {
    const result = await asList(match(fromList(["ab", "cd", "ef"]), /bcd/g))
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("bcd")
    // expect(result[0].index).toBe(1)
  })

  test("should handle multi-byte Unicode characters", async () => {
    const result = await asList(
      match(
        fromList(["🎉", "👍", "🚀", "text", "🎯"]),
        /[\u{1F300}-\u{1F6FF}]/gu,
      ),
    )
    expect(result).toHaveLength(4)
    expect(result[0][0]).toBe("🎉")
    expect(result[1][0]).toBe("👍")
    expect(result[2][0]).toBe("🚀")
    expect(result[3][0]).toBe("🎯")
  })

  /*
  test("should handle zero-width assertions", async () => {
    const result = await asList(
      match(
        fromList(["pre", "fix", "123", "post", "fix"]),
        /(?<=prefix)\d+(?=postfix)/g,
      ),
    )
    expect(result).toHaveLength(1)
    expect(result[0][0]).toBe("123")
  })
    */
})
