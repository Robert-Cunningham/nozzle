import { earliestPossibleMatchIndex } from "../regex"

/**
 * Extracts matches of a regex pattern from the input stream.
 *
 * Uses earliestPossibleMatchIndex to efficiently skip tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they match.
 *
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
export async function* match(
  input: AsyncIterable<string>,
  regex: RegExp,
): AsyncGenerator<RegExpExecArray> {
  // Force a non-global clone for the searches we do at buffer-start.
  const base = new RegExp(regex.source, regex.flags.replace(/g/g, ""))
  const isGlobal = regex.global

  // let full = ""
  // let fullIndex = 0
  let buffer = ""
  let matched = false // tracks "done" for non-global mode

  /** Flush everything we're *certain* can no longer change */
  async function* flush(endOfInput = false): AsyncGenerator<RegExpExecArray> {
    while (buffer) {
      // Non-global: once we've matched once, nothing else changes
      if (!isGlobal && matched) {
        // fullIndex += buffer.length
        buffer = ""
        return
      }

      if (endOfInput) {
        // match anything we have and return.
        const match = base.exec(buffer)
        if (match) {
          yield match
        }
        // fullIndex += buffer.length
        buffer = ""
        continue
      }

      const { start, end } = earliestPossibleMatchIndex(buffer, base)
      // console.log( "buffer", buffer, "base", base, "start", start, "end", end, "len", buffer.length,)

      // discard anything which cannot be matched.
      if (start > 0) {
        // fullIndex += start
        buffer = buffer.slice(start)
        continue
      }

      // if end === buffer.length, there's a possible match still being built, and we should do nothing.
      // if we actually have a match starting at {start} and ending before the end of the buffer, yield it.

      if (end < buffer.length) {
        const source = buffer.slice(0, end)
        const match = base.exec(source)

        // base.lastIndex = fullIndex
        // const match = base.exec(full)
        // console.log("match", match)
        // base.lastIndex = 0

        if (match) {
          yield match
          matched = true
        }
        // fullIndex += end
        buffer = buffer.slice(end)
        continue
      }

      break
    }
  }

  // ───────────────────────── Main loop ─────────────────────────
  for await (const chunk of input) {
    buffer += chunk
    // full += chunk
    yield* flush() // not end-of-input yet
  }
  yield* flush(true) // final flush
}
