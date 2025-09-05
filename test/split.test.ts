import { describe, expect, test } from "vitest"
import { fromList } from "../src/transforms/fromList"
import { split, splitAfter, splitBefore } from "../src/transforms/split"
import { consume } from "../src/transforms/consume"

describe("split", () => {
  test("should split merged chunks by separator", async () => {
    const result = (await consume(split(fromList(["hello,wor", "ld,test"]), ","))).list()
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = (await consume(split(fromList(["hello,", "world,", "test"]), ","))).list()
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle multiple separators in one chunk", async () => {
    const result = (await consume(split(fromList(["a,b,c", "d,e"]), ","))).list()
    const expected = ["a", "b", "cd", "e"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(split(fromList([]), ","))).list()
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = (await consume(split(fromList(["hello", "world"]), ","))).list()
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle empty string separator", async () => {
    const result = (await consume(split(fromList(["abc", "def"]), ""))).list()
    const expected = ["a", "b", "c", "d", "e", "f"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at start", async () => {
    const result = (await consume(split(fromList([",hello", "world"]), ","))).list()
    const expected = ["", "helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at end", async () => {
    const result = (await consume(split(fromList(["hello", "world,"]), ","))).list()
    const expected = ["helloworld", ""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = (await consume(split(fromList(["a,,b", ",,c"]), ","))).list()
    const expected = ["a", "", "b", "", "c"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = (await consume(split(fromList(["hello||wor", "ld||test"]), "||"))).list()
    const expected = ["hello", "world", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator spanning chunks", async () => {
    const result = (await consume(split(fromList(["hello|", "|world"]), "||"))).list()
    const expected = ["hello", "world"]
    expect(result).toEqual(expected)
  })

  test("should preserve content when no splitting occurs", async () => {
    const input = fromList(["hello", "world", "test"])
    const original = (await consume(input)).string()
    const splitResult = split(fromList(["hello", "world", "test"]), "|")
    const reconstructed = (await consume(splitResult)).string()
    expect(reconstructed).toBe(original)
  })

  test("should handle single character input", async () => {
    const result = (await consume(split(fromList(["a"]), ","))).list()
    const expected = ["a"]
    expect(result).toEqual(expected)
  })

  test("should handle only separators", async () => {
    const result = (await consume(split(fromList([",", ","]), ","))).list()
    const expected = ["", "", ""]
    expect(result).toEqual(expected)
  })
})

describe("splitBefore", () => {
  test("should split with separator at beginning of each part except first", async () => {
    const result = (await consume(splitBefore(fromList(["hello,wor", "ld,test"]), ","))).list()
    const expected = ["hello", ",world", ",test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = (await consume(splitBefore(fromList(["hello,", "world,", "test"]), ","))).list()
    const expected = ["hello", ",world", ",test"]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = (await consume(splitBefore(fromList(["hello", "world"]), ","))).list()
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at start", async () => {
    const result = (await consume(splitBefore(fromList([",hello", "world"]), ","))).list()
    const expected = ["", ",helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(splitBefore(fromList([]), ","))).list()
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = (await consume(splitBefore(fromList(["a,,b"]), ","))).list()
    const expected = ["a", ",", ",b"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = (await consume(splitBefore(fromList(["hello||wor", "ld||test"]), "||"))).list()
    const expected = ["hello", "||world", "||test"]
    expect(result).toEqual(expected)
  })
})

describe("splitAfter", () => {
  test("should split with separator at end of each part except last", async () => {
    const result = (await consume(splitAfter(fromList(["hello,wor", "ld,test"]), ","))).list()
    const expected = ["hello,", "world,", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at chunk boundaries", async () => {
    const result = (await consume(splitAfter(fromList(["hello,", "world,", "test"]), ","))).list()
    const expected = ["hello,", "world,", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle no separators", async () => {
    const result = (await consume(splitAfter(fromList(["hello", "world"]), ","))).list()
    const expected = ["helloworld"]
    expect(result).toEqual(expected)
  })

  test("should handle separator at end", async () => {
    const result = (await consume(splitAfter(fromList(["hello", "world,"]), ","))).list()
    const expected = ["helloworld,", ""]
    expect(result).toEqual(expected)
  })

  test("should handle empty source", async () => {
    const result = (await consume(splitAfter(fromList([]), ","))).list()
    const expected: string[] = [""]
    expect(result).toEqual(expected)
  })

  test("should handle multiple consecutive separators", async () => {
    const result = (await consume(splitAfter(fromList(["a,,b"]), ","))).list()
    const expected = ["a,", ",", "b"]
    expect(result).toEqual(expected)
  })

  test("should handle multi-character separator", async () => {
    const result = (await consume(splitAfter(fromList(["hello||wor", "ld||test"]), "||"))).list()
    const expected = ["hello||", "world||", "test"]
    expect(result).toEqual(expected)
  })

  test("should handle separator spanning chunks", async () => {
    const result = (await consume(splitAfter(fromList(["hello|", "|world"]), "||"))).list()
    const expected = ["hello||", "world"]
    expect(result).toEqual(expected)
  })
})
