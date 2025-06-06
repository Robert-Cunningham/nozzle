# Partial

[![npm version](https://badgen.net/npm/v/partialjs)](https://npm.im/partialjs) [![npm downloads](https://badgen.net/npm/dm/partialjs)](https://npm.im/partialjs)

Partial is a utility library for manipulating streams of text, and in particular streamed responses from LLMs.

```ts
const stream = await openai.chat.completions.create({ ...args, stream: true })

// extract the section between # Answer and # Reasoning; return the individual sentences at least 100ms apart.
return p(stream)
  .after("# Answer")
  .before("# Reasoning")
  .split(/.;,/g)
  .atRate(100)
  .value()
```

# On Regexes

input:
'hi' =>
' there' => 'hi'
