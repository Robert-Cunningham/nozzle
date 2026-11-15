// Runs inside the headless page that gif.ts screenshots. render(t) draws the stream as it stands at
// time t: one block of text, each run drawn by what became of it (see Fate in gif.ts).
;(() => {
  const demo = window.DEMO
  const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  const FADE_MS = 260
  const fade = (t, at) => {
    const x = Math.max(0, Math.min(1, (t - at) / FADE_MS))
    return (1 - Math.pow(1 - x, 3)).toFixed(3)
  }
  const end = demo.steps.at(-1).at

  function stream(step, t) {
    // Settled neighbours with the same fate join up, so a highlight has no seams between chunks.
    const settled = (r) => t >= r.arrivedAt + FADE_MS
    const ranges = []
    for (const r of step.ranges) {
      const last = ranges.at(-1)
      if (last && r.fate !== "obj" && last.fate === r.fate && settled(last) && settled(r)) last.text += r.text
      else ranges.push({ ...r })
    }
    return ranges
      .map((r) => {
        if (r.fate === "obj") return `<span class="pill" style="opacity:${fade(t, r.bornAt)}">${esc(r.label)}</span>`
        // Only text that just arrived fades in; text that merely changed fate switches at once.
        const kind = r.fate === "out" ? (demo.highlightKept ? "keep" : "") : r.fate
        return `<span class="${kind}" style="opacity:${fade(t, r.arrivedAt)}">${esc(r.text)}</span>`
      })
      .join("")
  }

  /** The raw source on one line, chunks in alternating grays, newlines spelled out. */
  const source = (t) =>
    demo.chunks
      .map(
        (c, i) =>
          `<span class="c${i % 2}" style="opacity:${fade(t, c.at)}">${esc(c.text.replace(/\n/g, "\\n"))}</span>`,
      )
      .join("")

  window.render = (t) => {
    const step = demo.steps.findLast((s) => t >= s.at)
    const blink = t >= end ? 0 : Math.floor(t / 400) % 2 ? 0.25 : 1
    const live = (step ? stream(step, t) : "") + `<span class="caret" style="opacity:${blink}"></span>`
    const final = stream(demo.steps.at(-1), Infinity) + `<span class="caret"></span>`
    document.getElementById("root").innerHTML =
      `<div class="source">${source(t)}</div>` +
      `<div class="stack"><div class="ghost">${final}</div><div>${live}</div></div>`
    return document.body.scrollHeight
  }
})()
