export class ChannelClosedError extends Error {
  constructor(message = "Channel is closed") {
    super(message)
    this.name = "ChannelClosedError"
  }
}

type ChannelState = "open" | "closed" | "failed" | "canceled"

type PendingReader<T, R> = {
  resolve: (result: IteratorResult<T, R>) => void
  reject: (error: unknown) => void
}

type PendingWriter<T> = {
  value: T
  resolve: () => void
  reject: (error: unknown) => void
}

export type ChannelOptions = {
  capacity?: number
  onCancel?: () => void | Promise<void>
}

/**
 * A small producer/consumer primitive for building async iterable transforms.
 *
 * Channel is useful when production and consumption are decoupled: background
 * pumps, fan-out, timers, or bounded buffering. Consumers still see a normal
 * async iterator interface.
 */
export class Channel<T, R = undefined> implements AsyncIterable<T, R>, AsyncIterator<T, R> {
  private readonly capacity: number
  private readonly onCancel?: () => void | Promise<void>
  private readonly values: T[] = []
  private readonly readers: PendingReader<T, R>[] = []
  private readonly writers: PendingWriter<T>[] = []
  private state: ChannelState = "open"
  private returnValue: R | undefined
  private failure: unknown
  private cancelStarted = false

  constructor(options: ChannelOptions = {}) {
    const capacity = options.capacity ?? Infinity
    if (capacity < 0 || (capacity !== Infinity && !Number.isInteger(capacity))) {
      throw new Error(`channel capacity must be a non-negative integer, got ${capacity}`)
    }

    this.capacity = capacity
    this.onCancel = options.onCancel
  }

  static from<T, R = undefined>(source: AsyncIterable<T, R>, options: ChannelOptions = {}): Channel<T, R> {
    const iterator = source[Symbol.asyncIterator]()
    const channel = new Channel<T, R>({
      ...options,
      onCancel: async () => {
        await options.onCancel?.()
        await iterator.return?.()
      },
    })

    void (async () => {
      try {
        while (channel.isOpen) {
          const next = await iterator.next()

          if (next.done) {
            channel.close(next.value as R)
            return
          }

          await channel.push(next.value)
        }
      } catch (error) {
        if (channel.isCanceled && error instanceof ChannelClosedError) return
        if (channel.isCanceled) return
        channel.fail(error)
      }
    })()

    return channel
  }

  get isOpen(): boolean {
    return this.state === "open"
  }

  get isCanceled(): boolean {
    return this.state === "canceled"
  }

  async push(value: T): Promise<void> {
    if (this.state === "failed") throw this.failure
    if (this.state !== "open") throw new ChannelClosedError()

    if (this.readers.length > 0) {
      const reader = this.readers.shift()!
      reader.resolve({ done: false, value })
      return
    }

    if (this.values.length < this.capacity) {
      this.values.push(value)
      return
    }

    await new Promise<void>((resolve, reject) => {
      this.writers.push({ value, resolve, reject })
    })
  }

  close(value: R): void {
    if (this.state !== "open") return
    this.state = "closed"
    this.returnValue = value
    this.rejectWriters(new ChannelClosedError())
    this.dispatch()
  }

  fail(error: unknown): void {
    if (this.state !== "open") return
    this.state = "failed"
    this.failure = error
    this.rejectWriters(error)
    this.dispatch()
  }

  async next(): Promise<IteratorResult<T, R>> {
    if (this.values.length > 0) {
      const value = this.values.shift()!
      this.dispatch()
      return { done: false, value }
    }

    if (this.state === "closed") {
      return { done: true, value: this.returnValue as R }
    }

    if (this.state === "failed") {
      throw this.failure
    }

    if (this.state === "canceled") {
      return { done: true, value: this.returnValue as R }
    }

    return new Promise<IteratorResult<T, R>>((resolve, reject) => {
      this.readers.push({ resolve, reject })
      this.dispatch()
    })
  }

  async return(value?: R): Promise<IteratorResult<T, R>> {
    const returnValue = value === undefined && this.state === "closed" ? this.returnValue : value
    await this.cancel(returnValue as R)
    return { done: true, value: returnValue as R }
  }

  async throw(error?: unknown): Promise<IteratorResult<T, R>> {
    this.fail(error)
    throw error
  }

  async cancel(value?: R): Promise<void> {
    if (this.state === "canceled") return

    if (this.state !== "open") {
      this.state = "canceled"
      this.returnValue = value
      this.values.length = 0
      this.rejectWriters(new ChannelClosedError("Channel was canceled"))

      while (this.readers.length > 0) {
        this.readers.shift()!.resolve({ done: true, value: value as R })
      }

      return
    }

    this.state = "canceled"
    this.returnValue = value
    this.values.length = 0
    this.rejectWriters(new ChannelClosedError("Channel was canceled"))

    while (this.readers.length > 0) {
      this.readers.shift()!.resolve({ done: true, value: value as R })
    }

    if (this.onCancel && !this.cancelStarted) {
      this.cancelStarted = true
      await this.onCancel()
    }
  }

  [Symbol.asyncIterator](): AsyncIterator<T, R> {
    return this
  }

  private dispatch(): void {
    let progressed = true

    while (progressed) {
      progressed = false

      while (this.values.length > 0 && this.readers.length > 0) {
        const reader = this.readers.shift()!
        const value = this.values.shift()!
        reader.resolve({ done: false, value })
        progressed = true
      }

      while (this.state === "open" && this.readers.length > 0 && this.writers.length > 0) {
        const reader = this.readers.shift()!
        const writer = this.writers.shift()!
        reader.resolve({ done: false, value: writer.value })
        writer.resolve()
        progressed = true
      }

      while (this.state === "open" && this.writers.length > 0 && this.values.length < this.capacity) {
        const writer = this.writers.shift()!
        this.values.push(writer.value)
        writer.resolve()
        progressed = true
      }
    }

    if (this.state === "closed") {
      while (this.readers.length > 0) {
        this.readers.shift()!.resolve({ done: true, value: this.returnValue as R })
      }
    }

    if (this.state === "failed") {
      while (this.readers.length > 0) {
        this.readers.shift()!.reject(this.failure)
      }
    }
  }

  private rejectWriters(error: unknown): void {
    while (this.writers.length > 0) {
      this.writers.shift()!.reject(error)
    }
  }
}
