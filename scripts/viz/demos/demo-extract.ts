import { pathToFileURL } from "node:url"
import { nz } from "../../../src/index.js"
import { renderDemo } from "../gif.js"
import { arrivedBy, recordTokens, sourceTokens, timedSource, type Chunk } from "./helpers.js"

export async function generateExtractDemo() {
  // Both fences are split across chunks.
  const chunks: Chunk[] = [
    { value: "Sure, here it is.\n``", time: 0 },
    { value: "`ts\nconst title = ", time: 550 },
    { value: "await page.title()\n", time: 1100 },
    { value: "return title\n``", time: 1650 },
    { value: "`\nDone!", time: 2200 },
  ]

  const output = await recordTokens(nz(timedSource(chunks)).after("```ts\n").before("```"), chunks)

  const full = chunks.map((c) => c.value).join("")
  const bodyStart = full.indexOf("```ts\n") + "```ts\n".length
  const bodyEnd = full.indexOf("```", bodyStart)

  // Only text inside the fenced block is headed for the output; show what's buffered there.
  const pending = (t: number) => {
    const arrived = arrivedBy(chunks, t)
    if (arrived.length < bodyStart) return ""
    const closed = arrived.length >= bodyEnd + 3
    const emitted = output.filter((token) => token.ts <= t).reduce((sum, token) => sum + token.text.length, 0)
    return arrived.slice(bodyStart, closed ? bodyEnd : arrived.length).slice(emitted)
  }

  await renderDemo(
    {
      caption: 'nz(stream).after("```ts\\n").before("```")',
      rows: [
        { label: "SOURCE", tokens: sourceTokens(chunks) },
        { label: "OUTPUT", tokens: output, pending },
      ],
      legend: ["chunk", "held"],
    },
    "./assets/demo-extract",
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  generateExtractDemo()
}
