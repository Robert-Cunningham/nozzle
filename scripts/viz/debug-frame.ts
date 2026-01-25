import { writeFileSync } from "node:fs"
import { nz } from "../../src/index.js"
import { timedSource, collectWithTimings } from "./timing-helpers.js"
import { buildTimeline, getVisibleTokens } from "./timeline.js"
import { renderFrame, createRenderer, closeRenderer } from "./renderFrame.js"
import type { TimestampedText } from "./types.js"

const options = {
  width: 1280,
  height: 160,
  fps: 30,
  fontSize: 20,
  backgroundColor: "#ffffff",
  holdDuration: 1000,
}

async function main() {
  // Input tokens with timestamps (simulating streaming input)
  const inputTokens = [
    { value: "hi ", time: 0 },
    { value: "there user-53", time: 200 },
    { value: "1950, it's ", time: 400 },
    { value: "great ", time: 600 },
    { value: "to see you", time: 800 },
  ]

  // Collect input with timestamps
  const inputWithTimings = await collectWithTimings(timedSource(inputTokens))
  const input: TimestampedText[] = inputWithTimings.map(({ item, timestamp }) => ({
    text: item,
    ts: timestamp,
  }))

  // Run the same input through parse() to extract user IDs
  const outputStream = nz(timedSource(inputTokens)).parse(/user-(\d+)/g, (match) => `[user:${match[1]}]`)

  const outputWithTimings = await collectWithTimings(outputStream)
  const output: TimestampedText[] = outputWithTimings.map(({ item, timestamp }) => ({
    text: String(item),
    ts: timestamp,
  }))

  const timeline = buildTimeline(input, output, options.holdDuration)

  // Get visible tokens at the end (all tokens visible)
  const visibleInput = getVisibleTokens(timeline.inputTokens, timeline.totalDurationMs)
  const visibleOutput = getVisibleTokens(timeline.outputTokens, timeline.totalDurationMs)

  const { browser, page } = await createRenderer(options)

  try {
    const buffer = await renderFrame(page, visibleInput, visibleOutput, options)
    writeFileSync("./debug-frame.png", buffer)
    console.log("Saved debug-frame.png")
  } finally {
    await closeRenderer(browser)
  }
}

main().catch(console.error)
