import { DFA, JS, NFA } from "refa"

const buildDfa = (re: RegExp) => {
  const { expression, maxCharacter } = JS.Parser.fromLiteral(re).parse()
  return DFA.fromFA(NFA.fromRegex(expression, { maxCharacter }))
}

export const toPrefixRegex = (regex: RegExp) => {
  const dfa = buildDfa(regex)
  dfa.prefixes()
  const literal = JS.toLiteral(dfa.toRegex())
  return new RegExp(literal.source, literal.flags)
}

/*
const commitPrefix = (dfa: DFA, input: AsyncIterable<string>) => {
  let state = dfa.initial
  let pendingStart = 0 // earliest index that might still start a match
  let idx = 0

  return (async function* () {
    for await (const chunk of input) {
      for (const ch of chunk) {
        dfa.prefixes()
        const literal = JS.toLiteral(dfa.toRegex());
        return new RegExp(literal.source, literal.flags);

        const regex = dfa.toRegex()
        const iter = dfa.transitionIterator()
        iter.next(ch.codePointAt(0)!)
        // state = dfa.transitionIterator(state, ch.codePointAt(0)!)

        dfa.transition()

        // if (isDead(dfa.isDead(state)) {
        if (isDead

        )
          // every active start died ➜ safe
          yield idx + 1 // emit “commit up to here”
          // restart matcher anchored AFTER this byte
          state = dfa.initial
          pendingStart = idx + 1
        }
        idx++
      }
    }
  })()
}
  */
