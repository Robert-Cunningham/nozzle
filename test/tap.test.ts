import { describe, test, expect, vi } from "vitest"
import { tap } from "../src/transforms/tap"
import { fromList } from "../src/transforms/fromList"
import { asList } from "../src/transforms/asList"

describe("tap", () => {
  test("should execute side effect for each value without modifying stream", async () => {
    const sideEffect = vi.fn()
    const result = await asList(tap(fromList(["a", "b", "c"]), sideEffect))
    
    expect(result).toEqual(["a", "b", "c"])
    expect(sideEffect).toHaveBeenCalledTimes(3)
    expect(sideEffect).toHaveBeenNthCalledWith(1, "a")
    expect(sideEffect).toHaveBeenNthCalledWith(2, "b")
    expect(sideEffect).toHaveBeenNthCalledWith(3, "c")
  })

  test("should handle an empty source", async () => {
    const sideEffect = vi.fn()
    const result = await asList(tap(fromList([]), sideEffect))
    
    expect(result).toEqual([])
    expect(sideEffect).not.toHaveBeenCalled()
  })

  test("should handle a source with a single item", async () => {
    const sideEffect = vi.fn()
    const result = await asList(tap(fromList(["lonely"]), sideEffect))
    
    expect(result).toEqual(["lonely"])
    expect(sideEffect).toHaveBeenCalledTimes(1)
    expect(sideEffect).toHaveBeenCalledWith("lonely")
  })

  test("should handle empty strings in the source", async () => {
    const sideEffect = vi.fn()
    const result = await asList(tap(fromList(["", "b", ""]), sideEffect))
    
    expect(result).toEqual(["", "b", ""])
    expect(sideEffect).toHaveBeenCalledTimes(3)
    expect(sideEffect).toHaveBeenNthCalledWith(1, "")
    expect(sideEffect).toHaveBeenNthCalledWith(2, "b")
    expect(sideEffect).toHaveBeenNthCalledWith(3, "")
  })

  test("should work with console.log as side effect", async () => {
    const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {})
    const result = await asList(tap(fromList(["hello", "world"]), console.log))
    
    expect(result).toEqual(["hello", "world"])
    expect(consoleSpy).toHaveBeenCalledTimes(2)
    expect(consoleSpy).toHaveBeenNthCalledWith(1, "hello")
    expect(consoleSpy).toHaveBeenNthCalledWith(2, "world")
    
    consoleSpy.mockRestore()
  })
})