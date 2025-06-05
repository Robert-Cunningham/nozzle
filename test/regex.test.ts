import { describe, expect, test } from "vitest"
import "../src/regex"
import { earliestPossibleMatchIndex } from "../src/regex"

describe("earliestPossibleMatchIndex", () => {
  test("should find match at beginning of string", () => {
    const regex = /hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(0)
  })

  test("should find match in middle of string", () => {
    const regex = /world/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(6)
  })

  test("should return -1 when no match found", () => {
    const regex = /xyz/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(-1)
  })

  test("should handle character classes", () => {
    const regex = /[0-9]+/
    expect(earliestPossibleMatchIndex("abc123def", regex)).toBe(3)
  })

  test("should handle anchored patterns", () => {
    const regex = /^hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(0)
    expect(earliestPossibleMatchIndex("say hello", regex)).toBe(-1)
  })

  test("should handle end anchored patterns", () => {
    const regex = /world$/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(6)
    expect(earliestPossibleMatchIndex("world hello", regex)).toBe(-1)
  })

  test("should handle quantifiers", () => {
    const regex = /a+/
    expect(earliestPossibleMatchIndex("bbbaaaccc", regex)).toBe(3)
  })

  test("should handle optional characters", () => {
    const regex = /colou?r/
    expect(earliestPossibleMatchIndex("color", regex)).toBe(0)
    expect(earliestPossibleMatchIndex("colour", regex)).toBe(0)
    expect(earliestPossibleMatchIndex("my color", regex)).toBe(3)
  })

  test("should handle alternation", () => {
    const regex = /cat|dog/
    expect(earliestPossibleMatchIndex("I have a cat", regex)).toBe(9)
    expect(earliestPossibleMatchIndex("I have a dog", regex)).toBe(9)
    expect(earliestPossibleMatchIndex("I have a bird", regex)).toBe(-1)
  })

  test("should handle groups", () => {
    const regex = /(abc)+/
    expect(earliestPossibleMatchIndex("xyzabcabc", regex)).toBe(3)
  })

  test("should handle escaped characters", () => {
    const regex = /\d+/
    expect(earliestPossibleMatchIndex("price: $123", regex)).toBe(8)
  })

  test("should handle case sensitivity", () => {
    const regex = /Hello/
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(-1)
    expect(earliestPossibleMatchIndex("Hello world", regex)).toBe(0)
  })

  test("should handle case insensitive flag", () => {
    const regex = /Hello/i
    expect(earliestPossibleMatchIndex("hello world", regex)).toBe(0)
    expect(earliestPossibleMatchIndex("HELLO world", regex)).toBe(0)
  })

  test("should handle global flag", () => {
    const regex = /a/g
    expect(earliestPossibleMatchIndex("banana", regex)).toBe(1)
  })

  test("should handle empty string", () => {
    const regex = /hello/
    expect(earliestPossibleMatchIndex("", regex)).toBe(-1)
  })

  test("should handle empty pattern", () => {
    const regex = /(?:)/
    expect(earliestPossibleMatchIndex("hello", regex)).toBe(0)
    expect(earliestPossibleMatchIndex("", regex)).toBe(0)
  })

  test("should handle complex email pattern", () => {
    const regex = /[a-z]+@[a-z]+\.[a-z]{2,}/
    expect(earliestPossibleMatchIndex("Contact: user@example.com", regex)).toBe(
      9,
    )
    expect(earliestPossibleMatchIndex("No email here", regex)).toBe(-1)
  })
})
