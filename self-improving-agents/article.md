# Self-improving coding agents

TheAdaply turns real work, from engineering sessions to robot trajectories, into tested improvements the whole team can reuse.

## What “self-improving” usually means

Most coding agents today run on setups a person designed once: prompts, tools, workflows. A session may produce a good result, but the next agent often starts from the same baseline unless someone manually ports the lesson. Research on *self-improving* agents asks whether a system can change its own implementation and keep changes that measurably help—without requiring a human to rewrite the setup after every win.

That question sits behind a line of work from Gödel machines to recent coding-agent benchmarks. TheAdaply is not part of that research program. It is an early-access product for engineering teams that want a related loop on their own work, with the team’s goals, accepted output and feedback as the source material.

## The Darwin Gödel Machine (research context)

In 2025, Zhang, Hu, Lu, Lange, and Clune described the [Darwin Gödel Machine](https://arxiv.org/abs/2505.22954) (“Darwin Godel Machine: Open-Ended Evolution of Self-Improving Agents,” arXiv:2505.22954). Sakana AI and UBC authors; TheAdaply is not affiliated with them.

In their framing, a *coding agent* is a system built around a frozen foundation model plus a code repository that defines tools and workflows. The DGM alternates **self-modification** with **evaluation** on coding benchmarks. It maintains an archive of agents, samples parents from that archive, and lets each parent edit its own codebase to spawn variants. Variants that compile and retain code-editing ability are evaluated; performance on benchmarks decides what enters the archive. Open-ended exploration—branching from varied parents rather than only the latest version—is part of the design.

Reported results on public benchmarks include moving from 20.0% to 50.0% on SWE-bench Verified and from 14.2% to 30.7% on Polyglot in their full evaluation, with sandboxing and human oversight noted in the paper. That is empirical self-improvement in a research sandbox, not a product integration path for a specific company.

## A related loop on a team’s real work

TheAdaply’s thesis is narrower and grounded in work the team already accepts.

Every task your team completes should make its agents better at the next one. TheAdaply’s thesis is to turn the lessons in everyday work, from successful approaches to review feedback, into improvements the whole team can reuse.

We start with software engineering agents. TheAdaply is for engineering teams that want their AI agents to produce better work than the team achieves today, with less direction, review and correction. We start with the team’s goals, accepted work and feedback, then test changes to agents’ instructions, tools and approaches against its own criteria. The search includes approaches the team has not yet tried.

We compare each change with the current setup on the same tasks, then test the strongest on fresh tasks. We measure the quality of the work and the time people spend guiding agents, reviewing results and correcting the same mistakes. Improvements that pass become the starting point for the next round.

Suppose an engineer’s agent works out how to move a service to a new system on Monday. TheAdaply tests the approach and saves the checks that made it work. On Tuesday, a teammate’s agent can use the accepted pattern where it applies and verify its own work. Sharing follows the team’s permissions. The [example page](/example/) walks through that “second time is fast” pattern on a concrete internal service.

Where a research system mutates its own repository against a public benchmark, TheAdaply captures engineering sessions and replayable checks against **the team’s** criteria. Retain a change only when it improves quality or reduces the human effort the team already measures—not when a leaderboard score moves in isolation.

## What “passes” looks like in practice

The same discipline shows up outside toy tasks. In the [Ava evaluation case study](/case_study_evals/), a retail voice agent recommended a product without verifying basement suitability. TheAdaply helped turn that failure into a test, define observable pass criteria, compare a prompt change on the same cases, and check held-out conversations before treating the change as accepted.

Software evaluation weighs correctness, test results, regressions, review effort, time and cost. The UI brief [case study](/case-study/) applies the same idea to partial specifications: compare a candidate workflow with the current setup and a generic improvement on the same UI tasks, then test on fresh tasks. Retain the change only if the work improves against the customer’s criteria with less human effort.

The [full thesis](/thesis/) includes bundle downloads and a customer quote that states the problem plainly: “i spec it out 80% and then fire it off and pray.” TheAdaply learns from that kind of accepted work and review correction—not from invented personas or fabricated metrics.

## Longer-term direction

Our longer-term direction is to adapt private models using work that passes the team’s checks. Further out, the same direction applies to robot policies adapted from evaluated trajectories; that is a direction, not something implemented today. We will compare adapted models with the team’s existing options on quality, cost and control over data before adopting them.

Each accepted improvement should give the team’s next agent a stronger starting point.

[Get early access](https://tally.so/r/lb4Rkp)