import { pathToFileURL } from "node:url"
import { generateWebm } from "../generateWebm.js"
import { nz } from "../../../src/index.js"
import { timedSource, timelineFromStream, timelineFromTokens } from "./helpers.js"

export async function generateTimingDemo() {
  console.log("Generating timing demo GIF...")

  const inputTokens = [
    { value: "The quick brown fox ", time: 0 },
    { value: "jumps over the ", time: 70 },
    { value: "lazy dog.", time: 140 },
  ]

  const input = timelineFromTokens(inputTokens)
  const output = await timelineFromStream(nz(timedSource(inputTokens)).splitAfter(" ").compact().minInterval(130))

  console.log("Input tokens:", input)
  console.log("Output tokens:", output)

  await generateWebm(input, output, "./assets/demo-timing.gif", {
    holdDuration: 1400,
  })

  console.log("Done! GIF saved to assets/demo-timing.gif")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTimingDemo().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
