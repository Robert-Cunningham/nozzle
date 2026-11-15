import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { LEAD_MS, toSteps, yieldsByChunk, type CharFate } from "./helpers.js"

const STEP_MS = 850
const OPEN = "```ts\n"
const CLOSE = "```"

export async function generateExtractDemo() {
  // Both fences are split across chunks.
  const texts = ["Sure, here it is.\n``", "`ts\nconst title = ", "await page.title()\n", "return title\n``", "`\nDone!"]
  const byChunk = await yieldsByChunk(texts, (source) => nz(source).after(OPEN).before(CLOSE))
  const yieldedBy = (chunk: number) =>
    byChunk
      .slice(0, chunk + 1)
      .flat()
      .join("").length

  const full = texts.join("")
  const bodyStart = full.indexOf(OPEN) + OPEN.length
  const bodyEnd = full.indexOf(CLOSE, bodyStart)

  const moments = texts.map((_, chunk) => ({
    at: LEAD_MS + chunk * STEP_MS,
    arrived: texts.slice(0, chunk + 1).join(""),
    chunk,
  }))
  const steps = toSteps(moments, ({ at, arrived }) => {
    const chunk = moments.find((m) => m.at === at)!.chunk
    const opened = arrived.length >= bodyStart
    const closed = arrived.length >= bodyEnd + CLOSE.length
    // Before the opening fence is found, only a trailing piece that could begin it is held.
    let partial = 0
    if (!opened) {
      for (let n = Math.min(OPEN.length - 1, arrived.length); n > 0 && !partial; n--) {
        if (OPEN.startsWith(arrived.slice(-n))) partial = n
      }
    }
    return [...arrived].map((_, i): CharFate => {
      if (!opened) return i >= arrived.length - partial ? { fate: "held", key: "" } : { fate: "drop", key: "" }
      if (i < bodyStart) return { fate: "drop", key: "" }
      if (i < bodyStart + yieldedBy(chunk)) return { fate: "out", key: "" }
      // Past what has been yielded: the closing fence and everything after it, or text still held.
      return closed ? { fate: "drop", key: "" } : { fate: "held", key: "" }
    })
  })

  const chunks = texts.map((text, chunk) => ({ text, at: moments[chunk].at }))
  await renderDemo({ chunks, steps, size: "17px", highlightKept: true }, "./assets/demo-extract")
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateExtractDemo()
}
