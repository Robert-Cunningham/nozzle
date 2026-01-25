import { scan } from "./scan"

/**
 * Parses input for regex matches, yielding text as-is and transforming matches.
 *
 * This transform is useful for extracting structured data from text streams.
 * Non-matching text is passed through as strings, while matches are transformed
 * using the provided function.
 *
 * @group Regex
 * @param input - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @param transform - A function that transforms each match into a desired type.
 * @returns An asynchronous generator that yields strings (non-matching text) and transformed matches.
 *
 * @example
 * ```ts
 * // Extract UUIDs from text
 * nz(["Now I'm taking uuid-asdf-flkj and adding it to uuid-fslkj-alkjlsf."])
 *   .parse(/uuid-(?<id>\w+)-\w+/g, m => ({ id: m.groups!.id }))
 * // yields: "Now I'm taking ", { id: "asdf" }, " and adding it to ", { id: "fslkj" }, "."
 *
 * // Parse numbers from text
 * nz(["The answer is 42 and also 123"])
 *   .parse(/\d+/g, m => parseInt(m[0], 10))
 * // yields: "The answer is ", 42, " and also ", 123
 * ```
 */
export async function* parse<T>(
  input: AsyncIterable<string>,
  regex: RegExp,
  transform: (match: RegExpExecArray) => T,
): AsyncGenerator<string | T> {
  for await (const result of scan(input, regex)) {
    if ("text" in result) {
      yield result.text
    } else {
      yield transform(result.match)
    }
  }
}
