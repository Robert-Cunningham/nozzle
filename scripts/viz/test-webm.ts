import { generateWebm, TimestampedText } from "./generateWebm.js"
import { nz } from "../../src/index.js"
import { timedSource, collectWithTimings } from "./timing-helpers.js"

async function main() {
  console.log("Generating test video...")

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
  // This simulates a streaming parser that extracts structured data
  const outputStream = nz(timedSource(inputTokens)).parse(/user-(\d+)/g, (match) => `[user:${match[1]}]`)

  const outputWithTimings = await collectWithTimings(outputStream)
  const output: TimestampedText[] = outputWithTimings.map(({ item, timestamp }) => ({
    text: String(item),
    ts: timestamp,
  }))

  console.log("Input tokens:", input)
  console.log("Output tokens:", output)

  await generateWebm(input, output, "./test-output.gif")

  console.log("Done! GIF saved to test-output.gif")
}

main().catch(console.error)
