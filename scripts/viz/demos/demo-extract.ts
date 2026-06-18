import { pathToFileURL } from "node:url"
import { generateWebm } from "../generateWebm.js"
import { nz } from "../../../src/index.js"
import { timedSource, timelineFromStream, timelineFromTokens } from "./helpers.js"

export async function generateExtractDemo() {
  console.log("Generating extract demo GIF...")

  const inputTokens = [
    { value: "Sure.\n```ts\n", time: 0 },
    { value: "const title = ", time: 180 },
    { value: "await page.title()\n", time: 360 },
    { value: "return title\n", time: 540 },
    { value: "```\nDone.", time: 720 },
  ]

  const input = timelineFromTokens(inputTokens)
  const output = await timelineFromStream(nz(timedSource(inputTokens)).after("```ts\n").before("```"))

  console.log("Input tokens:", input)
  console.log("Output tokens:", output)

  await generateWebm(input, output, "./assets/demo-extract.gif", {
    height: 320,
    fontSize: 18,
    holdDuration: 1200,
  })

  console.log("Done! GIF saved to assets/demo-extract.gif")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateExtractDemo().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
