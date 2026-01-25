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
 * @groupDescription Regex
 * These functions use JavaScript regular expressions to search, match, and transform streaming text.
 *
 * Nozzle handles matching patterns across chunk boundaries by buffering text internally.
 * Non-matching text is yielded as soon as it's certain not to be part of a match, while
 * potential matches are held back until confirmed.
 *
 * ### Unsupported Features
 *
 * These features throw an error because they cannot work reliably with streaming:
 *
 * | Feature | Example | Why |
 * | ------- | ------- | --- |
 * | Lookaheads | `(?=...)`, `(?!...)` | Content to look ahead may not have arrived yet |
 * | Lookbehinds | `(?<=...)`, `(?<!...)` | Content to look behind may have already been yielded |
 * | Backreferences | `\1`, `\k<name>` | Referenced group may span chunks or be partially buffered |
 * | Multiline mode | `/pattern/m` | `^`/`$` would behave inconsistently at arbitrary chunk boundaries |
 *
 * ### Patterns That Delay Output
 *
 * Some patterns force nozzle to buffer text longer than you might expect:
 *
 * - **Open-ended quantifiers at pattern end**: `/hello.+/g` buffers everything after "hello"
 *   until the stream ends—`.+` can always match more. Use a delimiter instead: `/hello[^!]+/g`
 *   matches until `!`, allowing earlier output.
 *
 * - **Alternations with shared prefixes**: `/cat|caterpillar/g` buffers "cat" until enough
 *   text arrives to rule out "caterpillar". Put longer alternatives first: `/caterpillar|cat/g`.
 *
 * - **Optional suffixes**: `/items?/g` buffers "item" to check for a trailing "s". This is
 *   usually fine, but `/data.*?end/g` buffers from "data" until "end" appears.
 *
 * ### Global vs Non-Global
 *
 * - **Global (`/pattern/g`)**: Finds all matches throughout the stream
 * - **Non-global (`/pattern/`)**: Finds only the first match, then passes remaining text through unchanged
 *
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
