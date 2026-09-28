import { mkdirSync, rmSync, writeFileSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { randomBytes } from "node:crypto"
import ffmpeg from "fluent-ffmpeg"
import ffmpegPath from "ffmpeg-static"
import type { Page } from "puppeteer"

if (ffmpegPath) ffmpeg.setFfmpegPath(ffmpegPath)

/** One value yielded by a stream, `ts` ms after the demo starts. */
export interface Token {
  text: string
  ts: number
  /** Objects render as chips instead of chunk-tinted text. */
  kind?: "text" | "object"
}

export interface Row {
  label: string
  tokens: Token[]
  /** Text the stage has received but not yet yielded at time `t`, drawn as a ghost. */
  pending?: (t: number) => string
}

export interface Demo {
  /** Pipeline code shown in the header. */
  caption: string
  rows: Row[]
  legend: Array<"chunk" | "held" | "object">
  /** How long to hold the final state before looping. */
  holdMs?: number
}

const WIDTH = 820
const SCALE = 2
const FPS = 20
const LEAD_MS = 500
const FLASH_MS = 400

type Theme = "light" | "dark"

interface FrameRow {
  label: string
  tokens: Array<{ text: string; kind: "text" | "object"; parity: number; flash: number }>
  pending: string
}

interface FrameState {
  clock: string
  progress: number
  rows: FrameRow[]
}

function frameState(demo: Demo, t: number, endMs: number): FrameState {
  const local = t - LEAD_MS
  return {
    clock: `${(Math.min(Math.max(local, 0), endMs) / 1000).toFixed(2)}s`,
    progress: endMs === 0 ? 1 : Math.min(Math.max(local / endMs, 0), 1),
    rows: demo.rows.map((row) => ({
      label: row.label,
      tokens: row.tokens
        .map((token, index) => ({ token, index }))
        .filter(({ token }) => local >= token.ts)
        .map(({ token, index }) => ({
          text: token.text,
          kind: token.kind ?? "text",
          parity: index % 2,
          flash: Math.max(0, 1 - (local - token.ts) / FLASH_MS),
        })),
      pending: local >= 0 ? (row.pending?.(local) ?? "") : "",
    })),
  }
}

function pageHtml(demo: Demo, theme: Theme): string {
  const legend = {
    chunk: `<span class="tok p0">chunk</span><span class="tok p1">chunk</span> yielded values`,
    held: `<span class="pending">held</span> buffered, not yet yielded`,
    object: `<span class="chip">object</span> non-string value`,
  }
  return `<!DOCTYPE html>
<html data-theme="${theme}">
<head>
<style>
  :root {
    --bg: #ffffff; --fg: #1f2328; --muted: #6e7781; --rule: #d8dee4;
    --chunk-0: #dbeafe; --chunk-1: #bfdbfe; --chunk-fg: #0b2a5b; --flash: #fde047; --flash-max: 75%;
    --chip-bg: #fef3c7; --chip-fg: #7c2d12; --chip-border: #f59e0b;
    --ghost: #8c959f; --bar: #2563eb; --bar-track: #eaeef2;
    --code-str: #0a7f4f; --code-fn: #8250df;
  }
  [data-theme="dark"] {
    --bg: #0d1117; --fg: #e6edf3; --muted: #8b949e; --rule: #30363d;
    --chunk-0: #1b3160; --chunk-1: #2c4f9a; --chunk-fg: #dbeafe; --flash: #ffffff; --flash-max: 32%;
    --chip-bg: #3b2305; --chip-fg: #fcd34d; --chip-border: #b45309;
    --ghost: #6e7681; --bar: #58a6ff; --bar-track: #21262d;
    --code-str: #7ee2a8; --code-fn: #d2a8ff;
  }
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: ${WIDTH}px; background: var(--bg); color: var(--fg);
    font: 17px/1.9 "JetBrains Mono", "SF Mono", "Noto Sans Mono", "DejaVu Sans Mono", monospace;
    padding: 18px 22px 14px;
  }
  header { display: flex; justify-content: space-between; align-items: baseline; gap: 16px;
    padding-bottom: 12px; border-bottom: 1px solid var(--rule); font-size: 15px; }
  .caption { white-space: pre; overflow: hidden; }
  .caption .s { color: var(--code-str); }
  .caption .f { color: var(--code-fn); }
  .clock { color: var(--muted); font-variant-numeric: tabular-nums; }
  .row { display: flex; gap: 14px; padding: 12px 0; border-bottom: 1px solid var(--rule); min-height: 58px; }
  .label { font: 600 12px/32px Inter, "Noto Sans", system-ui, sans-serif; letter-spacing: 0.08em; color: var(--muted); width: 72px; flex-shrink: 0; }
  .tokens { white-space: pre-wrap; word-break: break-word; min-width: 0; }
  .tok { color: var(--chunk-fg); padding: 3px 0; border-radius: 2px;
    -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  .p0 { background: color-mix(in srgb, var(--flash) calc(var(--f, 0) * var(--flash-max)), var(--chunk-0)); }
  .p1 { background: color-mix(in srgb, var(--flash) calc(var(--f, 0) * var(--flash-max)), var(--chunk-1)); }
  .chip { display: inline-block; line-height: 1.5; padding: 0 8px; margin: 0 2px; border-radius: 6px;
    background: color-mix(in srgb, var(--flash) calc(var(--f, 0) * var(--flash-max)), var(--chip-bg));
    color: var(--chip-fg); border: 1.5px solid var(--chip-border); font-weight: 600; }
  .pending { color: var(--ghost); outline: 1.5px dashed var(--ghost); outline-offset: -1px;
    padding: 3px 0; border-radius: 2px; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
  footer { display: flex; align-items: center; gap: 18px; padding-top: 12px;
    font: 500 12px/1.6 Inter, "Noto Sans", system-ui, sans-serif; color: var(--muted); }
  .bar { flex: 1; height: 3px; background: var(--bar-track); border-radius: 2px; overflow: hidden; }
  .bar > div { height: 100%; background: var(--bar); }
  .legend { display: flex; gap: 14px; white-space: nowrap; }
  .legend .tok, .legend .pending, .legend .chip { font: 12px "JetBrains Mono", "SF Mono", "Noto Sans Mono", monospace; padding: 1px 3px; }
  .legend .chip { line-height: 1.4; border-width: 1px; }
</style>
</head>
<body>
  <header><div class="caption" id="caption"></div><div class="clock" id="clock"></div></header>
  <main id="rows"></main>
  <footer><div class="bar"><div id="bar"></div></div><div class="legend">${demo.legend.map((key) => `<span>${legend[key]}</span>`).join("")}</div></footer>
<script>
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  document.getElementById("caption").innerHTML = esc(${JSON.stringify(demo.caption)})
    .replace(/("(?:\\\\.|[^"])*"|\\/(?:\\\\.|[^/ ])+\\/g?)/g, '<span class="s">$1</span>')
    .replace(/\\.(\\w+)\\(/g, '.<span class="f">$1</span>(')
  window.render = (state) => {
    document.getElementById("clock").textContent = state.clock
    document.getElementById("bar").style.width = (state.progress * 100) + "%"
    document.getElementById("rows").innerHTML = state.rows.map((row) =>
      '<div class="row"><div class="label">' + esc(row.label) + '</div><div class="tokens">' +
      row.tokens.map((t) => t.kind === "object"
        ? '<span class="chip" style="--f:' + t.flash + '">' + esc(t.text) + '</span>'
        : '<span class="tok p' + t.parity + '" style="--f:' + t.flash + '">' + esc(t.text) + '</span>').join("") +
      (row.pending ? '<span class="pending">' + esc(row.pending) + '</span>' : '') +
      '</div></div>').join("")
    return document.body.scrollHeight
  }
</script>
</body>
</html>`
}

async function renderTheme(page: Page, demo: Demo, theme: Theme, outPath: string): Promise<void> {
  const endMs = Math.max(0, ...demo.rows.flatMap((row) => row.tokens.map((token) => token.ts)))
  const totalMs = LEAD_MS + endMs + (demo.holdMs ?? 2500)
  const frames = Array.from({ length: Math.ceil((totalMs * FPS) / 1000) }, (_, i) =>
    frameState(demo, (i * 1000) / FPS, endMs),
  )

  await page.setViewport({ width: WIDTH, height: 200, deviceScaleFactor: SCALE })
  await page.setContent(pageHtml(demo, theme), { waitUntil: "load" })
  await page.evaluate(() => document.fonts.ready)

  // Size every frame to the tallest state so rows never jump.
  let height = 0
  for (const state of frames) {
    height = Math.max(height, await page.evaluate((s) => (window as any).render(s), state))
  }
  await page.setViewport({ width: WIDTH, height, deviceScaleFactor: SCALE })

  const dir = join(tmpdir(), `nozzle-gif-${randomBytes(6).toString("hex")}`)
  mkdirSync(dir, { recursive: true })
  try {
    for (const [i, state] of frames.entries()) {
      await page.evaluate((s) => (window as any).render(s), state)
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
    // A fresh page per theme: setContent keeps the old realm, so page scripts would redeclare.
    await renderTheme(await browser.newPage(), demo, "light", `${base}.gif`)
    await renderTheme(await browser.newPage(), demo, "dark", `${base}-dark.gif`)
  } finally {
    await browser.close()
  }
  console.log(`Wrote ${base}.gif and ${base}-dark.gif`)
}
