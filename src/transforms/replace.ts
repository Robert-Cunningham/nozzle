/**
 * Replaces matches of a regex pattern with a replacement string in the input stream.
 * 
 * The regex matching follows a specific behavior where it always tries to match
 * the longest possible string first. If a longer string doesn't match, it returns
 * the previous successful match.
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
  let accumulator = ""
  
  for await (const chunk of iterator) {
    accumulator += chunk
  }
  
  // Implement the incremental matching behavior described in header.md
  const isGlobal = regex.flags.includes('g')
  const nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''))
  
  let result = ""
  let pos = 0
  
  while (pos < accumulator.length) {
    let bestMatch: RegExpMatchArray | null = null
    let bestMatchEnd = pos
    
    // Try progressively longer substrings starting from pos
    for (let end = pos + 1; end <= accumulator.length; end++) {
      const substring = accumulator.slice(pos, end)
      const match = substring.match(nonGlobalRegex)
      
      if (match && match.index === 0) {
        // Found a match at the beginning of substring
        bestMatch = match
        bestMatchEnd = pos + match[0].length
      } else if (bestMatch) {
        // Previous substring matched but this one doesn't - use the previous match
        break
      }
    }
    
    if (bestMatch) {
      // Replace the match with proper group substitution
      result += bestMatch[0].replace(nonGlobalRegex, replacement)
      pos = bestMatchEnd
      
      // For non-global regex, append the rest and stop
      if (!isGlobal) {
        result += accumulator.slice(pos)
        break
      }
    } else {
      // No match at this position, add the character and move forward
      result += accumulator[pos]
      pos++
    }
  }
  
  if (result) {
    yield result
  }
}