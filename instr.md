1. Why does corepack use pnpm@12 not work here?
2. Please update Corepack first.
3. What still needs doing for release? What issues do you see? What could make it more compelling? When did I last edit it, and what model generation does that correspond to?
4. What changes are uncommitted?
5. Make a series of commits for the June changes, then commit the pnpm changes.
6. Please push that.
7. Think hard about making this releasable and great—I want it near the top of Hacker News. It’s fine to push remotely.
8. Fix the existing issues you identified and make the release process more predictable, polishing the current shape.
9. Make a commit for each issue; feel free to change contracts when existing functionality is weird.
10. Make commits relatively larger—batch fixes to each function together.
11. Don’t do those big .md writes.
12. Write terse instructions and leave things like version pinning to the relevant files.
13. What looks worst or most suspicious about the project now?
14. Do (3). tap is supposed to be asynchronous/nonblocking—is that okay? Can window have a cleaner story, or should I drop it?
15. Hide window and add withContext.
16. What’s the one skipped test?
17. Correct and re-enable it.
18. Is anything else busted?
19. Is anything obviously busted, or is it pretty solid? If so, release v0.11.
20. Is there an easy-ish way to handle the Unicode issue without doing anything crazy?
21. Can we just reject Unicode as unsupported for now?
22. Please do that.
23. Did you make the v0.11 release?
24. Please tag/push/publish v11.
25. v0.11, sorry.
26. I logged in.
27. Is it fixed now?
28. How do I fix the npm 403 requiring 2FA or a token with bypass enabled?
29. Can I make publishing not require 2FA?
30. Does npm allow Google Authenticator as 2FA?
31. I added 2FA.
32. Done [with browser verification].
33. Can you remind me of the prompts I’ve given you in this session?
