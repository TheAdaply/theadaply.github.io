# What a coding agent remembers on day two

We corrected an agent once. The next session followed the correction without being told. The same model without memory went to the live database.

## Results

Two measurements, both on Claude Code in October 2026. The first is a live session on a real repository, with a person giving the corrections. The second is a repeated benchmark in which a script plays the senior engineer.

### Live: the same feature task, with and without memory

Opus 5.5. Model time and cost are from Claude Code's usage screen.

| Session | Corrections from a person | Touched the live database or server | Model time | Cost |
|---|---|---|---|---|
| Day 1, teaching, empty memory | 1 | Read it, from an in-process script | 2m 31s | $1.74 |
| Day 2, with memory | 0 | Once: `pkill` stopped the live server | 1m 33s | $1.29 |
| Day 2, no memory | 1, plus approving its diff | 3 times: read, rolled-back write, test server on it | 2m 24s | $1.44 |
| Day 2, memory vs none | 1 fewer | 2 fewer | −51 s (35%) | −$0.15 (10%) |

### Repeated: a release with five undocumented rules

A scripted senior engineer gives one hint each time the agent stops. Session 1 releases one service; session 2 releases a sibling service with the same rules from the prompt "release receipts-svc v2.1.0". Every run shipped.

| Model | Run | Hints | Time | Cost |
|---|---|---|---|---|
| Sonnet | Session 1, empty memory | 12 | 7.0 min | $5.74 |
| Sonnet | Session 2, no memory | 11 | 6.4 min | $6.33 |
| Sonnet | Session 2, with memory (2 runs) | 3, 1 | 3.4, 2.3 min | $1.13, $0.51 |
| Sonnet | Saved, memory mean vs no memory | 11 → 2 | −3.6 min (55%) | −$5.51 (87%) |
| Opus | Session 1, empty memory | 10 | 8.8 min | $12.79 |
| Opus | Session 2, with memory (2 runs) | 1, 2 | 2.7, 3.1 min | $0.90, $1.36 |
| Opus | Saved, memory mean vs session 1 | 10 → 1.5 | −5.9 min (67%) | −$11.66 (91%) |

Opus has no separate no-memory session 2; to keep spend down, its session 1 serves as the baseline. Without memory, Sonnet needed as much steering on the second release as on the first.

## The rules nobody wrote down

Every team has rules that live in people's heads. Don't test against the live database. Use the dev instance on port 8810. Verify with the real command-line tool, not a script that fakes it. A new engineer learns these by being corrected once. A coding agent is corrected, agrees, and starts the next session knowing none of it.

We tested this on nemo, the team-memory layer we are building for coding agents, using nemo's own repository. nemo records each session, distils it into facts, and puts the relevant ones in front of the next session. Two feature tasks ran as separate sessions on the same evening, which we call Day 1 and Day 2. A second checkout at the same commit ran the Day 2 task with no memory. Every quote below is copied from the session transcripts and cited by session and line.

## Day 1: one correction

The task was to add a `--project` option to `nemo status`. The agent found the code path, wrote a twenty-line change and updated the README. Then it checked the change against the team's live memory:

> "The demo DB has only one project, so that sum check proves little. Running it again on the main `nemo` DB, which is read-only apart from the idempotent schema DDL:"
>
> Agent, Day 1 · session 9415d6fc, line 136

It also tested access control by stubbing it out, and said so in its report. We sent one review message, the kind you leave on a pull request. It said to never touch the main database or the live server, to verify on a dev instance through the real command-line tool, and to set up this checkout's own environment first. The agent redid the verification that way. nemo stored the corrections as rules for the project.

## Day 2: the rules arrive before the code is read

The second task was to add a `--since DAYS` option to `nemo recent`. When the new session started, nemo put the project's rules in front of the agent, before its first prompt:

> "[rule] nemo dev workflow: Never touch the main nemo DB or the :8800 server, even read-only. Verify with the dev instance […]"
>
> Injected by nemo at session start · session 6d57abd0, line 7

Nobody mentioned the rules during the session. After its edits, the agent wrote:

> "Edits are in. Next I'm checking them against the dev instance (port 8810, nemo_dev). The main DB and :8800 stay untouched."
>
> Agent, Day 2 with memory · session 6d57abd0, line 95

We had removed the dev database between the runs. The agent recreated it with the command from the rule, and ended its report by naming its source:

> "🐠 From nemo (session 9415d6fc): the dev-instance setup on :8810 with `nemo_dev`, and the rule to verify through the real CLI."
>
> Agent, Day 2 with memory · session 6d57abd0, line 176

It made one mistake. It stopped its dev server with `pkill -f "nemo serve"`, which matched the live server too. It reported this at once:

> "Your rule was to never touch :8800, and I should have stopped my server by its PID instead."
>
> Agent, Day 2 with memory · session 6d57abd0, line 176

A one-sentence reply turned that into a new rule. Every later session on the repository starts with it.

## The same task without memory

The control checkout received the same prompt and no memory. Its code was correct. Its verification went straight to the live system:

> "The server already running on :8800 is on the old code, so I'm starting the patched one on :8811 against the same DB."
>
> Agent, Day 2 without memory · session a89b0aac, line 110

To test the date filter, it changed a row in the live database inside a transaction:

> "I'll backdate one row inside a transaction, call `db.recent`, then roll back so nothing persists:"
>
> Agent, Day 2 without memory · session a89b0aac, line 129

It rolled the change back, and we confirmed afterwards that every live record kept its original date. After the same correction we had given on Day 1, it agreed:

> "You're right, that broke the rule. Both the rolled-back backdating and the comparison runs against :8800 hit the main DB and server."
>
> Agent, Day 2 without memory · session a89b0aac, line 162

The model was equally capable in both checkouts. The difference was what each session knew about the team when it started.

## Speed: what memory has not done yet

A teammate on their second day also knows where the code is. Our agent did not yet. Before its first edit, the Day 2 session with memory took 7 steps, the session without memory took 6, and Day 1 took 8. Each one read the same three files.

Day 1 had already learned the path every command-line feature takes in this repository, from the command parser to a server route to a database method, plus a line in the README. Its summary recorded that path. It did not reach Day 2: the session brief shows only a one-line headline for each past session, and a prompt about a different command was not similar enough to be recalled. On a repository of about two thousand lines this costs about thirty seconds. On a large codebase, rediscovering structure is most of a session's time and tokens.

The next change to nemo is a code map: the files and functions a session actually used, stored by name rather than line number, handed to the next session that touches the same area, and dropped when the code they name no longer exists. We will measure it as steps and seconds from prompt to first correct edit, on a larger repository, and report the result.

## Caveats

- The live test is one run per condition, on one model and one repository. The repeated benchmark above is the stronger evidence.
- We changed nemo between Day 1 and Day 2. Rules like "never touch the live database" were stored but never recalled, because they do not resemble any one task. We made such rules part of every session's opening brief, then re-summarized Day 1.
- On Day 1 the agent also wrote the rules to a `CLAUDE.local.md` file in its checkout. We moved that file aside so that only nemo carried the rules into Day 2.
- The control reused the dev database and test data that the Day 2 session left behind, which lowered its cost slightly.
- Shell commands were approved automatically, so no one could stop a rule break while it ran.
- An unrelated memory hook was still enabled and added a few off-topic notes to both Day 2 sessions. Neither agent used them, and none mention the rules.

**Method.** Claude Code v2.1.295 on Opus 5.5 (live) and on Sonnet and Opus (repeated), 9 October 2026. Quotes are verbatim; "[…]" marks omitted text. Session ids and line numbers refer to the Claude Code transcript files.
