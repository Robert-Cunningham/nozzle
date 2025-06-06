# Partial

[![npm version](https://badgen.net/npm/v/partialjs)](https://npm.im/partialjs) [![npm downloads](https://badgen.net/npm/dm/partialjs)](https://npm.im/partialjs)

Partial is a utility library for manipulating streams of text, and in particular streamed responses from LLMs.

## Installation

```
npm i partial-js # or pnpm / bun / yarn
```

partial is written in TypeScript and has both cjs and esm builds.

## Usage

```ts
const stream = await openai.chat.completions.create({ ...args, stream: true })

/*
# Answer:
The product is 9.

# Reasoning:
3x3 is equal to 9.

=> 
The product is 9.
*/
// extract the section between # Answer and # Reasoning; return the individual sentences at least 100ms apart.
return p(stream)
  .after("# Answer")
  .before("# Reasoning")
  .split(/ .;,/g)
  .trim() // trim the overall response of whitespace.
  .atRate(100)
  .value()
```

// wait, does regex work with ^? probably not, since we truncate all the time, right?
// because really, .trim() should just be .replace(^\s+, '').replace(\s+$, '').
// it could also be

````ts
import { parse, STR, OBJ } from "partial-json";

const input = `
Sure, the object that answers your question is:
\`\`\`json
{"product": 9}
\`\`\`
`

// should have .throwifnotfound or something, as well as .throwiffound, .censor, etc?
return p(stream)
  .after("```json")
  .before("```")
  .trim()
  .accumulate()
  .map((prefix) => parse(prefix))
  .pairs()
  .filter(x => ) // only allow json values which have xyz
  .value()
```
````

### Testing

```
git clone https://github.com/Robert-Cunningham/partial
cd partial
npm i
npm run test
```

### License

This library is licensed under the MIT license.
