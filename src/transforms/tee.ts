/**
 * Splits a single iterator into N independent iterables.
 *
 * Error handling follows the pattern described in {@link file://./../../ASYNC_ERROR_HANDLING.md}
 * to ensure errors are thrown during await ticks for proper try/catch handling.
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
export function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncGenerator<T>[] {
  const queues: T[][] = Array.from({ length: n }, () => [])
  const resolvers: Array<
    {
      resolve: (value: IteratorResult<T>) => void
      reject: (error: any) => void
    }[]
  > = Array.from({ length: n }, () => [])
  let finished = false
  let error: any = null

  const advance = async () => {
    if (finished) return

    try {
      const result = await iterator.next()

      if (result.done) {
        finished = true
        for (let i = 0; i < n; i++) {
          const queueResolvers = resolvers[i]
          while (queueResolvers.length > 0) {
            const { resolve } = queueResolvers.shift()!
            resolve({ done: true, value: undefined })
          }
        }
      } else {
        for (let i = 0; i < n; i++) {
          queues[i].push(result.value)
          if (resolvers[i].length > 0) {
            const { resolve } = resolvers[i].shift()!
            resolve({ done: false, value: queues[i].shift()! })
          }
        }
      }
    } catch (err) {
      error = err
      finished = true
      for (let i = 0; i < n; i++) {
        const queueResolvers = resolvers[i]
        while (queueResolvers.length > 0) {
          const { reject } = queueResolvers.shift()!
          reject(err)
        }
      }
    }
  }

  const createGenerator = async function* (index: number): AsyncGenerator<T> {
    while (true) {
      if (error) {
        throw error
      }

      if (queues[index].length > 0) {
        yield queues[index].shift()!
        continue
      }

      if (finished) {
        return
      }

      await new Promise<void>((resolve, reject) => {
        resolvers[index].push({
          resolve: (result) => {
            if (result.done) {
              resolve()
            } else {
              queues[index].push(result.value)
              resolve()
            }
          },
          reject,
        })
        advance()
      })
    }
  }

  return Array.from({ length: n }, (_, i) => createGenerator(i))
}
