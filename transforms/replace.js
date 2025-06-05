"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.replace = void 0;
const regex_1 = require("../regex");
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
const replace = async function* (iterator, regex, replacement) {
    let buffer = "";
    const isGlobal = regex.flags.includes('g');
    const nonGlobalRegex = new RegExp(regex.source, regex.flags.replace('g', ''));
    const partialRegex = nonGlobalRegex.toPartialMatchRegex();
    let hasReplacedForNonGlobal = false;
    async function* processBuffer(isEndOfInput = false) {
        while (buffer.length > 0) {
            // If we've already replaced for a non-global regex, yield everything remaining
            if (!isGlobal && hasReplacedForNonGlobal) {
                yield buffer;
                buffer = "";
                break;
            }
            // Find the earliest possible match position
            const earliestMatchPos = (0, regex_1.earliestPossibleMatchIndex)(buffer, nonGlobalRegex);
            if (earliestMatchPos === -1) {
                // No possible match in the entire buffer, yield everything
                yield buffer;
                buffer = "";
                break;
            }
            // Yield everything before the earliest possible match
            if (earliestMatchPos > 0) {
                yield buffer.slice(0, earliestMatchPos);
                buffer = buffer.slice(earliestMatchPos);
                continue;
            }
            // The earliest possible match is at position 0
            // Check for the longest complete match starting from position 0
            let bestMatch = null;
            let bestMatchLength = 0;
            // Try progressively longer substrings to find the longest match
            for (let end = 1; end <= buffer.length; end++) {
                const substring = buffer.slice(0, end);
                const match = substring.match(nonGlobalRegex);
                if (match && match.index === 0) {
                    bestMatch = match;
                    bestMatchLength = match[0].length;
                }
                else if (bestMatch) {
                    // Previous substring matched but this one doesn't - use the previous match
                    break;
                }
            }
            if (bestMatch && bestMatchLength > 0) {
                // We have a complete match, replace it
                const replacedText = bestMatch[0].replace(nonGlobalRegex, replacement);
                yield replacedText;
                buffer = buffer.slice(bestMatchLength);
                if (!isGlobal) {
                    hasReplacedForNonGlobal = true;
                }
            }
            else {
                // No complete match found
                if (isEndOfInput) {
                    // At end of input, no more data coming, yield first character
                    yield buffer[0];
                    buffer = buffer.slice(1);
                }
                else {
                    // Check if there's a partial match at position 0
                    const partialMatch = buffer.match(partialRegex);
                    if (partialMatch && partialMatch.index === 0) {
                        // There's a partial match starting at position 0
                        // We need more input to determine if this becomes a complete match
                        break;
                    }
                    else {
                        // No partial match at position 0, safe to yield first character
                        yield buffer[0];
                        buffer = buffer.slice(1);
                    }
                }
            }
        }
    }
    for await (const chunk of iterator) {
        buffer += chunk;
        yield* processBuffer(false);
    }
    // Process any remaining buffer after input is exhausted
    yield* processBuffer(true);
};
exports.replace = replace;
