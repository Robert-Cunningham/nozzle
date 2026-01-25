import { assertSupportedRegex, earliestPossibleMatchIndex } from "../regex"

/**
 * Result type from the scan transform.
 * Either a text segment (non-matching content) or a match (regex match).
 */
export type ScanResult = { text: string } | { match: RegExpExecArray }

/** Helper to yield text only if non-empty */
function* yieldText(text: string): Generator<ScanResult> {
  if (text.length > 0) {
    yield { text }
  }
}

const emptyScan = async function* (input: AsyncIterable<string>): AsyncGenerator<ScanResult> {
  let first = true
  for await (const chunk of input) {
    for (const c of chunk.split("")) {
      if (!first) yield { match: new RegExp("").exec("")! }
      if (first) first = false
      yield { text: c }
    }
  }
  return
}

/**
 * Scans input for regex matches, yielding interleaved text and match results.
 *
 * This is the foundational regex transform that other transforms build on.
 * It efficiently yields non-matching text as soon as we're certain it can't match,
 * while holding back potential matches until we can determine their boundaries.
 *
 * Note: Empty text strings are never yielded.
 *
 * @group Regex
 * @param input - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @returns An asynchronous generator that yields ScanResult objects.
 *
 * @example
 * ```ts
 * nz(["hello world"]).scan(/\w+/g)
 * // yields: { match: [...] }, { text: " " }, { match: [...] }
 *
 * nz(["Now I'm taking uuid-asdf-flkj..."]).scan(/uuid-(\w+)-\w+/g)
 * // yields: { text: "Now I'm taking " }, { match: [...] }, { text: "..." }
 * ```
 */
export async function* scan(input: AsyncIterable<string>, regex: RegExp): AsyncGenerator<ScanResult> {
  assertSupportedRegex(regex)

  if (regex.exec("")) {
    return yield* emptyScan(input)
  }

  // Force a non-global clone for the searches we do at buffer-start.
  const base = new RegExp(regex.source, regex.flags.replace(/g/g, ""))
  const isGlobal = regex.global

  const findAtMostOneMatch = !isGlobal

  let buffer = ""
  let alreadyFound = false // tracks "done" for non-global mode

  /** Flush everything we're *certain* can no longer change */
  function* flush(endOfInput = false): Generator<ScanResult> {
    while (buffer) {
      // Non-global: once we've matched once, nothing else changes
      if (findAtMostOneMatch && alreadyFound) {
        yield* yieldText(buffer)
        buffer = ""
        return
      }

      if (endOfInput) {
        if (findAtMostOneMatch && alreadyFound) {
          yield* yieldText(buffer)
          buffer = ""
          continue
        }

        // match anything we have and return.
        const match = base.exec(buffer)
        if (match) {
          yield* yieldText(buffer.slice(0, match.index))
          buffer = buffer.slice(match.index)
          yield { match: base.exec(buffer)! }
          alreadyFound = true
          buffer = buffer.slice(match[0].length)
          continue
        } else {
          yield* yieldText(buffer)
          buffer = ""
          continue
        }
      }

      const { start, end } = earliestPossibleMatchIndex(buffer, base)

      // yield anything which cannot be matched.
      if (start > 0) {
        yield* yieldText(buffer.slice(0, start))
        buffer = buffer.slice(start)
        continue
      }

      // if end === buffer.length, there's a possible match still being built, and we should do nothing.
      // if we actually have a match starting at {start} and ending before the end of the buffer, yield it.

      if (end < buffer.length) {
        const source = buffer.slice(0, end)
        yield { match: base.exec(source)! }
        buffer = buffer.slice(end)
        alreadyFound = true
        continue
      }

      break
    }
  }

  // ───────────────────────── Main loop ─────────────────────────
  for await (const chunk of input) {
    buffer += chunk
    yield* flush()
  }
  yield* flush(true)
}
