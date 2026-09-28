import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { pendingByConsumption, recordTokens, sourceTokens, timedSource, type Chunk } from "./helpers.js"

export async function generateParseDemo() {
  // The markers straddle chunk boundaries on purpose.
  const chunks: Chunk[] = [
    { value: "Here is im", time: 0 },
    { value: "g-abc", time: 550 },
    { value: "123 and im", time: 1100 },
    { value: "g-xyz", time: 1650 },
    { value: "789.", time: 2200 },
  ]

  const sources = new Map<string, string>()
  const output = await recordTokens(
    nz(timedSource(chunks)).parse(/img-(\w+)/g, (m) => ({ type: "image", id: m[1] })),
    chunks,
    (value) => {
      if (typeof value === "string") return { text: value, ts: 0 }
      const text = `image:${value.id}`
      sources.set(text, `img-${value.id}`)
      return { text, ts: 0, kind: "object" }
    },
  )

  await renderDemo(
    {
      caption: `nz(stream).parse(/img-(\\w+)/g, (m) => ({ type: "image", id: m[1] }))`,
      rows: [
        { label: "SOURCE", tokens: sourceTokens(chunks) },
        {
          label: "OUTPUT",
          tokens: output,
          pending: pendingByConsumption(chunks, output, (t) => (sources.get(t.text) ?? t.text).length),
        },
      ],
      legend: ["chunk", "held", "object"],
    },
    "./assets/demo-parse",
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateParseDemo()
}
