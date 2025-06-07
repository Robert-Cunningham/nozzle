/**
 * Transforms each value from the input stream using the provided async function.
 * Applies the async function to each item as soon as it comes off the iterator
 * and yields results as they complete, allowing multiple function calls to run concurrently.
 *
 * @group Elements
 * @param iterator - An asynchronous iterable of strings.
 * @param fn - An async function that transforms each string value.
 * @returns An asynchronous generator that yields transformed strings.
 *
 * @example
 * ```ts
 * const stream = asyncMap(streamOf(["hello", "world"]), async x => {
 *   await new Promise(resolve => setTimeout(resolve, 100))
 *   return x.toUpperCase()
 * })
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["HELLO", "WORLD"]
 * ```
 *
 * @example
 * ```ts
 * // Fetch data for each URL as they come in
 * const urls = streamOf(["api/users", "api/posts"])
 * const responses = asyncMap(urls, async url => {
 *   const response = await fetch(url)
 *   return await response.json()
 * })
 * for await (const data of responses) {
 *   console.log(data)
 * }
 * ```
 */
export const asyncMap = async function* <T, U>(
  iterator: AsyncIterable<T>, 
  fn: (value: T) => Promise<U>
) {
  const promises: Promise<U>[] = []
  let nextIndex = 0
  let inputDone = false
  
  async function processInput() {
    try {
      for await (const text of iterator) {
        promises.push(fn(text))
      }
    } finally {
      inputDone = true
    }
  }
  
  const inputPromise = processInput()
  
  while (!inputDone || nextIndex < promises.length) {
    if (nextIndex >= promises.length) {
      await new Promise(resolve => setTimeout(resolve, 1))
      continue
    }
    
    const result = await promises[nextIndex]
    nextIndex++
    yield result
  }
  
  await inputPromise
}