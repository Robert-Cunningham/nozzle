/**
 * Converts an async iterable into a Web `ReadableStream`.
 *
 * The stream pulls from the source only when its reader asks for a value, so
 * nothing is read ahead and timing transforms keep their pacing. Cancelling the
 * stream closes the source iterator. The source's return value is discarded,
 * because Web Streams have no return value.
 *
 * Added in 0.12.0, along with `ReadableStream` sources for `nz()`.
 *
 * @group Conversion
 * @param source - The async iterable to read from.
 * @returns A `ReadableStream` that yields each value from the source.
 *
 * @example
 * ```ts
 * return new Response(nz(llmTextStream).minInterval(40).toReadableStream().pipeThrough(new TextEncoderStream()))
 * ```
 */
export function toReadableStream<T>(source: AsyncIterable<T>): ReadableStream<T> {
  let iterator: AsyncIterator<T> | undefined
  return new ReadableStream<T>(
    {
      async pull(controller) {
        iterator ??= source[Symbol.asyncIterator]()
        const result = await iterator.next()
        if (result.done) controller.close()
        else controller.enqueue(result.value)
      },
      async cancel() {
        await iterator?.return?.()
      },
    },
    { highWaterMark: 0 },
  )
}
