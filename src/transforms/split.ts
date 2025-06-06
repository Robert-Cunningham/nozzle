import { escapeRegex } from "../regex"
import { generalRegex } from "../streamingRegex"

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator.
 *
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts.
 */
export async function* split(
  source: AsyncIterable<string>,
  separator: string | RegExp,
): AsyncIterable<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  for await (const result of generalRegex(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else if ("regex" in result) {
      yield buffer
      buffer = ""
    }
  }

  yield buffer
}

const toGlobalRegex = (separator: RegExp | string) => {
  return typeof separator === "string"
    ? new RegExp(escapeRegex(separator), "g")
    : new RegExp(
        separator.source,
        separator.flags.includes("g") ? separator.flags : separator.flags + "g",
      )
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the beginning of each part (except the first).
 *
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the beginning.
 */
export async function* splitBefore(
  source: AsyncIterable<string>,
  separator: string | RegExp,
): AsyncIterable<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""
  for await (const result of generalRegex(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else if ("regex" in result) {
      yield buffer
      buffer = result.regex[0]
    }
  }

  yield buffer
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the end of each part (except the last).
 *
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the end.
 */
export async function* splitAfter(
  source: AsyncIterable<string>,
  separator: string | RegExp,
): AsyncIterable<string> {
  const regex = toGlobalRegex(separator)
  let buffer = ""

  for await (const result of generalRegex(source, regex)) {
    if ("text" in result) {
      buffer += result.text
    } else if ("regex" in result) {
      yield buffer + result.regex[0]
      buffer = ""
    }
  }

  yield buffer
}
