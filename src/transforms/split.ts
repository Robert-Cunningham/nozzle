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
export async function* split(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  for await (const result of scan(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else {
      yield buffer
      buffer = ""
    }
  }

  yield buffer
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
export async function* splitBefore(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  for await (const result of scan(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else {
      yield buffer
      buffer = result.match[0]
    }
  }

  yield buffer
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
export async function* splitAfter(source: AsyncIterable<string>, separator: string | RegExp): AsyncGenerator<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""

  for await (const result of scan(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else {
      yield buffer + result.match[0]
      buffer = ""
    }
  }

  yield buffer
}
