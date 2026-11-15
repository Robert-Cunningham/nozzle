import { mkdirSync, readFileSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { randomBytes } from "node:crypto"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import type { Page } from "puppeteer"

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath)

/**
 * What became of a piece of source text:
 * `out` was yielded as text, `obj` was yielded as an object, `held` is buffered, `drop` was discarded.
 */
export type Fate = "out" | "obj" | "held" | "drop"

/** A run of source text that shares one fate. Times are ms after the demo starts. */
export interface Range {
  text: string
  fate: Fate
  /** When this text arrived from the source. */
  arrivedAt: number
  /** When it took its current fate. */
  bornAt: number
  /** Label for an `obj` range. */
  id?: string
}

/** The whole stream so far, as it stands from `at` until the next step. */
export interface Step {
  at: number
  ranges: Range[]
}

export interface Demo {
  /** Source chunks, drawn small above the stream in alternating grays to show where they split. */
  chunks: Array<{ text: string; at: number }>
  steps: Step[]
  /** CSS font size. Longer demos use smaller type so every gif keeps the same width. */
  size: string
  /** Highlight yielded text, for demos about what is kept rather than what is transformed. */
  highlightKept?: boolean
  /** How long to hold the final state before looping. */
  holdMs?: number
}

const WIDTH = 820
const SCALE = 2
const FPS = 20

type Theme = "light" | "dark"

function pageHtml(demo: Demo, theme: Theme): string {
  return `<!DOCTYPE html>
<html data-theme="${theme}">
<head>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@500;700&display=block">
<style>
  :root {
    --bg: #ffffff; --fg: #1f2328; --accent: #0969da; --accent-bg: #ddf4ff; --held: #9a6700; --drop: #a3abb3;
    --chunk-0: #59636e; --chunk-1: #a3abb3;
  }
  [data-theme="dark"] {
    --bg: #0d1117; --fg: #e6edf3; --accent: #4493f8; --accent-bg: #132339; --held: #d29922; --drop: #586069;
    --chunk-0: #9198a1; --chunk-1: #59626c;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; padding: 24px 28px; background: var(--bg); color: var(--fg);
    font: 500 ${demo.size}/1.6 "JetBrains Mono", "DejaVu Sans Mono", monospace;
    -webkit-font-smoothing: antialiased;
  }
  .pill { display: inline-block; background: var(--accent-bg); color: var(--accent); border-radius: 9px; padding: 1px 12px; font-size: .8em; line-height: 1.75; }
  .pill b { font-weight: 700; }
  .held { color: var(--held); border-bottom: 2px dotted var(--held); }
  .drop { color: var(--drop); }
  .keep { background: var(--accent-bg); border-radius: 3px; padding: 3px 0; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .source { font-size: 13px; line-height: 1.5; min-height: 1.5em; margin-bottom: 12px; }
  .source, .stack { white-space: pre; }
  .c0 { color: var(--chunk-0); }
  .c1 { color: var(--chunk-1); }
  .caret { display: inline-block; width: 2px; height: 1.05em; background: var(--accent); vertical-align: -0.16em; margin-left: 3px; }
  /* The final state is laid out invisibly under the live one, so the frame never changes size. */
  .stack { display: grid; }
  .stack > * { grid-area: 1 / 1; }
  .ghost { visibility: hidden; }
</style>
</head>
<body>
  <div id="root"></div>
  <script>window.DEMO = ${JSON.stringify(demo)}</script>
  <script>${readFileSync(join(dirname(fileURLToPath(import.meta.url)), "page.js"), "utf-8")}</script>
</body>
</html>`
}

async function renderTheme(page: Page, demo: Demo, theme: Theme, outPath: string): Promise<void> {
  const totalMs = demo.steps.at(-1)!.at + (demo.holdMs ?? 2600)
  const times = Array.from({ length: Math.ceil((totalMs * FPS) / 1000) }, (_, i) => (i * 1000) / FPS)
  const draw = (t: number) => page.evaluate((time) => (window as any).render(time), t)

  await page.setViewport({ width: WIDTH, height: 200, deviceScaleFactor: SCALE })
  await page.setContent(pageHtml(demo, theme), { waitUntil: "load" })
  // Nothing is drawn yet, so ask for the fonts by name rather than waiting on layout to request them.
  await page.evaluate(() =>
    Promise.all(["500", "700"].map((weight) => document.fonts.load(`${weight} 16px "JetBrains Mono"`))),
  )
  await page.setViewport({ width: WIDTH, height: await draw(totalMs), deviceScaleFactor: SCALE })

  const dir = join(tmpdir(), `nozzle-gif-${randomBytes(6).toString("hex")}`)
  mkdirSync(dir, { recursive: true })
  try {
    for (const [i, t] of times.entries()) {
      await draw(t)
      writeFileSync(join(dir, `f${String(i).padStart(5, "0")}.png`), await page.screenshot({ type: "png" }))
    }
    await new Promise<void>((resolve, reject) =>
      ffmpeg()
        .input(join(dir, "f%05d.png"))
        .inputFPS(FPS)
        .complexFilter(["split[a][b];[a]palettegen=max_colors=96:stats_mode=full[p];[b][p]paletteuse=dither=none"])
        .outputOptions(["-loop", "0"])
        .output(outPath)
        .on("end", () => resolve())
        .on("error", reject)
        .run(),
    )
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
}

/** Renders `<base>.gif` and `<base>-dark.gif`. */
export async function renderDemo(demo: Demo, base: string): Promise<void> {
  const puppeteer = await import("puppeteer")
  const browser = await puppeteer.default.launch({ headless: true, args: ["--no-sandbox"] })
  try {
    // One page at a time: a background tab does not paint, so its screenshots hang.
    for (const theme of ["light", "dark"] as const) {
      const page = await browser.newPage()
      await renderTheme(page, demo, theme, `${base}${theme === "dark" ? "-dark" : ""}.gif`)
      await page.close()
    }
  } finally {
    await browser.close()
  }
  console.log(`Wrote ${base}.gif and ${base}-dark.gif`)
}
