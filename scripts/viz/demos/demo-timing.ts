import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { pendingByConsumption, recordTokens, sourceTokens, timedSource, type Chunk } from "./helpers.js"

export async function generateTimingDemo() {
  // Bursty, irregular provider output.
  const chunks: Chunk[] = [
    { value: "The quick ", time: 0 },
    { value: "brown fox jumps over ", time: 250 },
    { value: "the lazy dog.", time: 1400 },
  ]

  const output = await recordTokens(nz(timedSource(chunks)).splitAfter(" ").compact().minInterval(220), chunks)

  await renderDemo(
    {
      caption: 'nz(stream).splitAfter(" ").compact().minInterval(220)',
      rows: [
        { label: "SOURCE", tokens: sourceTokens(chunks) },
        { label: "OUTPUT", tokens: output, pending: pendingByConsumption(chunks, output, (t) => t.text.length) },
      ],
      legend: ["chunk", "held"],
    },
    "./assets/demo-timing",
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTimingDemo()
}
