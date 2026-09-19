import { describe, expect, test } from "vitest"
import { nz } from "../src"
import { consume } from "../src/transforms/consume"

async function* sourceWithReturn<T, R>(values: T[], returnValue: R): AsyncGenerator<T, R> {
  for (const value of values) {
    yield value
  }

  return returnValue
}

describe("return", () => {
  test("captures and returns the return value of an async generator", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
      return "final value"
    }

    const result = (await consume(source())).return()
    expect(result).toBe("final value")
  })

  test("returns undefined when async generator has no return value", async () => {
    const source = async function* () {
      yield "item1"
      yield "item2"
    }

    const result = (await consume(source())).return()
    expect(result).toBeUndefined()
  })

  test("works with empty async generator that has return value", async () => {
    const source = async function* () {
      return "empty return"
    }

    const result = (await consume(source())).return()
    expect(result).toBe("empty return")
  })

  test("works with empty async generator with no return value", async () => {
    const source = async function* () {}

    const result = (await consume(source())).return()
    expect(result).toBeUndefined()
  })

  test("works with Pipeline.return() method", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return 42
    }

    const result = (await nz(source()).consume()).return()
    expect(result).toBe(42)
  })

  test("return value is preserved when using map and filter transforms", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "original"
    }

    const result = (
      await nz(source())
        .map((x) => x * 2)
        .filter((x) => x > 2)
        .consume()
    ).return()

    // Note: return values are now preserved through map/filter
    expect(result).toBe("original")
  })

  test("works with tap transform which preserves return value", async () => {
    const source = async function* () {
      yield 1
      yield 2
      yield 3
      return "preserved"
    }

    const result = (
      await nz(source())
        .tap((x) => {}) // tap preserves return values
        .consume()
    ).return()

    expect(result).toBe("preserved")
  })

  test("preserves return value through generic full-consumption transforms", async () => {
    expect(
      (
        await nz(sourceWithReturn([1, 2, 3], "reduced"))
          .reduce((acc, value) => acc + value, 0)
          .consume()
      ).return(),
    ).toBe("reduced")

    expect(
      (
        await nz(sourceWithReturn([[1], [2]], "flattened"))
          .flatten()
          .consume()
      ).return(),
    ).toBe("flattened")
    expect(
      (
        await nz(sourceWithReturn([1, 2, 3], "sliced"))
          .slice(1)
          .consume()
      ).return(),
    ).toBe("sliced")
    expect(
      (
        await nz(sourceWithReturn([1, 2, 3], "initial"))
          .initial()
          .consume()
      ).return(),
    ).toBe("initial")
    expect(
      (
        await nz(sourceWithReturn([1, 2, 3], "tail"))
          .tail()
          .consume()
      ).return(),
    ).toBe("tail")
    expect(
      (
        await nz(sourceWithReturn([1, 2, 3], "timed"))
          .minInterval(0)
          .consume()
      ).return(),
    ).toBe("timed")
  })

  test("preserves return value through string and regex full-consumption transforms", async () => {
    expect(
      (
        await nz(sourceWithReturn(["a", "b"], "accumulated"))
          .accumulate()
          .consume()
      ).return(),
    ).toBe("accumulated")
    expect(
      (
        await nz(sourceWithReturn(["a", "", "b"], "compacted"))
          .compact()
          .consume()
      ).return(),
    ).toBe("compacted")
    expect(
      (
        await nz(sourceWithReturn(["a", "ab"], "diffed"))
          .diff()
          .consume()
      ).return(),
    ).toBe("diffed")
    expect(
      (
        await nz(sourceWithReturn(["a", "b"], "scanned"))
          .scan(/z/g)
          .consume()
      ).return(),
    ).toBe("scanned")
    expect(
      (
        await nz(sourceWithReturn(["a,b"], "split"))
          .split(",")
          .consume()
      ).return(),
    ).toBe("split")
    expect(
      (
        await nz(sourceWithReturn(["a,b"], "split-before"))
          .splitBefore(",")
          .consume()
      ).return(),
    ).toBe("split-before")
    expect(
      (
        await nz(sourceWithReturn(["a,b"], "split-after"))
          .splitAfter(",")
          .consume()
      ).return(),
    ).toBe("split-after")
    expect(
      (
        await nz(sourceWithReturn(["axb"], "after"))
          .after("x")
          .consume()
      ).return(),
    ).toBe("after")
    expect(
      (
        await nz(sourceWithReturn(["ab"], "before"))
          .before("z")
          .consume()
      ).return(),
    ).toBe("before")
    expect(
      (
        await nz(sourceWithReturn(["ab"], "matched"))
          .match(/a/g)
          .consume()
      ).return(),
    ).toBe("matched")
    expect(
      (
        await nz(sourceWithReturn(["ab"], "parsed"))
          .parse(/b/g, () => "B")
          .consume()
      ).return(),
    ).toBe("parsed")
    expect(
      (
        await nz(sourceWithReturn(["ab"], "replaced"))
          .replace(/b/g, "B")
          .consume()
      ).return(),
    ).toBe("replaced")
  })

  test("propagates errors from async generator", async () => {
    const source = async function* () {
      yield "item1"
      throw new Error("test error")
    }

    await expect(consume(source()).then((c) => c.return())).rejects.toThrow("test error")
  })
})
