import { pathToFileURL } from "node:url"
import { generateWebm } from "../generateWebm.js"
import { nz } from "../../../src/index.js"
import { timedSource, timelineFromStream, timelineFromTokens } from "./helpers.js"

export async function generateParseDemo() {
  console.log("Generating parse demo GIF...")

  // Input tokens with image references split across weird chunk boundaries
  // This demonstrates how nozzle handles streaming text where patterns span chunks
  const inputTokens = [
    { value: "Here is im", time: 0 },
    { value: "g-abc", time: 180 },
    { value: "123 and im", time: 360 },
    { value: "g-xyz", time: 540 },
    { value: "789.", time: 720 },
  ]

  const input = timelineFromTokens(inputTokens)

  const output = await timelineFromStream(
    nz(timedSource(inputTokens)).parse(/img-(\w+)/g, (match) => ({ type: "image", id: match[1] })),
  )

  console.log("Input tokens:", input)
  console.log("Output tokens:", output)

  await generateWebm(input, output, "./assets/demo-parse.gif")

  console.log("Done! GIF saved to assets/demo-parse.gif")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateParseDemo().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
