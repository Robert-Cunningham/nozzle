import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { LEAD_MS, toSteps, type CharFate } from "./helpers.js"

const INTERVAL_MS = 300
/** Recorded times snap to this grid, which absorbs timer jitter. */
const SNAP_MS = 50

export async function generateTimingDemo() {
  // Bursty, irregular provider output.
  const chunks = [
    { text: "The quick ", time: 0 },
    { text: "brown fox jumps over ", time: 300 },
    { text: "the lazy dog.", time: 1900 },
  ]

  // This pipeline is about time, so run it against the clock and record when each word comes out.
  const start = Date.now()
  async function* source() {
    for (const chunk of chunks) {
      await new Promise((resolve) => setTimeout(resolve, Math.max(0, chunk.time - (Date.now() - start))))
      yield chunk.text
    }
  }
  const words: Array<{ text: string; time: number }> = []
  for await (const text of nz(source()).splitAfter(" ").compact().minInterval(INTERVAL_MS)) {
    words.push({ text, time: Math.round((Date.now() - start) / SNAP_MS) * SNAP_MS })
  }

  const times = [...new Set([...chunks, ...words].map((event) => event.time))].sort((a, b) => a - b)
  const moments = times.map((time) => ({
    at: LEAD_MS + time,
    arrived: chunks
      .filter((chunk) => chunk.time <= time)
      .map((chunk) => chunk.text)
      .join(""),
    time,
  }))
  const steps = toSteps(moments, ({ at, arrived }) => {
    const time = moments.find((m) => m.at === at)!.time
    const released = words
      .filter((word) => word.time <= time)
      .map((word) => word.text)
      .join("").length
    // Words that have arrived wait, held, until their turn.
    return [...arrived].map((_, i): CharFate => ({ fate: i < released ? "out" : "held", key: "" }))
  })

  await renderDemo(
    { chunks: chunks.map((chunk) => ({ text: chunk.text, at: LEAD_MS + chunk.time })), steps, size: "26px" },
    "./assets/demo-timing",
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateTimingDemo()
}
