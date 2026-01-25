import { map } from "./map"
import { scan } from "./scan"

/**
 * Replaces matches of a regex pattern with a replacement string in the input stream.
 *
 * Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they should be replaced.
 *
 * Built on: `scan(input, regex).map(x => 'text' in x ? x.text : x.match[0].replace(regex, replacement))`
 *
 * @group Regex
 * @param iterator - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @param replacement - The string to replace matches with.
 * @returns An asynchronous generator that yields strings with replacements applied.
 *
 * @example
 * ```ts
 * nz(["a", "b", "b", "a"]).replace(/a[ab]*a/g, "X") // => "X"
 * ```
 */
export function replace(input: AsyncIterable<string>, regex: RegExp, replacement: string): AsyncGenerator<string> {
  return map(scan(input, regex), (result) => {
    if ("text" in result) {
      return result.text
    } else {
      const match = result.match
      return match.input!.slice(match.index, match.index! + match[0].length).replace(regex, replacement)
    }
  })
}
