# re-forge: improving agents from real work

Turning evidence from everyday work into tested improvements for coding agents.

## The Reforge thesis

Every task your team completes should make its agents better at the next one. Reforge’s thesis is to turn the lessons in everyday work, from successful approaches to repeated corrections, into improvements the whole team can reuse.

Reforge’s approach is to create and test different ways for an agent to do the same job. One version might follow clearer instructions; another might bring in a specialist reviewer or use tools in a different order. These versions would run on the same tasks so their results can be compared. The versions that perform best would become the starting point for the next round: keep what works, then test ways to fix what still goes wrong.

Each candidate should be compared with the existing setup and a generic improvement across repeated runs, then checked on held-out tasks. Correctness, human review effort, time and cost determine whether it helps. The goal is to adopt improvements as inspectable versions, with a parent version available for rollback. Reforge already has repository-scoped capture, harness bundles and an experimental evaluation pipeline.

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

### Inspect the setup for this customer case

The before-and-after bundle below shows how this workflow would become part of the agent’s setup. A skill describes the procedure, instructions make it the default for UI tasks, a review agent checks for omitted states, and a hook provides a reminder. Eight complete files are included; five change. The model, tool permissions and MCP configuration stay fixed.

#### Checks for this candidate

- Cover the agreed UI states and preserve existing behavior.
- Compare the candidate, current setup and a generic improvement across repeated UI tasks.
- Measure missed states, pattern consistency, correctness, review effort, time and cost.
- Check held-out tasks before deciding whether to adopt the candidate.

Download the complete example: [Before bundle](before-bundle.zip) · [After bundle](after-bundle.zip)

## What this case shows

This is one application of the broader thesis. Real work identifies a recurring problem; a change to the agent’s setup offers a possible remedy; evaluation decides whether that change deserves to carry forward. The intended result is less repeated correction and more reliable work.

Use real work to find what needs to improve. Test the change before carrying it forward.
