import { pathToFileURL } from "node:url"
import { generateRowsGif, type TimestampedText } from "../generateWebm.js"
import { nz } from "../../../src/index.js"
import { timedSource, timelineFromTokens } from "./helpers.js"

export async function generateTeeDemo() {
  console.log("Generating tee demo GIF...")

  const inputTokens = [
    { value: "Streaming ", time: 0 },
    { value: "to the user ", time: 180 },
    { value: "while saving ", time: 360 },
    { value: "the reply.", time: 540 },
  ]

  const input = timelineFromTokens(inputTokens)
  const [displayStream, storageStream] = nz(timedSource(inputTokens)).tee(2)

  const start = Date.now()

  const displayPromise = (async (): Promise<TimestampedText[]> => {
    const values: TimestampedText[] = []
    for await (const chunk of displayStream) {
      values.push({
        text: chunk,
        ts: Math.round((Date.now() - start) / 10) * 10,
      })
    }
    return values
  })()

  const storagePromise = (async (): Promise<TimestampedText[]> => {
    const consumed = await storageStream.consume()
    return [
      {
        text: `saved: ${consumed.string()}`,
        ts: Math.round((Date.now() - start) / 10) * 10,
      },
    ]
  })()

  const [display, storage] = await Promise.all([displayPromise, storagePromise])

  console.log("Input tokens:", input)
  console.log("Display tokens:", display)
  console.log("Storage tokens:", storage)

  await generateRowsGif(
    [
      { label: "SOURCE", tokens: input },
      { label: "DISPLAY", tokens: display },
      { label: "STORAGE", tokens: storage },
    ],
    "./assets/demo-tee.gif",
    {
      height: 240,
      holdDuration: 1300,
    },
  )

  console.log("Done! GIF saved to assets/demo-tee.gif")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTeeDemo().catch((error) => {
    console.error(error)
    process.exit(1)
  })
}
