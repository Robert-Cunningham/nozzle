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
[x] figure out how to do releases?
[x] add a bundle size badge
[x] generate a nice image
[x] publish this package
[x] rename the github repo
[x] figure out how to make focal depend on it
[x] write a `wrap` method which maps a stream to something like {value, error, done}? Or `wrapError`? Basically it should never throw / allow you to handle errors without try/catch.
[x] make all tests pass
[x] Update asReturn, asList, asetc to be .consume().return() or .consume().list(). Basically .consume() sucks the entire thing into {list: T[], return: K}, then you can call things like .return(), .list(), .count(), etc. on it.
[x] nz(x) is the chaining operator. You definitely separately need a .from() method, which accepts a list and return, and then the question is whether nz() should be overloaded for convenience or not, so you can do nz(list) instead of nz(nz.from(list)).
[x] Instead of fromList, it should probably be something like nz(list | iterator).minInterval(30). Possibly it should be nz(list, return) or nz(iterator). Is it better to have nz(list, return) or nz.from(list, return)? => Resolves to nz(list).mapReturn(() => return) for now.
[x] write .at() that selects out just a single element. This is also a slice derivative.

// potentially we should have differences like splitEach (applies tokenwise) and split (applies response-wise); same with e.g. .trimEach and .trim(). The each functions are much less useful / common, since they can mostly be implemented with map().

[ ] write a .trim() function
[ ] rename the conversion methods, (asList / toString etc)
[ ] allow delay to choose its length with a function indicating how many elements remain / what the upcoming token is / etc? In particular, it's possible that buffer should expose an option to yield {value, bufferedCount}, which we can then use in the next iterator to determine e.g. what delay to apply? And buffer can pass {value, bufferedCount, done? (is the buffered iterator done?), futureBuffered}. So ideally we would be able to write something like stream().buffer().map({value, count} => if (count < 5) {await sleep(100); yield value;} else {yield value;}).value(). That actually seems like a super useful function. Right, buffer is actually a very core piece of infrastructure here.

[ ] write a reduce() equivalent that takes the same parameters as the delay function? / generally decide what the full group of parameters that gets passed to the iterating function is.

[ ] better readme examples
[ ] better readme tagline
[ ] animated readme example?
[ ] document regex no backreferences, lookaheads, or lookbehinds.
[ ] generally explain how regexes work
[ ] write a nice readme
[ ] read the readme carefully and fix any obvious issues
[ ] document the chaining behavior
[ ] shorter examples
[ ] fuzzing-based testing
[ ] check for multiline-regexes and assert that we can't processes these.

[ ] should we explicitly state that yielding the empty string must be a no-op?
[ ] write a .endIf function ? which ends if something is detected in the stream?
[ ] try to write the JSON thing and see if there's any way to make it easier.

[ ] generally optimize the pipeline class more; only hold the entire string in memory once, for example.

[ ] explain that streams are pull-based, a la https://chatgpt.com/c/685aecc4-7828-8012-831e-294dbb7dcf03.

[ ] write a nz.merge method which can consume many streams at once?

[ ] explain that before and after() specifically make no claims about when they emit empty strings, etc.

[ ] make all the functions (e.g. diffs, accumulate) pass through the return type.
[ ] add a tapNth(-1) function? I guess this can be trivially implemented with buffer or something.

# consider

// trace({ type: "response", response: out, summarize: true })

nz(out).onLast((x) => {
conversation.push({ raw: x, role: "assistant", enabled: true })
})

nz(out).tap((x) => {
convo += x
conversation.push({ raw: x, role: "assistant", enabled: true })
})

// or maybe we want some way to zip in "how many left"? e.g. mapWithLeft(value, left => 3, 3, 3, 3, 2, 1, 0)
nz(out)
.accumulate()
.onNth(-1, (x) => {
conversation.push({ raw: x, role: "assistant", enabled: true })
})
.diffs()
.value()

also: it's possible that we're supposed to deal with AsyncIterators (which can hold a place in a stream) instead of AsyncGenerators or AsyncIterables or the like. Need to think more carefully about this.

are we supposed to have like a AssociativePipeline, which indicates that it can emit the zero object as much / whenever it wants? And things like before() and after() can inherit from that?

## GOTCHAS:

You have to make sure to throw errors DURING an await tick, not randomly when they happen. For example, with throttle(), if you throw an error inside a setTimeout it will flow all the way to the surface (i.e. the top level rejected promise handler). Almost certainly the behavior the client wants is to throw when they next await(), so they can handle it with lexical try / catch.

You must make sure to handle the return types of iterators (not just their yield types) correctly! Functions like tap(), for exapmle, have to return their parent's return type.
