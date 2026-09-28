/** The parts of a Web `ReadableStream` Nozzle needs, so types work with or without the DOM lib. */
export interface ReadableStreamLike<T> {
  getReader(): {
    read(): PromiseLike<{ done: boolean; value?: T }>
    cancel(reason?: unknown): PromiseLike<void>
    releaseLock(): void
  }
}

export function isReadableStreamLike(source: unknown): source is ReadableStreamLike<unknown> {
  return typeof (source as ReadableStreamLike<unknown> | null)?.getReader === "function"
}

// Used when a runtime's ReadableStream is not async iterable (e.g. Safari).
// Matches native iteration: early exit cancels the stream.
export async function* fromReadableStream<T>(stream: ReadableStreamLike<T>): AsyncGenerator<T, undefined> {
  const reader = stream.getReader()
  let settled = false
  try {
    while (true) {
      let result
      try {
        result = await reader.read()
      } catch (error) {
        settled = true
        throw error
      }
      if (result.done) {
        settled = true
        return undefined
      }
      yield result.value as T
    }
  } finally {
    if (!settled) await reader.cancel()
    reader.releaseLock()
  }
}
