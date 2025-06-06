- fix before() function, which is subtly broken
  [done] add throttle, which collects all the tokens and lets them through at most once every n ms
- minimum inter-token delay, which allows you to do stuff like 100ms per token simulated streaming
- [done] write a .replaceAll function
- [done] write a .match function
- group functions in a more reasonable way for the documentation / make the docs easier to skim
- write a reduce() equivalent?
- [done] write a good asyncMap function
- document regex no backreferences, lookaheads, or lookbehinds.
- generally explain how regexes work
- [done] write .slice
- write .head, .tail, .last, .initial
- make split / before / after support regexes? Maybe even implement them with regexes?
- [done] write a generic regex helper which returns a stream of text / regex objects, which we can then use to implement match, replace, etc.
- publish this package and figure out how to make focal depend on it
- general an image + write a nice readme
- read the readme and fix any obvious issues

- write a .endIf function ? which ends if something is detected in the stream?
- try to write the JSON thing and see if there's any way to make it easier.
