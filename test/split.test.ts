import { describe, expect, test } from "vitest"
import { asList } from "../src/transforms/asList"
import { asString } from "../src/transforms/asString"
import { fromList } from "../src/transforms/fromList"
import { split, splitAfter, splitBefore } from "../src/transforms/split"

describe("split", () => {
  test("should split merged chunks by separator", async () => {
    const result = await asList(split(fromList(["hello,wor", "ld,test"]), ","))
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = await asList(
      split(fromList(["hello,", "world,", "test"]), ","),
    )
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle multiple separators in one chunk", async () => {
    const result = await asList(split(fromList(["a,b,c", "d,e"]), ","))
    const expected = ["a", "b", "cd", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(split(fromList([]), ","))
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = await asList(split(fromList(["hello", "world"]), ","))
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle empty string separator", async () => {
    const result = await asList(split(fromList(["abc", "def"]), ""))
    const expected = ["a", "b", "c", "d", "e", "f"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at start", async () => {
    const result = await asList(split(fromList([",hello", "world"]), ","))
    const expected = ["", "helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at end", async () => {
    const result = await asList(split(fromList(["hello", "world,"]), ","))
    const expected = ["helloworld", ""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = await asList(split(fromList(["a,,b", ",,c"]), ","))
    const expected = ["a", "", "b", "", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = await asList(
      split(fromList(["hello||wor", "ld||test"]), "||"),
    )
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator spanning chunks", async () => {
    const result = await asList(split(fromList(["hello|", "|world"]), "||"))
    const expected = ["hello", "world"]
    expect(result).toEqual(expected)
  })

  test("should preserve content when no splitting occurs", async () => {
    const input = fromList(["hello", "world", "test"])
    const original = await asString(input)
    const splitResult = split(fromList(["hello", "world", "test"]), "|")
    const reconstructed = await asString(splitResult)
    expect(reconstructed).toBe(original)
  })

  test("should handle single character input", async () => {
    const result = await asList(split(fromList(["a"]), ","))
    const expected = ["a"]
    expect(result).toEqual(expected)
  })

  test("should handle only separators", async () => {
    const result = await asList(split(fromList([",", ","]), ","))
    const expected = ["", "", ""]
    expect(result).toEqual(expected)
  })
})

describe("splitBefore", () => {
  test("should split with separator at beginning of each part except first", async () => {
    const result = await asList(
      splitBefore(fromList(["hello,wor", "ld,test"]), ","),
    )
    const expected = ["hello", ",world", ",test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = await asList(
      splitBefore(fromList(["hello,", "world,", "test"]), ","),
    )
    const expected = ["hello", ",world", ",test"]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = await asList(splitBefore(fromList(["hello", "world"]), ","))
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at start", async () => {
    const result = await asList(splitBefore(fromList([",hello", "world"]), ","))
    const expected = ["", ",helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(splitBefore(fromList([]), ","))
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = await asList(splitBefore(fromList(["a,,b"]), ","))
    const expected = ["a", ",", ",b"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = await asList(
      splitBefore(fromList(["hello||wor", "ld||test"]), "||"),
    )
    const expected = ["hello", "||world", "||test"]
    expect(result).toEqual(expected)
  })
})

describe("splitAfter", () => {
  test("should split with separator at end of each part except last", async () => {
    const result = await asList(
      splitAfter(fromList(["hello,wor", "ld,test"]), ","),
    )
    const expected = ["hello,", "world,", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = await asList(
      splitAfter(fromList(["hello,", "world,", "test"]), ","),
    )
    const expected = ["hello,", "world,", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = await asList(splitAfter(fromList(["hello", "world"]), ","))
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at end", async () => {
    const result = await asList(splitAfter(fromList(["hello", "world,"]), ","))
    const expected = ["helloworld,", ""]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = await asList(splitAfter(fromList([]), ","))
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = await asList(splitAfter(fromList(["a,,b"]), ","))
    const expected = ["a,", ",", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = await asList(
      splitAfter(fromList(["hello||wor", "ld||test"]), "||"),
    )
    const expected = ["hello||", "world||", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator spanning chunks", async () => {
    const result = await asList(
      splitAfter(fromList(["hello|", "|world"]), "||"),
    )
    const expected = ["hello||", "world"]
    expect(result).toEqual(expected)
  })
})
