import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"
import { recover } from "../src/transforms/recover"

describe("recover", () => {
  test("should yield replacement values after an upstream error", async () => {
    const source = async function* () {
      yield "a"
      throw new Error("boom")
    }

    const result = (await consume(recover(source(), () => ["fallback"]))).list()

    expect(result).toEqual(["a", "fallback"])
  })

  test("should swallow errors when the handler returns nothing", async () => {
    const source = async function* () {
      yield 1
      throw new Error("boom")
    }

    const consumed = await consume(recover(source(), () => undefined))

    expect(consumed.list()).toEqual([1])
    expect(consumed.return()).toBe(undefined)
  })

  test("should support async replacement values", async () => {
    const source = async function* () {
      throw new Error("boom")
    }

    async function* replacement() {
      yield "x"
      yield "y"
    }

    const result = (await consume(recover(source(), () => replacement()))).list()

    expect(result).toEqual(["x", "y"])
  })

  test("should preserve return values on natural completion", async () => {
    const source = async function* () {
      yield "a"
      yield "b"
      return "done"
    }

    const consumed = await consume(recover(source(), () => ["fallback"]))

    expect(consumed.list()).toEqual(["a", "b"])
    expect(consumed.return()).toBe("done")
  })

  test("should allow handlers to rethrow", async () => {
    const source = async function* () {
      throw new TypeError("wrong")
    }

    const stream = recover(source(), (error) => {
      if (error instanceof TypeError) throw error
      return []
    })

    await expect(consume(stream)).rejects.toThrow("wrong")
  })

  test("should catch errors from upstream transforms", async () => {
    const result = await nz(["a", "b"])
      .map((value) => {
        if (value === "b") throw new Error("boom")
        return value
      })
      .recover(() => ["fallback"])
      .consume()

    expect(result.list()).toEqual(["a", "fallback"])
  })

  test("should not catch downstream errors", async () => {
    const stream = nz(["a"])
      .recover(() => ["fallback"])
      .map(() => {
        throw new Error("downstream")
      })

    await expect(stream.consume()).rejects.toThrow("downstream")
  })

  test("should work through the pipeline API", async () => {
    const source = async function* () {
      yield "before"
      throw new Error("boom")
    }

    const result = await nz(source())
      .recover(() => ["after"])
      .consume()

    expect(result.list()).toEqual(["before", "after"])
  })
})
