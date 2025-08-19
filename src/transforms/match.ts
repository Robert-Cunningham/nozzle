import { generalRegex } from "../streamingRegex"
import { filter } from "./filter"
import { map } from "./map"

/**
 * Extracts matches of a regex pattern from the input stream.
 *
 * Uses earliestPossibleMatchIndex to efficiently skip tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they match.
 *
 * @group Regex
 * @param iterator - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @returns An asynchronous generator that yields RegExpExecArray results for each match.
 *
 * @example
 * ```ts
 * const stream = match(streamOf(["a", "b", "b", "a"]), /a([ab]*)a/g)
 * for await (const result of stream) {
 *   console.log(result[0], result[1]) // full match, first capture group
 * }
 * // => ["abba", "bb"]
 * ```
 */
export async function* match(input: AsyncIterable<string>, regex: RegExp): AsyncGenerator<RegExpExecArray> {
  yield* map(
    filter(generalRegex(input, regex), (result) => "regex" in result) as AsyncIterable<{ regex: RegExpExecArray }>,
    (x: { regex: RegExpExecArray }) => x.regex,
  )
}
