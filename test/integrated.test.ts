import { describe, expect, test, vi } from "vitest"
import { nz } from "../src/index"
import { assertResultsEqualsWithTiming, collectWithTimings, delayedStream } from "./timing-helpers"

describe("Integrated Pipeline Tests", () => {
  test("extracts answer sentences and emits them at least 100ms apart", async () => {
    vi.useFakeTimers()
    try {
      const stream = delayedStream(
        [
          "# Introduction\n",
          "This is some intro text.\n\n",
          "# Answer\n",
          "The first sentence is here.",
          " This is the second sentence.",
          " And here's the third one.",
          " Final sentence in answer.",
          "# Reasoning\n",
          "This reasoning section should be excluded.",
        ],
        10,
      )

      const collected = collectWithTimings(
        nz(stream)
          .after("# Answer")
          .before("# Reasoning")
          .split(/[.!?]/)
          .map((sentence) => sentence.trim())
          .filter((sentence) => sentence.length > 0)
          .minInterval(100)
          .value(),
      )
      await vi.runAllTimersAsync()

      // The splitter confirms punctuation at a chunk boundary on the next chunk (50ms).
      expect(await collected).toEqual([
        { item: "The first sentence is here", timestamp: 50 },
        { item: "This is the second sentence", timestamp: 150 },
        { item: "And here's the third one", timestamp: 250 },
        { item: "Final sentence in answer", timestamp: 350 },
      ])
    } finally {
      vi.useRealTimers()
    }
  })

  test("pipeline with non-string T", async () => {
    const source = delayedStream([1], 10)
    nz(source).tap(console.log).value()

    const stringSource = delayedStream(["a", "b", "c"], 10)
    nz(stringSource).split(" ").value()
  })

  test("complex pipeline with multiple transforms and timing", async () => {
    // Test a more complex pipeline with multiple transforms
    const source = ["prefix: ", "start", "item1,item2;item3", ".item4,item5", "end", " suffix"]

    const stream = delayedStream(source, 20)

    const results = await collectWithTimings(
      nz(stream)
        .after("start")
        .before("end")
        .split(/[,;.]/g)
        .filter((x) => x.trim().length > 0)
        .map((x) => x.trim().toUpperCase())
        .minInterval(150)
        .value(),
    )

    const items = results.map((r) => r.item)
    expect(items).toEqual(["ITEM1", "ITEM2", "ITEM3", "ITEM4", "ITEM5"])

    // Verify 150ms throttling
    assertResultsEqualsWithTiming(results, [
      { item: "ITEM1", timestamp: 60 + 0 },
      { item: "ITEM2", timestamp: 60 + 150 },
      { item: "ITEM3", timestamp: 60 + 300 },
      { item: "ITEM4", timestamp: 60 + 450 },
      { item: "ITEM5", timestamp: 60 + 600 },
    ])
  })

  test("real-world scenario: processing markdown sections with code blocks", async () => {
    const markdownResponse = [
      "# Task Description\n",
      "Please implement the following:\n\n",
      "```typescript\n",
      "function hello() {",
      "  console.log('Hello');",
      "  return 'world';",
      "}\n",
      "```\n\n",
      "# Implementation Notes\n",
      "Consider these points.",
      " Use proper types.",
      " Add error handling.",
      " Write tests.\n\n",
      "  ",
      "# Conclusion\n",
      "That's all!",
    ]

    const stream = delayedStream(markdownResponse, 150)

    const results = await collectWithTimings(
      nz(stream)
        .after("# Implementation Notes")
        .before("# Conclusion")
        .splitAfter(/[.]/g)
        .filter((x) => x.trim().length > 0)
        .map((x) => x.trim())
        .minInterval(800)
        .value(),
    )

    // wait 10*150ms for the first item = 1500ms. Then we have to delay for another item, because the regex might match more after the .

    // Verify 80ms throttling
    assertResultsEqualsWithTiming(results, [
      { item: "Consider these points.", timestamp: 1650 + 0 },
      { item: "Use proper types.", timestamp: 1650 + 800 },
      { item: "Add error handling.", timestamp: 1650 + 1600 },
      { item: "Write tests.", timestamp: 1650 + 2400 },
    ])
  })

  test("edge case: empty sections and immediate completion", async () => {
    const source = ["# Start", "# End\n", "more text"]

    const stream = delayedStream(source, 5)

    const results = await collectWithTimings(
      nz(stream).after("# Start").before("# End").split(/[.]/g).minInterval(50).value(),
    )

    assertResultsEqualsWithTiming(results, [{ item: "", timestamp: 10 }])
  })

  test("single item pipeline with rate limiting", async () => {
    const source = ["prefix", "single item", "suffix"]

    const stream = delayedStream(source, 10)

    const results = await collectWithTimings(nz(stream).after("prefix").before("suffix").minInterval(200).value())

    expect(results.map((r) => r.item)).toEqual(["single item"])

    assertResultsEqualsWithTiming(results, [{ item: "single item", timestamp: 20 }])
  })
})
