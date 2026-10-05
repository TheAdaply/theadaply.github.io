# re-forge: improve the coding agents your team already uses

Reforge learns from your team’s coding-agent sessions and review feedback, then tests better instructions, skills and workflows on tasks from your own repositories.

We’re building it for engineering teams that spend too much time repeating instructions, catching omissions and correcting familiar mistakes. That effort should produce improvements the whole team can reuse.

Every task provides evidence: what the agent tried, what worked, and what an engineer had to fix. Reforge uses that evidence to build test tasks, try different agent setups and compare their results with the team’s current setup. The versions that perform best become the starting point for the next round.

Our thesis is that the work spent guiding an agent should keep improving future work. Each round should help the team get more reliable results with less correction.

## Customer case: completing a UI brief

One customer wanted an end-to-end design system that could account for product permutations. They would specify every detail if they had time. Their question was whether a skill could help an agent consistently resolve the remaining UI work. They described the current process this way:

> i spec it out 80% and then fire it off and pray
>
> — Customer conversation

Reforge would use the customer’s specifications and corrections to identify recurring omissions. Those lessons would shape how the agent handles its next UI request, from preparing the specification to reviewing the result.

### Make the remaining UI decisions visible

To make the customer’s problem concrete, take a possible next request: “Add a team members page with invitations.” An agent can build a table and an invite button while overlooking loading, failed invitations, permissions or narrow screens. Each omission leaves the customer with another decision or correction.

Reforge would turn accepted design patterns and earlier review corrections into a specification procedure. For this request, the agent would inspect the repository’s components and design documentation, then map the relevant states and acceptance checks before implementation. Supported details would cite an existing convention; unsupported details would remain proposals.

The customer would still settle product decisions that the project leaves open. “Can a member invite people, or only an admin?” belongs in a short list of unresolved choices unless an authoritative rule already answers it. The table below shows how those choices, proposed behaviors and checks could become a reviewable specification for the same request.

#### A reviewable specification before implementation

For the same team members page, separate decisions the customer needs to make from details the agent can support with existing conventions.

| Missing state | Open decision | Proposed behavior | Checks |
| --- | --- | --- | --- |
| Invite permission | Can a member invite people, or only an admin? | Ask the customer unless an authoritative rule settles it. | Test allowed and denied roles once resolved. |
| Empty list | Which existing empty-state pattern applies? | Reuse that component; show the invite action only to an allowed role. | Render an empty result for each relevant role. |
| Failed or duplicate invite | What should a duplicate invitation do? | Propose keeping the email input and reusing the form-error pattern, if established. | Exercise request failure and the agreed duplicate behavior. |
| Narrow layout and keyboard | Which responsive and dialog conventions apply? | Reuse established conventions; propose visible focus, focus return and no horizontal overflow. | Review a narrow viewport and complete the flow by keyboard. |

### Check whether this reduces the customer’s work

Once those choices are resolved, the agent would implement the page with existing components, run targeted tests and check rendered behavior in the browser. A review agent would check the implementation against the agreed states and accepted patterns. For this customer, the point is to catch omissions before they become another round of corrections.

To test whether this workflow helps, evaluation would compare the candidate with the current setup and a generic improvement across repeated UI tasks, then check held-out tasks. The measures include missed states, consistency with accepted patterns, correctness, review effort, time and cost. A longer specification alone would not justify adoption.

Reforge already has repository-scoped capture, harness bundles and an experimental evaluation pipeline. The goal is to adopt improvements as inspectable versions, with a parent version available for rollback.

### Inspect the setup for this customer case

The before-and-after bundle below shows how this workflow would become part of the agent’s setup. A skill describes the procedure, instructions make it the default for UI tasks, a review agent checks for omitted states, and a hook provides a reminder. Eight complete files are included; five change. The model, tool permissions and MCP configuration stay fixed.

| File | Category | Purpose |
| --- | --- | --- |
| `global/CLAUDE.md` | Instructions | Make UI specification and observed validation part of the working agreement. |
| `global/skills/ui-spec/SKILL.md` | Skill | Turn a partial brief into explicit states and a small list of unresolved product decisions. |
| `global/agents/ui-reviewer.md` | Agent | Check the implementation against the agreed states and design precedents. |
| `global/settings.json` | Configuration | Keep the model and hook wiring fixed so the candidate changes the working procedure. |
| `repo/.claude/settings.json` | Tool permissions | Preserve the same test permissions and publishing restrictions in both versions. |
| `hooks/context.py` | Hook | Remind the agent at session start; the hook does not enforce completion. |
| `global/mcp.json` | MCP | Keep MCP configuration fixed; browser review needs existing authorized tooling or a manual check. |
| `manifest.yaml` | Bundle manifest | Record the whole setup by content hash and link the candidate to its parent. |

#### Checks for this candidate

- Cover the agreed UI states and preserve existing behavior.
- Compare the candidate, current setup and a generic improvement across repeated UI tasks.
- Measure missed states, pattern consistency, correctness, review effort, time and cost.
- Check held-out tasks before deciding whether to adopt the candidate.

Download the complete example: [Before bundle](https://theadaply.com/thesis/before-bundle.zip) · [After bundle](https://theadaply.com/thesis/after-bundle.zip)

## What this case shows

This is one application of the broader thesis. Real work identifies a recurring problem; a change to the agent’s setup offers a possible remedy; evaluation decides whether that change deserves to carry forward. The intended result is less repeated correction and more reliable work.

Use real work to find what needs to improve. Test the change before carrying it forward.
