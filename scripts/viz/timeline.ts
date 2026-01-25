import type { TimestampedText, TokenWithColor, Timeline } from "./types.js"
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
 * Build a timeline from input and output token arrays.
 * Computes total duration and assigns colors to each token.
 */
export function buildTimeline(input: TimestampedText[], output: TimestampedText[], holdDuration: number): Timeline {
  const inputTokens = assignColors(input)
  const outputTokens = assignColors(output)

  // Find the maximum timestamp across both rows
  const maxInputTs = input.length > 0 ? Math.max(...input.map((t) => t.ts)) : 0
  const maxOutputTs = output.length > 0 ? Math.max(...output.map((t) => t.ts)) : 0
  const totalDurationMs = Math.max(maxInputTs, maxOutputTs) + holdDuration

  return {
    inputTokens,
    outputTokens,
    totalDurationMs,
  }
}

/**
 * Get tokens that should be visible at the given time.
 * A token is visible if currentTimeMs >= token.ts
 */
export function getVisibleTokens(tokens: TokenWithColor[], currentTimeMs: number): TokenWithColor[] {
  return tokens.filter((token) => currentTimeMs >= token.ts)
}
