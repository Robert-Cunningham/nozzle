import { scan } from "./scan"

/**
 * Extracts matches of a regex pattern from the input stream.
 *
 * Uses earliestPossibleMatchIndex to efficiently skip tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they match.
 *
 * Built on: `scan(input, regex).filter(x => 'match' in x).map(x => x.match)`
 *
 * @group Regex
 * @param iterator - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @returns An asynchronous generator that yields RegExpExecArray results for each match.
 *
 * @example
 * ```ts
 * nz(["a", "b", "b", "a"]).match(/a([ab]*)a/g) // => ["abba", "bb"] (match arrays with capture groups)
 * ```
 */
export async function* match(input: AsyncIterable<string>, regex: RegExp): AsyncGenerator<RegExpExecArray> {
  for await (const result of scan(input, regex)) {
    if ("match" in result) {
      yield result.match
    }
  }
}
