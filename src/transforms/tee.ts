import { Channel, ChannelClosedError } from "../primitives"

/**
 * Splits a single iterator into N independent iterables.
 *
 * @group Side Effects
 * @param iterator - The source async iterator to split.
 * @param n - Number of independent iterables to create.
 * @returns An array of N independent async generators.
 *
 * @example
 * ```ts
 * const [stream1, stream2] = nz(["a", "b", "c"]).tee(2) // => Two independent streams of "a", "b", "c"
 * ```
 */
export function tee<T, R = any>(iterator: AsyncIterator<T, R>, n: number): AsyncGenerator<T, R>[] {
  if (n < 0 || !Number.isInteger(n)) {
    throw new Error(`tee count must be a non-negative integer, got ${n}`)
  }

  let activeBranches = n
  const channels = Array.from(
    { length: n },
    () =>
      new Channel<T, R>({
        onCancel: async () => {
          activeBranches--
          if (activeBranches === 0) {
            await iterator.return?.()
          }
        },
      }),
  )

  let started = false
  const start = () => {
    if (started || n === 0) return
    started = true

    void (async () => {
      try {
        while (channels.some((channel) => channel.isOpen)) {
          const result = await iterator.next()

          if (result.done) {
            for (const channel of channels) channel.close(result.value as R)
            return
          }

          await Promise.all(
            channels.map(async (channel) => {
              if (!channel.isOpen) return

              try {
                await channel.push(result.value)
              } catch (error) {
                if (!(error instanceof ChannelClosedError)) throw error
              }
            }),
          )
        }
      } catch (error) {
        if (channels.every((channel) => channel.isCanceled)) return
        for (const channel of channels) channel.fail(error)
      }
    })()
  }

  return channels.map((channel) =>
    (async function* (): AsyncGenerator<T, R> {
      start()
      return yield* channel
    })(),
  )
}
