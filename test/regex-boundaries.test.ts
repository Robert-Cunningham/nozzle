import { expect, test } from "vitest"
import { nz } from "../src"

function* partitions(text: string): Generator<string[]> {
  for (let mask = 0; mask < 2 ** Math.max(0, text.length - 1); mask++) {
    const chunks: string[] = []
    let start = 0
    for (let i = 1; i < text.length; i++) {
      if (mask & (1 << (i - 1))) {
        chunks.push(text.slice(start, i))
        start = i
      }
    }
    chunks.push(text.slice(start))
    yield chunks
  }
}

test.each([
  ["xababy", /a(b+)/g],
  ["cat dog", /cat|dog/g],
  ["a12b3", /(?<digits>\d+)/g],
  ["a😀b😀", /😀/gu],
  ["a😀b😀", /./gu],
  ["Aaa!", /a+/gi],
] as const)("matches and replacements survive every partition of %s with %s", async (text, regex) => {
  const expected = [...text.matchAll(regex)].map((match) => [...match])
  for (const chunks of partitions(text)) {
    const results = await nz(chunks).match(regex).consume()
    expect(
      results.list().map((match) => [...match]),
      JSON.stringify(chunks),
    ).toEqual(expected)
    expect((await nz(chunks).replace(regex, "X").consume()).string()).toBe(text.replace(regex, "X"))
  }
})

test("literal splitting survives every delimiter boundary", async () => {
  for (const chunks of partitions("a::b::c")) {
    expect((await nz(chunks).split("::").consume()).list()).toEqual(["a", "b", "c"])
  }
})

test.each([/^./g, /a$/g, /\bfoo\b/g, /a*/g, /a?/g, /a/y])(
  "rejects unsupported %s during iteration without pulling the source",
  async (regex) => {
    let pulled = false
    async function* source() {
      pulled = true
      yield "abc"
    }
    await expect(nz(source()).match(regex).consume()).rejects.toThrow(/Unsupported regex feature/)
    expect(pulled).toBe(false)
  },
)

test("escaped anchors and anchors in character classes remain literal", async () => {
  expect((await nz(["^", "$", "a"]).match(/[\^$]/g).consume()).list().map((m) => m[0])).toEqual(["^", "$"])
  expect((await nz(["^", "$"]).match(/\^\$/g).consume()).list()[0][0]).toBe("^$")
})

test("matching does not mutate the caller's regex lastIndex", async () => {
  const regex = /a/g
  regex.lastIndex = 7
  expect((await nz(["a", "a"]).match(regex).consume()).list()).toHaveLength(2)
  expect(regex.lastIndex).toBe(7)
})
