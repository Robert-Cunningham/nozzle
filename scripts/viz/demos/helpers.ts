import type { TimestampedText } from "../generateWebm.js"
import { collectWithTimings, timedSource } from "../timing-helpers.js"

export type TimedValue<T> = {
  value: T
  time: number
}

export function formatValue(value: unknown): string {
  return typeof value === "string" ? value : JSON.stringify(value)
}

export function timelineFromTokens<T>(
  tokens: TimedValue<T>[],
  format: (value: T) => string = formatValue,
): TimestampedText[] {
  return tokens.map(({ value, time }) => ({
    text: format(value),
    ts: time,
  }))
}

export async function timelineFromStream<T>(
  source: AsyncIterable<T>,
  format: (value: T) => string = formatValue,
): Promise<TimestampedText[]> {
  const values = await collectWithTimings(source)

  return values.map(({ item, timestamp }) => ({
    text: format(item),
    ts: Math.round(timestamp / 10) * 10,
  }))
}

export { timedSource }
