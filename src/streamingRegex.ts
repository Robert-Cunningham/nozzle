import { earliestPossibleMatchIndex } from "./regex"
import { filter } from "./transforms/filter"

const emptyGeneralRegex = async function* (input: AsyncIterable<string>) {
  let first = true
  for await (const chunk of input) {
    for (const c of chunk.split("")) {
      if (!first) yield { regex: new RegExp("").exec("")! }
      if (first) first = false
      yield { text: c }
    }
  }
  return
}

export async function* generalRegex(
  input: AsyncIterable<string>,
  regex: RegExp,
): AsyncIterable<{ text: string } | { regex: RegExpExecArray }> {
  if (regex.exec("")) {
    yield* emptyGeneralRegex(input)
    return
  }

  // Force a non-global clone for the searches we do at buffer-start.
  const base = new RegExp(regex.source, regex.flags.replace(/g/g, ""))
  const isGlobal = regex.global

  const findAtMostOneMatch = !isGlobal

  let buffer = ""
  let alreadyFound = false // tracks “done” for non-global mode

  /** Flush everything we’re *certain* can no longer change */
  async function* flush(
    endOfInput = false,
  ): AsyncGenerator<{ text: string } | { regex: RegExpExecArray }> {
    while (buffer) {
      // Non-global: once we’ve replaced once, nothing else changes
      if (findAtMostOneMatch && alreadyFound) {
        yield { text: buffer }
        buffer = ""
        return
      }

      if (endOfInput) {
        if (findAtMostOneMatch && alreadyFound) {
          yield { text: buffer }
          buffer = ""
          continue
        }

        // match anything we have and return.
        const match = base.exec(buffer)
        if (match) {
          yield { text: buffer.slice(0, match.index) }
          buffer = buffer.slice(match.index)
          yield { regex: base.exec(buffer)! }
          alreadyFound = true
          buffer = buffer.slice(match[0].length)
          // yield { regex: match }
          continue
        } else {
          yield { text: buffer }
          buffer = ""
          continue
        }
      }

      const { start, end } = earliestPossibleMatchIndex(buffer, base)
      // console.log( "buffer", buffer, "base", base, "start", start, "end", end, "len", buffer.length,)

      // yield anything which cannot be matched.
      if (start > 0) {
        yield { text: buffer.slice(0, start) }
        buffer = buffer.slice(start)
        continue
      }

      // if end === buffer.length, there's a possible match still being built, and we should do nothing.
      // if we actually have a match starting at {start} and ending before the end of the buffer, yield it.

      // robert: is this broken? can end ever be anything other than equal to buffer.length?
      if (end < buffer.length) {
        const source = buffer.slice(0, end)
        yield { regex: base.exec(source)! }
        // yield source.replace(base, replacement)
        buffer = buffer.slice(end)
        alreadyFound = true
        continue
      }

      break
    }
  }

  const filterFn = (result: { text: string } | { regex: RegExpExecArray }) =>
    !("text" in result && result.text.length === 0)

  // ───────────────────────── Main loop ─────────────────────────
  for await (const chunk of input) {
    buffer += chunk
    yield* filter(flush(), filterFn)
  }
  yield* filter(flush(true), filterFn)
}
