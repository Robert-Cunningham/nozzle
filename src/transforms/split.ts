import { toGlobalRegex } from "../regex"
import { scan } from "./scan"

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator.
 *
 * Built on: `scan(source, regex)` accumulating text between matches
 *
 * @group Splitting
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts.
 *
 * @example
 * ```ts
 * nz(["hello,world,test"]).split(",") // => "hello", "world", "test"
 * ```
 */
export async function* split<R = any>(
  source: AsyncIterable<string, R>,
  separator: string | RegExp,
): AsyncGenerator<string, R, undefined> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  const iter = scan(source, regex)[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        yield buffer
        return next.value as R
      }

      const result = next.value

      if ("text" in result) {
        buffer += result.text
      } else {
        yield buffer
        buffer = ""
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.(undefined as R)
    }
  }
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the beginning of each part (except the first).
 *
 * Built on: `scan(source, regex)` with separator prepended to each segment after first
 *
 * @group Splitting
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the beginning.
 *
 * @example
 * ```ts
 * nz(["hello,world,test"]).splitBefore(",") // => "hello", ",world", ",test"
 * ```
 */
export async function* splitBefore<R = any>(
  source: AsyncIterable<string, R>,
  separator: string | RegExp,
): AsyncGenerator<string, R, undefined> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  const iter = scan(source, regex)[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        yield buffer
        return next.value as R
      }

      const result = next.value

      if ("text" in result) {
        buffer += result.text
      } else {
        yield buffer
        buffer = result.match[0]
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.(undefined as R)
    }
  }
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the end of each part (except the last).
 *
 * Built on: `scan(source, regex)` with separator appended to each segment
 *
 * @group Splitting
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the end.
 *
 * @example
 * ```ts
 * nz(["hello,world,test"]).splitAfter(",") // => "hello,", "world,", "test"
 * ```
 */
export async function* splitAfter<R = any>(
  source: AsyncIterable<string, R>,
  separator: string | RegExp,
): AsyncGenerator<string, R, undefined> {
  const regex = toGlobalRegex(separator)
  let buffer = ""

  const iter = scan(source, regex)[Symbol.asyncIterator]()
  let completed = false

  try {
    while (true) {
      const next = await iter.next()

      if (next.done) {
        completed = true
        yield buffer
        return next.value as R
      }

      const result = next.value

      if ("text" in result) {
        buffer += result.text
      } else {
        yield buffer + result.match[0]
        buffer = ""
      }
    }
  } finally {
    if (!completed) {
      await iter.return?.(undefined as R)
    }
  }
}
