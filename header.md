# Partial

[![npm version](https://badgen.net/npm/v/partialjs)](https://npm.im/partialjs) [![npm downloads](https://badgen.net/npm/dm/partialjs)](https://npm.im/partialjs)

## Regex Behavior

Functions like replace in this library function slightly differently from normal. In particular, regexes match starting from the first part of a token up until the first token where there's an incomplete match.

For example, consider `/a[ab]*a/g` applied to the token stream ["a", "b", "b", "a"]. This regex does not match "a", "ab", or "abb". Then it matches the full "abba" when it becomes available.

- "a" does not match: continue.
- "ab" does not match: continue.
- "abb" does not match: continue.
- "abba" matches: return.

In contrast, consider `/a[ab]*a/g` applied to the token stream ["a", "a", "b", "b", "a"]. You might wish for this to match the full string, "aabba".

- "a" does not match: continue.
- "aa" matches: continue.
- "aab" does not match: return the previous match.

In general, this works well for regexes like `/Response:\s*/g`, where you want to match a continuous chunk of whitespace.

The problem is that the above does not work for something like ["Res", "ponse:"], which will not match /Response:/, which is perhaps the most common use case here. Instead, regexes must match against the entire string again, which will cause quadratic performance.

You're never going to be able to do like stream.replace("'''json.\*'''/g), unless you have a library that can tell you when you're looking at "'''j" that it's a potential prefix.

If you want the more traditional behavior, you can use `{mode: greedy}`, which will only pass through bytes which for sure cannot match the regex anymore. Note that this can have unintuitive behavior. We hope to support this in the future (claude: ignore this part.)

To implement something like replace() you fundamentally MUST know whether or not you're matching a prefix. Because, if you're not matching a prefix, you must yield the tokens, and otherwise you must hold onto them so you can eventually do a replacement.

So for a call like .replace(/'''json.\*'''/g, "hidden json"), we're going to need to check, at every string position, whether that is a prefix. And then we can yield anything that is not.
