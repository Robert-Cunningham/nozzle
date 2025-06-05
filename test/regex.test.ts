import { describe, expect, test } from "vitest"
import "../src/regex"
import { earliestPossibleMatchIndex } from "../src/regex"

describe("earliestPossibleMatchIndex", () => {
  test("aba test", () => {
    const regex = /a[ab]*a/
    expect(earliestPossibleMatchIndex("aab", regex)).toEqual({
      start: 0,
      end: 3,
    })
    expect(earliestPossibleMatchIndex("aaba", regex)).toEqual({
      start: 0,
      end: 4,
    })
  })
  test("should find match at beginning of string", () => {
    const regex = /hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 0,
      end: 5,
    })
  })

  test("should find match in middle of string", () => {
    const regex = /world/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 6,
      end: 11,
    })
  })

  test("should return start and end at length when no match found", () => {
    const regex = /xyz/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 11,
      end: 11,
    })
  })

  test("should handle character classes", () => {
    const regex = /[0-9]+/
    expect(earliestPossibleMatchIndex("abc123def", regex)).toEqual({
      start: 3,
      end: 6,
    })
  })

  test("should handle anchored patterns", () => {
    const regex = /^hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 0,
      end: 5,
    })
    expect(earliestPossibleMatchIndex("say hello", regex)).toEqual({
      start: 9,
      end: 9,
    })
  })

  test("should handle end anchored patterns", () => {
    const regex = /world$/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 6,
      end: 11,
    })
    expect(earliestPossibleMatchIndex("world hello", regex)).toEqual({
      start: 11,
      end: 11,
    })
  })

  test("should handle quantifiers", () => {
    const regex = /a+/
    expect(earliestPossibleMatchIndex("bbbaaaccc", regex)).toEqual({
      start: 3,
      end: 6,
    })
  })

  test("should handle optional characters", () => {
    const regex = /colou?r/
    expect(earliestPossibleMatchIndex("color", regex)).toEqual({
      start: 0,
      end: 5,
    })
    expect(earliestPossibleMatchIndex("colour", regex)).toEqual({
      start: 0,
      end: 6,
    })
    expect(earliestPossibleMatchIndex("my color", regex)).toEqual({
      start: 3,
      end: 8,
    })
  })

  test("should handle alternation", () => {
    const regex = /cat|dog/
    expect(earliestPossibleMatchIndex("I have a cat", regex)).toEqual({
      start: 9,
      end: 12,
    })
    expect(earliestPossibleMatchIndex("I have a dog", regex)).toEqual({
      start: 9,
      end: 12,
    })
    expect(earliestPossibleMatchIndex("I have a bird", regex)).toEqual({
      start: 12,
      end: 13,
    })
  })

  test("should handle groups", () => {
    const regex = /(abc)+/
    expect(earliestPossibleMatchIndex("xyzabcabc", regex)).toEqual({
      start: 3,
      end: 9,
    })
  })

  test("should handle escaped characters", () => {
    const regex = /\d+/
    expect(earliestPossibleMatchIndex("price: $123", regex)).toEqual({
      start: 8,
      end: 11,
    })
  })

  test("should handle case sensitivity", () => {
    const regex = /Hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 11,
      end: 11,
    })
    expect(earliestPossibleMatchIndex("Hello world", regex)).toEqual({
      start: 0,
      end: 5,
    })
  })

  test("should handle case insensitive flag", () => {
    const regex = /Hello/i
    expect(earliestPossibleMatchIndex("hello world", regex)).toEqual({
      start: 0,
      end: 5,
    })
    expect(earliestPossibleMatchIndex("HELLO world", regex)).toEqual({
      start: 0,
      end: 5,
    })
  })

  test("should handle global flag", () => {
    const regex = /a/g
    expect(earliestPossibleMatchIndex("banana", regex)).toEqual({
      start: 1,
      end: 2,
    })
  })

  test("should handle empty string", () => {
    const regex = /hello/
    expect(earliestPossibleMatchIndex("", regex)).toEqual({ start: 0, end: 0 })
  })

  test("should handle empty pattern", () => {
    const regex = /(?:)/
    expect(earliestPossibleMatchIndex("hello", regex)).toEqual({
      start: 0,
      end: 0,
    })
    expect(earliestPossibleMatchIndex("", regex)).toEqual({ start: 0, end: 0 })
  })

  test("should handle complex email pattern", () => {
    const regex = /[a-z]+@[a-z]+\.[a-z]{2,}/
    expect(
      earliestPossibleMatchIndex("Contact: user@example.com", regex),
    ).toEqual({ start: 9, end: 25 })
    expect(earliestPossibleMatchIndex("No email here", regex)).toEqual({
      start: 9,
      end: 13,
    })
  })

  test("should match email prefix", () => {
    const regex = /[a-z]+@[a-z]+\.[a-z]{2,}/
    expect(
      earliestPossibleMatchIndex("Contact: user@example.c", regex),
    ).toEqual({ start: 9, end: 23 })
    expect(earliestPossibleMatchIndex("No email here", regex)).toEqual({
      start: 9,
      end: 13,
    })
  })
})
