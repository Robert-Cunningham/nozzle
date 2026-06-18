import { generateWebm, TimestampedText } from "../generateWebm.js"
import { nz } from "../../../src/index.js"
import { timedSource, collectWithTimings } from "../timing-helpers.js"

async function main() {
  console.log("Generating parse demo GIF...")

  // Input tokens with image references split across weird chunk boundaries
  // This demonstrates how nozzle handles streaming text where patterns span chunks
  const inputTokens = [
    { value: "Here is im", time: 0 },
    { value: "g-ab", time: 200 },
    { value: "c123 for you, ", time: 400 },
    { value: "and img-xy", time: 600 },
    { value: "z789 too!", time: 800 },
  ]

  // Collect input with timestamps
  const inputWithTimings = await collectWithTimings(timedSource(inputTokens))
  const input: TimestampedText[] = inputWithTimings.map(({ item, timestamp }) => ({
    text: item,
    ts: timestamp,
  }))

  // Run parse() to extract image IDs into structured objects
  const outputStream = nz(timedSource(inputTokens)).parse(/img-(\w+)/g, (match) => ({ id: match[1] }))

  const outputWithTimings = await collectWithTimings(outputStream)
  const output: TimestampedText[] = outputWithTimings.map(({ item, timestamp }) => ({
    text: typeof item === "string" ? item : JSON.stringify(item),
    ts: timestamp,
  }))

  console.log("Input tokens:", input)
  console.log("Output tokens:", output)

  await generateWebm(input, output, "./assets/demo-parse.gif")

  console.log("Done! GIF saved to assets/demo-parse.gif")
}

main().catch(console.error)
