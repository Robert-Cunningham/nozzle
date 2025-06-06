[x] fix before() function, which is subtly broken
[x] add throttle, which collects all the tokens and lets them through at most once every n ms
[x] minimum inter-token delay, which allows you to do stuff like 100ms per token simulated streaming
[x] write a .replaceAll function
[x] write a .match function
[x] write a good asyncMap function
[x] write .slice
[x] make split / before / after support regexes? Maybe even implement them with regexes?
[x] write a generic regex helper which returns a stream of text / regex objects, which we can then use to implement match, replace, etc.
[x] group functions in a more reasonable way for the documentation / make the docs easier to skim
[x] write some function like flatMap that can be used to break tokens into more tokens?
[x] write .head, .tail, .last, .initial
[x] choose a name

// potentially we should have differences like splitEach (applies tokenwise) and split (applies response-wise); same with e.g. .trimEach and .trim(). The each functions are much less useful / common, since they can mostly be implemented with map().

[ ] write a reduce() equivalent?
[ ] document regex no backreferences, lookaheads, or lookbehinds.
[ ] generally explain how regexes work
[ ] publish this package and figure out how to make focal depend on it
[ ] general an image + write a nice readme
[ ] read the readme carefully and fix any obvious issues
[ ] should we explicitly state that yielding the empty string must be a no-op?
[ ] document the chaining behavior
[ ] write a .trim() function
[ ] add a bundle size badge
[ ] figure out how to do releases?
[ ] rename the conversion methods, (asList / toString etc)

[ ] write a .endIf function ? which ends if something is detected in the stream?
[ ] try to write the JSON thing and see if there's any way to make it easier.

[ ] generally optimize the pipeline class more; only hold the entire string in memory once, for example.

names: fracturejs
partialjs
incrementaljs
conduit
conductive
conduit
