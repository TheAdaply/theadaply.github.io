# AI agent observability

Agent session capture should turn prompts, tool calls and outcomes into structured task data your team can evaluate—not anecdotes lost when the tab closes.

## Observability beyond logs

*AI agent observability* here means engineering workflow intelligence: a durable record of what agents were asked to do, which tools they called, and what outcomes the team accepted or sent back for correction. Generic request logging is not enough. Teams need task-shaped data they can compare, replay and turn into tests—the same material behind serious [agent evals](/ai-agent-evaluation/).

The homepage names the first step explicitly: **Capture**. Every session your team runs, with its prompts, tool calls and outcomes, becomes structured task data. Nothing outside the repositories you register is read.

## What disappears today

Before capture, knowledge walks out with the session. The homepage describes teams running a thousand agent sessions a week while the thousand-and-first starts from zero—the same tool path walked again as if for the first time.

The thesis extends the idea beyond software. A robot’s work also leaves a trajectory: what it observed, what it was asked to do, what it tried, where it failed, where a person stepped in, and whether the outcome was accepted. Today most of that experience is thrown away. Observability is the precondition for testing improvements on trajectories the team already has instead of collecting fresh demos for every change.

## What capture declares

The site publishes a machine-readable [capture manifest](/CAPTURE-MANIFEST.json) so humans and agents can see what the client reads, what leaves the machine, and how to stop it. Capture proceeds only with human consent; the default state is off. The manifest describes reading local transcript files from supported coding tools, sending redacted event fields to the team’s TheAdaply cloud or a self-hosted endpoint, and client-side secret stripping before content is spooled or sent.

The homepage promise stays narrow: structured task data from registered repositories—not a blanket read of the machine. That boundary matters for trust and for evals: comparisons should reflect work the team chose to register, not ambient filesystem access.

## Capture. Breed. Select.

Observability feeds the rest of the loop named on the homepage. **Capture** records sessions. **Breed** spawns candidate agents on workflows the team repeats—different prompts, tools and orderings for the same job. **Select** keeps candidates that win on outcomes the team already has; weak variants retire each generation.

The evolving-agents product description on the homepage is the operational summary: capture every session your team runs, breed candidate agents for the work you repeat, and keep the ones that win on your own tasks. That is observability in service of improvement, not dashboards for their own sake.

## From sessions to evals

Captured traces become the substrate for evaluation. The Ava case study shows execution traces for a failure, rubric criteria observers can edit, and experiment comparisons between baseline and candidate runs. The UI brief case study shows how accepted work and review corrections become bundle changes you can inspect. None of that works without session capture first.

TheAdaply compares each change with the current setup on the same tasks, then tests the strongest on fresh tasks, measuring quality and human effort. At design partners VALSEA and 8x Social, repeated agent corrections fell 62% in two weeks. That is human effort measured on real workflows.

Turn production failures into regression cases; retain improvements only when they pass checks the team can see. The [self-improving coding agents](/self-improving-agents/) article walks through that loop on engineering work; the [coding agent memory](/coding-agent-memory/) page explains how accepted lessons propagate under team permissions.

## Longer-term direction

Private models adapted using work that passes the team’s checks, and robot policies adapted from evaluated trajectories, are longer-term directions—not shipped today. Capture and observability remain the ground truth layer: what was tried, what passed, and what the next agent may inherit.

[Get early access](https://tally.so/r/lb4Rkp)