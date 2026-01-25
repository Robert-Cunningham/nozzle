import type { Browser, Page } from "puppeteer"
import type { TokenWithColor, ResolvedOptions } from "./types.js"

/**
 * Generate HTML for a row of tokens.
 */
function generateTokensHtml(tokens: TokenWithColor[]): string {
  return tokens
    .map((token) => {
      const rgb = hexToRgb(token.color)
      return `<span style="background-color: rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.35); color: ${token.color}">${escapeHtml(token.text)}</span>`
    })
    .join("")
}

/**
 * Parse a hex color to RGB components.
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) {
    return { r: 0, g: 0, b: 0 }
  }
  return {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16),
  }
}

/**
 * Escape HTML special characters.
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;")
}

/**
 * Generate the full HTML page for rendering.
 */
function generateHtml(inputTokens: TokenWithColor[], outputTokens: TokenWithColor[], options: ResolvedOptions): string {
  const inputHtml = generateTokensHtml(inputTokens)
  const outputHtml = generateTokensHtml(outputTokens)

  return `<!DOCTYPE html>
<html>
<head>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      background-color: ${options.backgroundColor};
      font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', 'Consolas', monospace;
      font-size: ${options.fontSize}px;
      width: ${options.width}px;
      height: ${options.height}px;
      display: flex;
      flex-direction: column;
    }
    .row {
      flex: 1;
      display: flex;
      align-items: center;
      padding: 0 20px;
    }
    .row:first-child {
      border-bottom: 1px solid #dddddd;
    }
    .label {
      color: #666666;
      font-weight: bold;
      width: 110px;
      flex-shrink: 0;
    }
    .tokens {
      white-space: pre;
    }
    .tokens span {
      padding: 4px 0;
    }
  </style>
</head>
<body>
  <div class="row">
    <span class="label">INPUT</span>
    <span class="tokens">${inputHtml}</span>
  </div>
  <div class="row">
    <span class="label">OUTPUT</span>
    <span class="tokens">${outputHtml}</span>
  </div>
</body>
</html>`
}

/**
 * Render a single frame using Puppeteer.
 * Returns a PNG buffer.
 */
export async function renderFrame(
  page: Page,
  inputTokens: TokenWithColor[],
  outputTokens: TokenWithColor[],
  options: ResolvedOptions,
): Promise<Buffer> {
  const html = generateHtml(inputTokens, outputTokens, options)
  await page.setContent(html, { waitUntil: "domcontentloaded" })
  const screenshot = await page.screenshot({ type: "png" })
  return Buffer.from(screenshot)
}

/**
 * Create a Puppeteer browser and page configured for rendering.
 */
export async function createRenderer(options: ResolvedOptions): Promise<{ browser: Browser; page: Page }> {
  const puppeteer = await import("puppeteer")
  const browser = await puppeteer.default.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })
  const page = await browser.newPage()
  await page.setViewport({
    width: options.width,
    height: options.height,
    deviceScaleFactor: 1,
  })
  return { browser, page }
}

/**
 * Close the Puppeteer browser.
 */
export async function closeRenderer(browser: Browser): Promise<void> {
  await browser.close()
}
