export function tee<T>(iterator: AsyncIterator<T>, n: number): AsyncIterable<T>[] {
  const queues: T[][] = Array.from({ length: n }, () => []);
  const resolvers: Array<{ resolve: (value: IteratorResult<T>) => void; reject: (error: any) => void }[]> = Array.from({ length: n }, () => []);
  let finished = false;
  let error: any = null;

  const advance = async () => {
    if (finished) return;
    
    try {
      const result = await iterator.next();
      
      if (result.done) {
        finished = true;
        for (let i = 0; i < n; i++) {
          const queueResolvers = resolvers[i];
          while (queueResolvers.length > 0) {
            const { resolve } = queueResolvers.shift()!;
            resolve({ done: true, value: undefined });
          }
        }
      } else {
        for (let i = 0; i < n; i++) {
          queues[i].push(result.value);
          if (resolvers[i].length > 0) {
            const { resolve } = resolvers[i].shift()!;
            resolve({ done: false, value: queues[i].shift()! });
          }
        }
      }
    } catch (err) {
      error = err;
      finished = true;
      for (let i = 0; i < n; i++) {
        const queueResolvers = resolvers[i];
        while (queueResolvers.length > 0) {
          const { reject } = queueResolvers.shift()!;
          reject(err);
        }
      }
    }
  };

  const createIterable = (index: number): AsyncIterable<T> => ({
    [Symbol.asyncIterator](): AsyncIterator<T> {
      return {
        async next(): Promise<IteratorResult<T>> {
          if (error) {
            throw error;
          }

          if (queues[index].length > 0) {
            return { done: false, value: queues[index].shift()! };
          }

          if (finished) {
            return { done: true, value: undefined };
          }

          return new Promise((resolve, reject) => {
            resolvers[index].push({ resolve, reject });
            advance();
          });
        }
      };
    }
  });

  return Array.from({ length: n }, (_, i) => createIterable(i));
}