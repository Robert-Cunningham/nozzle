import { earliestPossibleMatchIndex } from "../regex"

/**
 * Replaces matches of a regex pattern with a replacement string in the input stream.
 * 
 * Uses earliestPossibleMatchIndex to efficiently yield tokens as soon as we know
 * they don't match the regex, while holding back potential matches until we can
 * determine if they should be replaced.
 *
 * @param iterator - An asynchronous iterable of strings.
 * @param regex - The regular expression pattern to match.
 * @param replacement - The string to replace matches with.
 * @returns An asynchronous generator that yields strings with replacements applied.
 *
 * @example
 * ```ts
 * const stream = replace(streamOf(["a", "b", "b", "a"]), /a[ab]*a/g, "X")
 * for await (const chunk of stream) {
 *   console.log(chunk)
 * }
 * // => ["X"]
 * ```
 */
export const replace = async function* (iterator: AsyncIterable<string>, regex: RegExp, replacement: string) {
  let buffer = ""
  const isGlobal = regex.flags.includes('g')
  const nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''))
  const partialRegex = (nonGlobalRegex as any).toPartialMatchRegex()
  let hasReplacedForNonGlobal = false
  
  async function* processBuffer(isEndOfInput = false) {
    while (buffer.length > 0) {
      // If we've already replaced for a non-global regex, yield everything remaining
      if (!isGlobal && hasReplacedForNonGlobal) {
        yield buffer
        buffer = ""
        break
      }
      
      // Check if we have a complete match at position 0
      const match = buffer.match(nonGlobalRegex)
      if (match && match.index === 0) {
        // Find the longest possible match by trying progressively longer substrings
        let bestMatch = match
        let bestMatchLength = match[0].length
        
        for (let end = bestMatchLength + 1; end <= buffer.length; end++) {
          const substring = buffer.slice(0, end)
          const longerMatch = substring.match(nonGlobalRegex)
          
          if (longerMatch && longerMatch.index === 0) {
            bestMatch = longerMatch
            bestMatchLength = longerMatch[0].length
          } else {
            break
          }
        }
        
        // If the match ends at the buffer boundary and we're not at end of input, wait for more data
        if (bestMatchLength === buffer.length && !isEndOfInput) {
          break
        }
        
        // We have a complete match, replace it
        const replacedText = bestMatch[0].replace(nonGlobalRegex, replacement)
        yield replacedText
        buffer = buffer.slice(bestMatchLength)
        
        if (!isGlobal) {
          hasReplacedForNonGlobal = true
        }
        continue
      }
      
      // No complete match at position 0, check for partial match
      const partialMatch = buffer.match(partialRegex)
      if (partialMatch && partialMatch.index === 0) {
        // There's a partial match starting at position 0
        if (isEndOfInput) {
          // At end of input, no more data coming, yield first character
          yield buffer[0]
          buffer = buffer.slice(1)
        } else {
          // We need more input to determine if this becomes a complete match
          break
        }
        continue
      }
      
      // No match or partial match starting at position 0
      // Find the earliest possible match position in the buffer
      const earliestMatch = earliestPossibleMatchIndex(buffer, nonGlobalRegex)
      
      if (earliestMatch.start === buffer.length) {
        // No possible match in the entire buffer, yield everything
        yield buffer
        buffer = ""
        break
      }
      
      // Yield everything before the earliest possible match
      if (earliestMatch.start > 0) {
        yield buffer.slice(0, earliestMatch.start)
        buffer = buffer.slice(earliestMatch.start)
        continue
      }
      
      // This should not happen - earliestMatch.start is 0 but no match/partial match
      // Yield first character to make progress
      yield buffer[0]
      buffer = buffer.slice(1)
    }
  }
  
  for await (const chunk of iterator) {
    buffer += chunk
    yield* processBuffer(false)
  }
  
  // Process any remaining buffer after input is exhausted
  yield* processBuffer(true)
}