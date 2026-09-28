import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo, type Token } from "../gif.js"
import { arrivedBy, pendingByConsumption, recordTokens, sourceTokens, timedSource, type Chunk } from "./helpers.js"

export async function generateTeeDemo() {
  const chunks: Chunk[] = [
    { value: "Streaming to ", time: 0 },
    { value: "the user while ", time: 450 },
    { value: "saving the reply.", time: 900 },
  ]

  const [display, storage] = nz(timedSource(chunks)).tee(2)
  const start = Date.now()

  const [shown, saved] = await Promise.all([
    recordTokens(display.splitAfter(" ").compact().minInterval(220), chunks),
    storage.consume().then((consumed): Token[] => {
      const elapsed = Date.now() - start
      const ts = chunks.map((c) => c.time).find((time) => elapsed >= time && elapsed - time < 40) ?? elapsed
      return [{ text: `saved ✓ ${consumed.string().length} chars`, ts, kind: "object" }]
    }),
  ])

  const savedAt = saved[0].ts

  await renderDemo(
    {
      caption: "const [display, storage] = nz(stream).tee(2)",
      rows: [
        { label: "SOURCE", tokens: sourceTokens(chunks) },
        { label: "DISPLAY", tokens: shown, pending: pendingByConsumption(chunks, shown, (t) => t.text.length) },
        { label: "STORAGE", tokens: saved, pending: (t) => (t < savedAt ? arrivedBy(chunks, t) : "") },
      ],
      legend: ["chunk", "held", "object"],
    },
    "./assets/demo-tee",
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTeeDemo()
}
