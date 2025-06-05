/**
 * Takes incoming chunks, merges them, and then splits them by a string separator.
 * 
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts.
 */
export async function* split(
  source: AsyncIterable<string>,
  separator: string,
): AsyncIterable<string> {
  let buffer = ""
  
  for await (const chunk of source) {
    buffer += chunk
    
    // Split by separator and yield all complete parts
    const parts = buffer.split(separator)
    
    // Keep the last part in buffer (might be incomplete)
    buffer = parts.pop() || ""
    
    // Yield all complete parts
    for (const part of parts) {
      yield part
    }
  }
  
  // Yield any remaining content in the buffer
  if (buffer.length > 0) {
    yield buffer
  }
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the beginning of each part (except the first).
 * 
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the beginning.
 */
export async function* splitBefore(
  source: AsyncIterable<string>,
  separator: string,
): AsyncIterable<string> {
  let buffer = ""
  let isFirst = true
  
  for await (const chunk of source) {
    buffer += chunk
    
    // Split by separator and yield all complete parts
    const parts = buffer.split(separator)
    
    // Keep the last part in buffer (might be incomplete)
    buffer = parts.pop() || ""
    
    // Yield all complete parts
    for (let i = 0; i < parts.length; i++) {
      if (isFirst) {
        yield parts[i]
        isFirst = false
      } else {
        yield separator + parts[i]
      }
    }
  }
  
  // Yield any remaining content in the buffer
  if (buffer.length > 0) {
    if (isFirst) {
      yield buffer
    } else {
      yield separator + buffer
    }
  }
}

/**
 * Takes incoming chunks, merges them, and then splits them by a string separator,
 * keeping the separator at the end of each part (except the last).
 * 
 * @param source The async iterable source of strings.
 * @param separator The string separator to split by.
 * @returns An async iterable that yields the split parts with separator at the end.
 */
export async function* splitAfter(
  source: AsyncIterable<string>,
  separator: string,
): AsyncIterable<string> {
  let buffer = ""
  
  for await (const chunk of source) {
    buffer += chunk
    
    // Split by separator and yield all complete parts
    const parts = buffer.split(separator)
    
    // Keep the last part in buffer (might be incomplete)
    buffer = parts.pop() || ""
    
    // Yield all complete parts with separator appended
    for (const part of parts) {
      yield part + separator
    }
  }
  
  // Yield any remaining content in the buffer (without separator)
  if (buffer.length > 0) {
    yield buffer
  }
}