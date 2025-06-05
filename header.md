# Partial

[![npm version](https://badgen.net/npm/v/partialjs)](https://npm.im/partialjs) [![npm downloads](https://badgen.net/npm/dm/partialjs)](https://npm.im/partialjs)

## Regex Behavior

Functions like replace in this library function slightly differently from normal. In particular, all regex are guaranteed to match the first

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

If you want the more traditional behavior, you can use `{mode: greedy}`, which will only pass through bytes which for sure cannot match the regex anymore. Note that this can have unintuitive behavior.
