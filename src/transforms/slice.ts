/**
 * Yields a slice of the input stream between start and end indices.
 * Supports negative indices by maintaining an internal buffer.
 *
 * @group Indexing
 * @param iterator - The async iterable to slice
 * @param start - Starting index (inclusive). Negative values count from end.
 * @param end - Ending index (exclusive). Negative values count from end. If undefined, slices to end.
 * @returns An AsyncGenerator<string> that yields the sliced elements
 *
 * @example
 * ```ts
 * const stream = slice(streamOf(["a", "b", "c", "d", "e"]), 1, 3)
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["b", "c"]
 * ```
 *
 * @example
 * ```ts
 * const stream = slice(streamOf(["a", "b", "c", "d", "e"]), -2)
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["d", "e"]
 * ```
 */
export async function* slice(iterator: AsyncIterable<string>, start: number, end?: number) {
  let index = 0
  
  // Case 1: Both positive indices - stream without buffering
  if (start >= 0 && (end === undefined || end >= 0)) {
    const normalizedEnd = end === undefined ? Infinity : end
    
    for await (const text of iterator) {
      if (index >= start && index < normalizedEnd) {
        yield text
      }
      index++
      if (index >= normalizedEnd) {
        break
      }
    }
    return
  }
  
  // Case 2: Start positive, end negative - use sliding window buffer
  if (start >= 0 && end !== undefined && end < 0) {
    const bufferSize = Math.abs(end)
    
    // Special case: if end is -0 (which equals 0), slice should be empty
    if (bufferSize === 0) {
      return
    }
    
    const buffer: string[] = []
    
    for await (const text of iterator) {
      if (index >= start) {
        buffer.push(text)
        if (buffer.length > bufferSize) {
          yield buffer.shift()!
        }
      }
      index++
    }
    return
  }
  
  // Case 3: Start negative - need to buffer everything to know total length
  const items: string[] = []
  for await (const text of iterator) {
    items.push(text)
  }
  
  const length = items.length
  const normalizedStart = start < 0 ? Math.max(0, length + start) : Math.min(start, length)
  const normalizedEnd = end === undefined ? length : 
                        end < 0 ? Math.max(0, length + end) : Math.min(end, length)
  
  for (let i = normalizedStart; i < normalizedEnd; i++) {
    yield items[i]
  }
}