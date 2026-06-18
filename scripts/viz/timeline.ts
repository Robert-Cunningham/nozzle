import type { TimelineRow, TimestampedText, TokenRow, TokenWithColor, Timeline } from "./types.js"
import { getTokenColor } from "./colorPalette.js"

/**
 * Assign colors to tokens based on their index in the row.
 */
function assignColors(tokens: TimestampedText[]): TokenWithColor[] {
  return tokens.map((token, index) => ({
    ...token,
    color: getTokenColor(index),
    index,
  }))
}

/**
 * Build a timeline from any number of labeled rows.
 */
export function buildRowsTimeline(rows: TimelineRow[], holdDuration: number): Timeline {
  const renderedRows: TokenRow[] = rows.map((row) => ({
    label: row.label,
    tokens: assignColors(row.tokens),
  }))

  const timestamps = rows.flatMap((row) => row.tokens.map((token) => token.ts))
  const totalDurationMs = (timestamps.length > 0 ? Math.max(...timestamps) : 0) + holdDuration

  return {
    rows: renderedRows,
    inputTokens: renderedRows[0]?.tokens ?? [],
    outputTokens: renderedRows[1]?.tokens ?? [],
    totalDurationMs,
  }
}

/**
 * Build a timeline from input and output token arrays.
 * Computes total duration and assigns colors to each token.
 */
export function buildTimeline(input: TimestampedText[], output: TimestampedText[], holdDuration: number): Timeline {
  return buildRowsTimeline(
    [
      { label: "INPUT", tokens: input },
      { label: "OUTPUT", tokens: output },
    ],
    holdDuration,
  )
}

/**
 * Get tokens that should be visible at the given time.
 * A token is visible if currentTimeMs >= token.ts
 */
export function getVisibleTokens(tokens: TokenWithColor[], currentTimeMs: number): TokenWithColor[] {
  return tokens.filter((token) => currentTimeMs >= token.ts)
}
