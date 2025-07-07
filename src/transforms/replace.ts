import { generalRegex } from "../streamingRegex"

/**
 * Replaces matches of a regex pattern with a replacement string in the input stream.
 *
 * Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they should be replaced.
 *
 * @group Regex
 * @param iterator - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @param replacement - The string to replace matches with.
 * @returns An asynchronous generator that yields strings with replacements applied.
 *
 * @example
 * ```ts
 * const stream = replace(streamOf(["a", "b", "b", "a"]), /a[ab]*a/g, "X")
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["X"]
 * ```
 */
export async function* replace(
  input: AsyncIterable<string>,
  regex: RegExp,
  replacement: string,
): AsyncGenerator<string> {
  for await (const next of generalRegex(input, regex)) {
    if ("text" in next) {
      yield next.text!
    } else {
      const match = next.regex
      yield match
        .input!.slice(match.index, match.index! + match[0].length)
        .replace(regex, replacement)
    }
  }
}

//   // Force a non-global clone for the searches we do at buffer-start.
//   const base = new RegExp(regex.source, regex.flags.replace(/g/g, ""))
//   const isGlobal = regex.global
//
//   let buffer = ""
//   let replaced = false // tracks “done” for non-global mode
//
//   /** Flush everything we’re *certain* can no longer change */
//   async function* flush(endOfInput = false): AsyncGenerator<string> {
//     while (buffer) {
//       // Non-global: once we’ve replaced once, nothing else changes
//       if (!isGlobal && replaced) {
//         yield buffer
//         buffer = ""
//         return
//       }
//
//       if (endOfInput) {
//         // match anything we have and return.
//         buffer = buffer.replace(base, replacement)
//         yield buffer
//         buffer = ""
//         continue
//       }
//
//       const { start, end } = earliestPossibleMatchIndex(buffer, base)
//       // console.log( "buffer", buffer, "base", base, "start", start, "end", end, "len", buffer.length,)
//
//       // yield anything which cannot be matched.
//       if (start > 0) {
//         yield buffer.slice(0, start)
//         buffer = buffer.slice(start)
//         continue
//       }
//
//       // if end === buffer.length, there's a possible match still being built, and we should do nothing.
//       // if we actually have a match starting at {start} and ending before the end of the buffer, yield it.
//
//       if (end < buffer.length) {
//         const source = buffer.slice(0, end)
//         yield source.replace(base, replacement)
//         buffer = buffer.slice(end)
//         replaced = true
//         continue
//       }
//
//       break
//     }
//   }
//
//   // ───────────────────────── Main loop ─────────────────────────
//   for await (const chunk of input) {
//     buffer += chunk
//     yield* flush() // not end-of-input yet
//   }
//   yield* flush(true) // final flush
// }
