import { describe, it, expect } from "vitest"
import { window } from "../src/transforms/window"
import { fromList } from "../src/transforms/fromList"

// Helper to create a generator with a return value
async function* fromListWithReturn<T, R>(list: T[], returnValue: R): AsyncGenerator<T, R> {
  for (const item of list) {
    yield item
  }
  return returnValue
}

describe("window", () => {
  it("should pass through values with advance: 1 (default)", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const windowed = window(source, ({ current }) => ({ value: current }))

    const result: number[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    expect(result).toEqual([1, 2, 3, 4, 5])
  })

  it("should track index correctly", async () => {
    const source = fromList(["a", "b", "c"])
    const windowed = window(source, ({ current, index }) => ({
      value: { item: current, idx: index },
    }))

    const result: { item: string; idx: number }[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    expect(result).toEqual([
      { item: "a", idx: 0 },
      { item: "b", idx: 1 },
      { item: "c", idx: 2 },
    ])
  })

  it("should build up past array over time", async () => {
    const source = fromList([1, 2, 3, 4])
    const pastSnapshots: number[][] = []
    const windowed = window(source, ({ current, past }) => {
      pastSnapshots.push([...past])
      return { value: current }
    })

    for await (const _ of windowed) {
      // consume
    }

    expect(pastSnapshots).toEqual([[], [1], [1, 2], [1, 2, 3]])
  })

  it("should limit past array with maxPast option", async () => {
    const source = fromList([1, 2, 3, 4, 5])
    const pastSnapshots: number[][] = []
    const windowed = window(
      source,
      ({ current, past }) => {
        pastSnapshots.push([...past])
        return { value: current }
      },
      { maxPast: 2 },
    )

    for await (const _ of windowed) {
      // consume
    }

    expect(pastSnapshots).toEqual([[], [1], [1, 2], [2, 3], [3, 4]])
  })

  it("should support advance: 0 to peek ahead", async () => {
    const source = fromList([1, 2, 3])
    const upcomingSnapshots: number[][] = []
    const windowed = window(source, ({ current, upcoming, done }) => {
      upcomingSnapshots.push([...upcoming])
      if (!done && upcoming.length < 1) {
        return { value: current, advance: 0 }
      }
      return { value: current }
    })

    const result: number[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    // Each item should have peeked ahead once before advancing
    expect(upcomingSnapshots).toEqual([
      [], // first call for item 1, no peek yet
      [2], // second call for item 1, peeked at 2, now advance
      [], // first call for item 2, no peek yet
      [3], // second call for item 2, peeked at 3, now advance
      [], // first call for item 3, no peek yet (done will become true)
      [], // second call for item 3, done=true so upcoming doesn't grow
    ])
  })

  it("should support advance: 2 to skip elements", async () => {
    const source = fromList([1, 2, 3, 4, 5, 6])
    // First peek ahead to have items in upcoming, then skip
    const windowed = window(source, ({ current, upcoming, done }) => {
      // Peek until we have at least 1 item in upcoming
      if (!done && upcoming.length < 1) {
        return { value: current, advance: 0 }
      }
      // Now we can advance by 2 (current + 1 from upcoming)
      return { value: current, advance: 2 }
    })

    const result: number[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    // Peeks: 1 (peek to get 2), 1 (advance 2, skip 2), 3 (peek to get 4), 3 (advance 2, skip 4), 5 (peek to get 6), 5 (advance 2, skip 6)
    expect(result).toEqual([1, 1, 3, 3, 5, 5])
  })

  it("should set done to true when stream is exhausted", async () => {
    const source = fromList([1, 2])
    const doneValues: boolean[] = []
    // We need to peek ahead to discover done=true
    const windowed = window(source, ({ current, done, upcoming }) => {
      doneValues.push(done)
      // Peek ahead if we haven't yet and stream isn't done
      if (!done && upcoming.length === 0) {
        return { value: current, advance: 0 }
      }
      return { value: current }
    })

    for await (const _ of windowed) {
      // consume
    }

    // For item 1: first call done=false (peek), second call done=false (advance)
    // For item 2: first call done=false (peek), stream exhausts so next call done=true, then advance
    expect(doneValues).toEqual([false, false, false, true])
  })

  it("should handle empty stream", async () => {
    const source = fromListWithReturn<number, string>([], "return-value")
    const windowed = window(source, ({ current }) => ({ value: current }))

    const result: number[] = []
    let returnValue: string | undefined
    const iter = windowed[Symbol.asyncIterator]()
    while (true) {
      const next = await iter.next()
      if (next.done) {
        returnValue = next.value
        break
      }
      result.push(next.value)
    }

    expect(result).toEqual([])
    expect(returnValue).toBe("return-value")
  })

  it("should handle single element stream", async () => {
    const source = fromList([42])
    // Without peeking, done will be false on first (and only) call
    // because we haven't tried to fetch more yet
    const windowed = window(source, ({ current, past, upcoming, done }) => ({
      value: { current, pastLen: past.length, upcomingLen: upcoming.length, done },
    }))

    const result: { current: number; pastLen: number; upcomingLen: number; done: boolean }[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    // done is false because we haven't peeked ahead yet
    expect(result).toEqual([{ current: 42, pastLen: 0, upcomingLen: 0, done: false }])
  })

  it("should set done to true for single element stream when peeking", async () => {
    const source = fromList([42])
    const windowed = window(source, ({ current, past, upcoming, done }) => {
      // Peek ahead if we haven't yet
      if (!done && upcoming.length === 0) {
        return {
          value: { current, pastLen: past.length, upcomingLen: upcoming.length, done },
          advance: 0,
        }
      }
      return {
        value: { current, pastLen: past.length, upcomingLen: upcoming.length, done },
      }
    })

    const result: { current: number; pastLen: number; upcomingLen: number; done: boolean }[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    // First call: done=false (peek), second call: done=true (stream exhausted after peek)
    expect(result).toEqual([
      { current: 42, pastLen: 0, upcomingLen: 0, done: false },
      { current: 42, pastLen: 0, upcomingLen: 0, done: true },
    ])
  })

  it("should pass through return value", async () => {
    const source = fromListWithReturn([1, 2, 3], "final-return")
    const windowed = window(source, ({ current }) => ({ value: current * 2 }))

    const iter = windowed[Symbol.asyncIterator]()
    const results: number[] = []
    let returnValue: string | undefined

    while (true) {
      const next = await iter.next()
      if (next.done) {
        returnValue = next.value
        break
      }
      results.push(next.value)
    }

    expect(results).toEqual([2, 4, 6])
    expect(returnValue).toBe("final-return")
  })

  it("should throw when advance exceeds upcoming.length + 1", async () => {
    const source = fromList([1, 2, 3])
    const windowed = window(source, ({ current }) => ({
      value: current,
      advance: 5, // way more than available
    }))

    await expect(async () => {
      for await (const _ of windowed) {
        // consume
      }
    }).rejects.toThrow("advance (5) cannot exceed upcoming.length + 1 (1)")
  })

  it("should allow advance equal to upcoming.length + 1", async () => {
    const source = fromList([1, 2, 3, 4, 5, 6])
    // Peek ahead 2 items, then advance by 3 (consume current + 2 from upcoming)
    const windowed = window(source, ({ current, upcoming, done }) => {
      if (!done && upcoming.length < 2) {
        return { value: current, advance: 0 }
      }
      // advance by upcoming.length + 1 (i.e., 3 when we have 2 in upcoming)
      return { value: current, advance: upcoming.length + 1 }
    })

    const result: number[] = []
    for await (const value of windowed) {
      result.push(value)
    }

    // For 1: peek twice to get [2,3], then advance 3 (skip 2,3), yields [1,1,1]
    // For 4: peek twice to get [5,6], then advance 3 (skip 5,6), but wait - 6 is last
    // Actually: 4 peeks to get 5, 4 peeks to get 6, 4 advances by 3 (skips 5,6), done
    expect(result).toEqual([1, 1, 1, 4, 4, 4])
  })

  it("should provide independent copies of past and upcoming arrays", async () => {
    const source = fromList([1, 2, 3])
    const capturedPast: number[][] = []
    const capturedUpcoming: number[][] = []

    const windowed = window(source, ({ current, past, upcoming, done }) => {
      // Mutate the arrays
      past.push(999)
      upcoming.push(888)
      capturedPast.push(past)
      capturedUpcoming.push(upcoming)

      if (!done && upcoming.length < 2) {
        return { value: current, advance: 0 }
      }
      return { value: current }
    })

    for await (const _ of windowed) {
      // consume
    }

    // Mutations shouldn't affect subsequent calls
    // First call: past=[], upcoming=[] -> mutated to [999], [888]
    // After advance: 0, upcoming should have [2], not [888, 2]
    expect(capturedPast[0]).toEqual([999])
    expect(capturedUpcoming[1]).toContain(2) // should have real value, not just 888
  })

  it("should handle maxPast: 0", async () => {
    const source = fromList([1, 2, 3, 4])
    const pastSnapshots: number[][] = []
    const windowed = window(
      source,
      ({ current, past }) => {
        pastSnapshots.push([...past])
        return { value: current }
      },
      { maxPast: 0 },
    )

    for await (const _ of windowed) {
      // consume
    }

    expect(pastSnapshots).toEqual([[], [], [], []])
  })

  it("should work with Pipeline chaining", async () => {
    const { nz } = await import("../src/index")

    const result = await nz([1, 2, 3, 4, 5])
      .window(({ current, past }) => ({
        value: current + past.length,
      }))
      .consume()

    // past.length is 0, 1, 2, 3, 4 for items 1, 2, 3, 4, 5
    // So: 1+0=1, 2+1=3, 3+2=5, 4+3=7, 5+4=9
    expect(result.list()).toEqual([1, 3, 5, 7, 9])
  })
})
