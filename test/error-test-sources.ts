/**
 * Shared error source iterators for testing error handling across all functions.
 * These sources throw errors at different points in the iteration lifecycle
 * to ensure comprehensive error handling coverage.
 */

export const errorSources = {
  /**
   * Throws immediately on first next() call
   */
  immediateError: async function* (): AsyncGenerator<string> {
    throw new Error("immediate error")
  },

  /**
   * Yields one item then throws on second next() call
   */
  errorAfterOne: async function* (): AsyncGenerator<string> {
    yield "item1"
    throw new Error("error after one")
  },

  /**
   * Yields multiple items then throws
   */
  errorAfterMultiple: async function* (): AsyncGenerator<string> {
    yield "item1"
    yield "item2"
    yield "item3"
    throw new Error("error after multiple")
  },

  /**
   * Throws after a delay (simulates async error during processing)
   */
  errorAfterDelay: async function* (): AsyncGenerator<string> {
    yield "item1"
    await new Promise((r) => setTimeout(r, 10))
    throw new Error("error after delay")
  },

  /**
   * Yields items with delays then throws (tests error during streaming)
   */
  errorDuringStreaming: async function* (): AsyncGenerator<string> {
    yield "item1"
    await new Promise((r) => setTimeout(r, 5))
    yield "item2"
    await new Promise((r) => setTimeout(r, 5))
    throw new Error("error during streaming")
  },

  /**
   * Throws after yielding items and waiting (tests timing-sensitive errors)
   */
  errorAfterWait: async function* (): AsyncGenerator<string> {
    yield "item1"
    yield "item2"
    await new Promise((r) => setTimeout(r, 15))
    throw new Error("error after wait")
  },

  /**
   * Error that occurs during background processing simulation
   */
  errorInBackground: async function* (): AsyncGenerator<string> {
    yield "item1"
    // Simulate some background work
    await new Promise((resolve) => {
      setTimeout(() => {
        resolve(undefined)
      }, 8)
    })
    yield "item2"
    throw new Error("error in background")
  },

  /**
   * Error with custom error type for testing error propagation
   */
  customError: async function* (): AsyncGenerator<string> {
    yield "item1"
    const customErr = new TypeError("custom type error")
    customErr.cause = "test cause"
    throw customErr
  },
}

export type ErrorSourceName = keyof typeof errorSources
