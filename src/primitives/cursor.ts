import { Iterable } from "../types"

export type CursorOptions = {
  maxPast?: number
}

export type CursorSnapshot<T> = {
  past: T[]
  current: T
  upcoming: T[]
  index: number
  done: boolean
}

/**
 * A pull-based helper for transforms that need lookahead/lookbehind.
 *
 * Cursor keeps the upstream source lazy while exposing explicit peek and
 * advance operations for higher-level transforms like window and aperture.
 */
export class Cursor<T, R = any> {
  private readonly iterator: AsyncIterator<T, R>
  private readonly maxPast?: number
  private readonly pastItems: T[] = []
  private readonly upcomingItems: T[] = []
  private currentValue: T | undefined
  private initialized = false
  private hasCurrentValue = false
  private sourceDone = false
  private sourceReturnValue: R | undefined
  private currentIndex = 0

  constructor(source: Iterable<T, R>, options: CursorOptions = {}) {
    if (options.maxPast !== undefined && (options.maxPast < 0 || !Number.isInteger(options.maxPast))) {
      throw new Error(`maxPast must be a non-negative integer, got ${options.maxPast}`)
    }

    this.iterator = source[Symbol.asyncIterator]()
    this.maxPast = options.maxPast
  }

  async init(): Promise<boolean> {
    if (this.initialized) return this.hasCurrentValue

    this.initialized = true
    const first = await this.iterator.next()

    if (first.done) {
      this.sourceDone = true
      this.sourceReturnValue = first.value as R
      return false
    }

    this.currentValue = first.value
    this.hasCurrentValue = true
    return true
  }

  get hasCurrent(): boolean {
    return this.hasCurrentValue
  }

  get current(): T {
    if (!this.hasCurrentValue) {
      throw new Error("cursor has no current value")
    }

    return this.currentValue as T
  }

  get index(): number {
    return this.currentIndex
  }

  get done(): boolean {
    return this.sourceDone
  }

  get returnValue(): R | undefined {
    return this.sourceReturnValue
  }

  get upcomingLength(): number {
    return this.upcomingItems.length
  }

  get pastLength(): number {
    return this.pastItems.length
  }

  snapshot(): CursorSnapshot<T> {
    return {
      past: [...this.pastItems],
      current: this.current,
      upcoming: [...this.upcomingItems],
      index: this.currentIndex,
      done: this.sourceDone,
    }
  }

  async peek(count = 1): Promise<T[]> {
    if (count < 0 || !Number.isInteger(count)) {
      throw new Error(`peek count must be a non-negative integer, got ${count}`)
    }

    await this.init()

    while (!this.sourceDone && this.upcomingItems.length < count) {
      const next = await this.iterator.next()

      if (next.done) {
        this.sourceDone = true
        this.sourceReturnValue = next.value as R
      } else {
        this.upcomingItems.push(next.value)
      }
    }

    return this.upcomingItems.slice(0, count)
  }

  async advance(count = 1): Promise<boolean> {
    if (count <= 0 || !Number.isInteger(count)) {
      throw new Error(`advance count must be a positive integer, got ${count}`)
    }

    await this.init()

    if (!this.hasCurrentValue) {
      return false
    }

    if (count > this.upcomingItems.length + 1) {
      throw new Error(`advance (${count}) cannot exceed upcoming.length + 1 (${this.upcomingItems.length + 1})`)
    }

    this.addPast(this.current)

    for (let i = 1; i < count; i++) {
      this.addPast(this.upcomingItems.shift()!)
    }

    if (this.upcomingItems.length > 0) {
      this.currentValue = this.upcomingItems.shift()
      this.currentIndex += count
      return true
    }

    if (this.sourceDone) {
      this.hasCurrentValue = false
      this.currentIndex += count
      return false
    }

    const next = await this.iterator.next()
    this.currentIndex += count

    if (next.done) {
      this.sourceDone = true
      this.sourceReturnValue = next.value as R
      this.hasCurrentValue = false
      return false
    }

    this.currentValue = next.value
    return true
  }

  async cancel(value?: R): Promise<void> {
    this.hasCurrentValue = false
    this.upcomingItems.length = 0

    if (this.sourceDone) {
      if (value !== undefined) this.sourceReturnValue = value
      return
    }

    this.sourceDone = true
    const result = await this.iterator.return?.(value)
    this.sourceReturnValue = (result?.value ?? value) as R
  }

  private addPast(value: T): void {
    if (this.maxPast === 0) return

    this.pastItems.push(value)

    if (this.maxPast !== undefined && this.pastItems.length > this.maxPast) {
      this.pastItems.shift()
    }
  }
}
