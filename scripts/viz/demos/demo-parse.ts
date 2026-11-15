import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { LEAD_MS, toSteps, yieldsByChunk, type CharFate } from "./helpers.js"

const STEP_MS = 850

export async function generateParseDemo() {
  // The markers straddle chunk boundaries on purpose.
  const texts = ["Here is im", "g-abc", "123 and im", "g-xyz", "789."]
  const byChunk = await yieldsByChunk(texts, (source) => nz(source).parse(/img-(\w+)/g, (m) => ({ src: m[1] })))
  // Each yielded value accounts for a stretch of source text, in order.
  const outs = byChunk.flatMap((values, chunk) =>
    values
      .filter((value) => value !== "")
      .map((value) =>
        typeof value === "string"
          ? { chunk, fate: "out" as const, length: value.length, label: undefined }
          : { chunk, fate: "obj" as const, length: `img-${value.src}`.length, label: `{ src: "${value.src}" }` },
      ),
  )

  const moments = texts.map((_, chunk) => ({
    at: LEAD_MS + chunk * STEP_MS,
    arrived: texts.slice(0, chunk + 1).join(""),
    chunk,
  }))
  const steps = toSteps(moments, (moment) => {
    const chunk = moments.find((m) => m.at === moment.at)!.chunk
    const fates: CharFate[] = []
    outs
      .filter((o) => o.chunk <= chunk)
      .forEach((o, index) => {
        for (let i = 0; i < o.length; i++) fates.push({ fate: o.fate, key: String(index), label: o.label })
      })
    // Whatever has arrived but not been yielded is being held as a possible match.
    while (fates.length < moment.arrived.length) fates.push({ fate: "held", key: "" })
    return fates
  })

  const chunks = texts.map((text, chunk) => ({ text, at: moments[chunk].at }))
  await renderDemo({ chunks, steps, size: "27px" }, "./assets/demo-parse")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateParseDemo()
}
