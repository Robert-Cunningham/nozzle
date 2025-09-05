/**
 * A consumed pipeline that contains both yielded values and the return value.
 * This is the result of calling consume() on a pipeline.
 *
 * @template T The type of yielded values
 * @template R The type of the return value
 */
export class ConsumedPipeline<T, R = any> {
  constructor(
    private readonly values: T[],
    private readonly returnValue: R | undefined,
  ) {}

  /**
   * Returns all yielded values as an array.
   *
   * @returns An array containing all yielded values from the consumed pipeline
   *
   * @example
   * ```ts
   * const consumed = await pipeline.consume()
   * const list = consumed.list() // => ["a", "b", "c"]
   * ```
   */
  list(): T[] {
    return this.values
  }

  /**
   * Returns the return value of the consumed iterator.
   *
   * @returns The return value, or undefined if no return value was provided
   *
   * @example
   * ```ts
   * const consumed = await pipeline.consume()
   * const returnValue = consumed.return() // => "final value"
   * ```
   */
  return(): R | undefined {
    return this.returnValue
  }

  /**
   * Concatenates all string values into a single string.
   * Only available when T extends string.
   *
   * @returns A single string containing all yielded values concatenated
   *
   * @example
   * ```ts
   * const consumed = await stringPipeline.consume()
   * const result = consumed.string() // => "Hello World"
   * ```
   */
  string(this: ConsumedPipeline<string, R>): string {
    return this.values.join("")
  }
}
