# When the brief is only 80% finished

Helping an agent work through the UI details a customer does not have time to specify.

> i spec it out 80% and then fire it off and pray
>
> — Customer conversation

Their question was whether a skill would help at all. The bottleneck was specifying the task and getting an agent to resolve the remaining UI details consistently.

The quote is from a customer conversation. The walkthrough and bundle below are illustrative; this candidate has not been evaluated.

## The missing work happens before the code

The customer wanted an end-to-end design system that could account for product permutations. They would specify everything if they had time. A useful response has to address that workload: turning a partly finished brief into a coherent interface, including the states nobody remembered to mention.

Imagine the next request is: “Add a team members page with invitations.” The agent can build a table and an invite button. But the brief leaves open what happens before members load, when an invitation fails, when someone lacks permission, or when the page is used on a narrow screen. Those omissions become review work for the customer.

## Work through the remaining decisions

re-forge’s proposed workflow starts with evidence from captured work: earlier requests, review corrections and design patterns the team accepted. At task time, the coding agent inspects the repository’s components and design documentation. Together, these can inform a short specification before implementation.

For the members page, that specification would map loading, empty, error and permission states, plus narrow layouts and keyboard behavior. Each detail should point to an existing convention or remain an explicit proposal. If the repository already defines how form errors appear, reuse it. If no precedent exists, surface the gap.

Some gaps are product decisions. “Can a member invite people, or only an admin?” needs an answer from the customer unless an authoritative rule already settles it. The agent should gather these unresolved choices into a short list, while filling in supported details and turning missing states into acceptance cases.

Once those choices are resolved, the agent implements with the existing design system. Tests check the relevant behavior; browser review checks the rendered states and interactions. A reviewer compares the result with the specification, and the final report distinguishes checks actually run from checks still outstanding.

## A reviewable specification before implementation

Illustrative draft. Confirm proposed behaviors against the project’s design system.

| Missing state | Open decision | Proposed behavior | Checks |
| --- | --- | --- | --- |
| Invite permission | Can a member invite people, or only an admin? | Ask the customer unless an authoritative rule settles it. | Test allowed and denied roles once resolved. |
| Empty list | Which existing empty-state pattern applies? | Reuse that component; show the invite action only to an allowed role. | Render an empty result for each relevant role. |
| Failed or duplicate invite | What should a duplicate invitation do? | Propose keeping the email input and reusing the form-error pattern, if established. | Exercise request failure and the agreed duplicate behavior. |
| Narrow layout and keyboard | Which responsive and dialog conventions apply? | Reuse established conventions; propose visible focus, focus return and no horizontal overflow. | Review a narrow viewport and complete the flow by keyboard. |

## Make the learning reusable, then test it

A skill could encode the specification procedure. Instructions could make it the default for UI tasks, a review agent could look for omitted states, and a lightweight hook could remind the agent to use it. re-forge packages these as one inspectable candidate, with a parent version available for rollback. The model, permissions and MCP configuration stay fixed.

The test is whether this setup reduces the customer’s work. Run repeated UI tasks against the current setup and a generic improvement, then evaluate on held-out tasks. Compare missed states, consistency with established patterns, correctness, review effort, time and cost. A longer specification is not evidence of a better result.

The intended payoff is fewer forgotten states and fewer repeated explanations. The customer spends their attention on the choices only they can make, while the agent carries forward the details the team has already worked out.

## Current capabilities

Repository-scoped capture, harness bundles and an experimental evaluation pipeline exist. Controlled live rollout is the next step. This example shows a candidate awaiting evaluation.
