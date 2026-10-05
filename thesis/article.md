# re-forge: improving agents from real work

Turning evidence from everyday work into tested improvements for coding agents.

## The Reforge thesis

Every task your team completes should make its agents better at the next one. Reforge’s thesis is to turn the lessons in everyday work, from successful approaches to repeated corrections, into improvements the whole team can reuse.

Reforge’s approach is to create and test different ways for an agent to do the same job. One version might follow clearer instructions; another might bring in a specialist reviewer or use tools in a different order. These versions would run on the same tasks so their results can be compared. The versions that perform best would become the starting point for the next round: keep what works, then test ways to fix what still goes wrong.

Each candidate should be compared with the existing setup and a generic improvement across repeated runs, then checked on held-out tasks. Correctness, human review effort, time and cost determine whether it helps. The goal is to adopt improvements as inspectable versions, with a parent version available for rollback. Reforge already has repository-scoped capture, harness bundles and an experimental evaluation pipeline.

## A customer example: completing a UI brief

One customer wanted an end-to-end design system that could account for product permutations. They would specify every detail if they had time. Their question was whether a skill could help an agent consistently resolve the remaining UI work. They described the current process this way:

> i spec it out 80% and then fire it off and pray
>
> — Customer conversation

The quote is from a customer conversation.

## From missing details to a reviewable specification

Imagine the next request is: “Add a team members page with invitations.” An agent can build a table and an invite button while overlooking loading, failed invitations, permissions or narrow screens. Each omission becomes another decision or correction for the customer.

The proposed candidate would turn accepted design patterns and earlier review corrections into a specification procedure. At task time, the agent would inspect the repository’s components and design documentation, then map the relevant states and acceptance checks before implementation. Supported details would cite an existing convention; unsupported details would remain proposals.

Product decisions still need an authoritative answer. “Can a member invite people, or only an admin?” belongs in a short list of unresolved choices unless the project already settles it. Once those choices are resolved, the agent would implement with existing components, run targeted tests and check rendered behavior in the browser.

### A reviewable specification before implementation

UI states, product decisions and checks for the team members page.

| Missing state | Open decision | Proposed behavior | Checks |
| --- | --- | --- | --- |
| Invite permission | Can a member invite people, or only an admin? | Ask the customer unless an authoritative rule settles it. | Test allowed and denied roles once resolved. |
| Empty list | Which existing empty-state pattern applies? | Reuse that component; show the invite action only to an allowed role. | Render an empty result for each relevant role. |
| Failed or duplicate invite | What should a duplicate invitation do? | Propose keeping the email input and reusing the form-error pattern, if established. | Exercise request failure and the agreed duplicate behavior. |
| Narrow layout and keyboard | Which responsive and dialog conventions apply? | Reuse established conventions; propose visible focus, focus return and no horizontal overflow. | Review a narrow viewport and complete the flow by keyboard. |

## Test whether the change reduces the customer’s work

The bundle below makes this proposal inspectable. A skill describes the procedure, instructions make it the default for UI tasks, a review agent checks for omitted states, and a hook provides a reminder. This candidate keeps the model, permissions and MCP configuration fixed.

Evaluation would compare this candidate with the current setup and a generic improvement across repeated UI tasks, then test on held-out tasks. The measures include missed states, consistency with accepted patterns, correctness, review effort, time and cost. A longer specification alone would not justify adoption.

This is one application of the broader thesis. Real work identifies a recurring problem; a change to the agent’s setup offers a possible remedy; evaluation decides whether that change deserves to carry forward. The intended result is less repeated correction and more reliable work.

## Inspect the UI workflow

Eight complete files. Five change; the model, tool permissions and MCP configuration stay fixed.

## Evaluation checks

- Cover the agreed UI states and preserve existing behavior.
- Compare repeated baseline runs with a generic alternative.
- Measure review effort, correctness, time and cost.
- Pass held-out tasks before a controlled rollout.

Download the complete example: [Before bundle](before-bundle.zip) · [After bundle](after-bundle.zip)

Use real work to find what needs to improve. Test the change before carrying it forward.
