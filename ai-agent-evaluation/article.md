# AI agent evaluation

Agent evals should turn real failures into tests, compare a change against the current setup on the same work, and check held-out tasks before anything ships.

## What agent evaluation is for

Teams running coding agents need more than a gut check after each session. *AI agent evaluation* asks whether a proposed change—instructions, tools, model choice, or workflow—actually improves the work the team already accepts, with criteria observers can verify. The bar is not a higher score on someone else’s benchmark. It is better results on the team’s tasks, with less time spent guiding agents, reviewing output and correcting the same mistakes.

TheAdaply is an early-access product built around that discipline. It starts from the team’s goals, accepted work and feedback, explores changes to agent instructions, tools and approaches, and keeps only what passes checks the team can see and replay.

## Turn failures into tests

Production mistakes are often the best source material. In the [Ava agent evaluation case study](/case_study_evals/), a retail voice agent recommended a product without verifying basement suitability. TheAdaply helped turn that failure into a test: save the conversation, define what “pass” means for product fit and ordering rules, and replay the same cases after a change.

The same pattern applies outside voice. When a customer gives an agent most of a UI brief and lives with repeated review rounds—one customer described the process as “i spec it out 80% and then fire it off and pray”—the gap is measurable. The [UI brief case study](/case-study/) compares a candidate workflow with the current setup and a generic improvement on the same UI tasks, then tests on fresh tasks. Retain the change only if the work improves against the customer’s criteria with less human effort.

## Observable pass criteria

Evaluations fail when “better” stays vague. On Ava, the team chose judge starters and defined observable pass criteria—natural wording, correctness against catalog evidence, instruction compliance on budget and approval—then scored twenty authored Q&A examples before and after a prompt change. Open a failure to inspect the answer, evidence and why a criterion failed.

For software agents, evaluation weighs correctness, test results, regressions, review effort, time and cost. Robotics evaluation, where measured, weighs task success, recovery, intervention rate, completion time and safety constraints. The domains differ; the habit is the same: write down what counts as pass before comparing runs.

The recorded [evaluations demo](/demo/) shows the same six support questions answered with and without a supplied shop policy, with comparisons and judge rationales you can inspect—illustrating controlled comparison rather than anecdote.

## Same tasks, then held-out tasks

TheAdaply compares each change with the current setup on the same tasks, then tests the strongest on fresh tasks. In the Ava study, six development cases and four disjoint held-out conversations were compared with one run per version per case. Development cases moved from five passed and one partial to six passed; held-out cases stayed at four passed after the change that qualified uncertain claims.

The thesis loop is the same for engineering work: measure the quality of the work and the time people spend guiding agents, reviewing results and correcting the same mistakes. Improvements that pass become the starting point for the next round. That loop sits inside the broader [self-improving coding agents](/self-improving-agents/) story—tested evolution on the team’s work, not an open-ended research archive.

At design partners VALSEA and 8x Social, repeated agent corrections fell 62% in two weeks. That is human effort measured on real workflows, not a leaderboard move.

## Evaluation needs captured work

Comparisons need structured task data: prompts, tool calls, outcomes and the checks that decided pass or fail. The [AI agent observability](/ai-agent-observability/) page explains how TheAdaply’s Capture step turns sessions into that record from registered repositories—nothing outside the repositories you register is read—so evals can replay real cases instead of synthetic anecdotes.

Accepted evals also feed what the next agent starts from. Lessons that pass can carry to teammates under the team’s permissions, as described on the [coding agent memory](/coding-agent-memory/) page.

## Robotics and longer-term direction

The same discipline holds outside software, with acceptance criteria that fit the domain. The thesis extends the loop to robotics: capture the trajectory, test a proposed adaptation against the current baseline, and retain it only when it passes.

robot sim pick success went from 9/50 to 44/50 in six hours with zero new demos when the part changed from cube to pyramid.

Robot policies adapted from evaluated trajectories, and private models trained on work that passes the team’s checks, are longer-term directions—not shipped capabilities today. We will compare adapted models with the team’s existing options on quality, cost and control over data before adopting them.

[Get early access](https://tally.so/r/lb4Rkp)