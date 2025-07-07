import { Iterable } from "../types"

export async function* aperture<T>(
  source: Iterable<T>,
  n: number,
): AsyncIterable<T[]> {
  if (n <= 0) {
    return
  }

  const buffer: T[] = []

  for await (const item of source) {
    buffer.push(item)

    if (buffer.length === n) {
      yield [...buffer]
      buffer.shift()
    }
  }
}
