# re-forge: agents that evolve with your work

Reforge learns from your team’s work, tests better ways for agents to complete tasks, and shares the improvements that pass.

## The Reforge thesis

Every task your team completes should make its agents better at the next one. Reforge’s thesis is to turn the lessons in everyday work, from successful approaches to review feedback, into improvements the whole team can reuse.

Reforge is for engineering teams that want their AI agents to produce better work than the team achieves today, with less direction, review and correction. We start with the team’s goals, accepted work and feedback, then test changes to agents’ instructions, tools and approaches against its own criteria. The search includes approaches the team has not yet tried.

We compare each change with the current setup on the same tasks, then test the strongest on fresh tasks. We measure the quality of the work and the time people spend guiding agents, reviewing results and correcting the same mistakes. Improvements that pass become the starting point for the next round.

Suppose an engineer’s agent works out how to move a service to a new system on Monday. Reforge tests the approach and saves the checks that made it work. On Tuesday, a teammate’s agent can use the accepted pattern where it applies and verify its own work. Sharing follows the team’s permissions.

[Watch: How Reforge works](https://www.youtube.com/watch?v=tPs2lCjgNic)

## Customer case: completing a UI brief

One customer wanted a design system that accounted for the different states a product can reach. They asked whether a skill could help an agent complete the UI details they left open. They described the current process this way:

> i spec it out 80% and then fire it off and pray
>
> — Customer conversation

This is the kind of work Reforge can learn from: the customer’s specifications, accepted designs and review corrections. The proposed improvement is a workflow for turning a partial UI brief into a page the customer can review with fewer omissions.

### Make the remaining UI decisions visible

Consider a possible next request: “Add a team members page with invitations.” A table and invite button leave much unresolved: loading, failed invitations, permissions and narrow screens. Each missing state can send the customer back into another round of decisions and corrections.

The proposed workflow starts from the customer’s accepted patterns and review corrections. The agent inspects existing components and design documentation, then maps relevant states and checks before implementation. It cites conventions for supported details and puts unsupported choices in front of the customer.

Product decisions stay with the customer when no authoritative rule settles them. “Can a member invite people, or only an admin?” is a question to resolve before code. The table shows some of the decisions and checks this brings forward.

#### A reviewable specification before implementation

For the same team members page, separate decisions the customer needs to make from details the agent can support with existing conventions.

| Missing state | Open decision | Proposed behavior | Checks |
| --- | --- | --- | --- |
| Invite permission | Can a member invite people, or only an admin? | Ask the customer unless an authoritative rule settles it. | Test allowed and denied roles once resolved. |
| Empty list | Which existing empty-state pattern applies? | Reuse that component; show the invite action only to an allowed role. | Render an empty result for each relevant role. |
| Failed or duplicate invite | What should a duplicate invitation do? | Propose keeping the email input and reusing the form-error pattern, if established. | Exercise request failure and the agreed duplicate behavior. |
| Narrow layout and keyboard | Which responsive and dialog conventions apply? | Reuse established conventions; propose visible focus, focus return and no horizontal overflow. | Review a narrow viewport and complete the flow by keyboard. |

### Test for better results and less review

Once the customer resolves those choices, the agent implements the page with existing components, runs focused tests and checks the result in the browser. A review agent checks the agreed states and design patterns. The customer can review the flow against explicit decisions and checks.

To decide whether to adopt this workflow, we compare it with the current setup and a generic improvement on the same UI tasks, then test it on fresh tasks. The comparison covers missed states, correctness and consistency with accepted patterns, alongside review effort, time and cost. Retain the change only if the work improves against the customer’s criteria with less human effort.

### Inspect the setup for this customer case

The bundle shows how the preparation and review in this example become part of the agent’s setup. A skill sets out the procedure; instructions make it the default for UI tasks. A review agent checks the agreed states, and a hook provides a reminder. The model and its permissions stay the same.

#### Checks for this candidate

- Cover the agreed UI states and preserve existing behavior.
- Compare the candidate, current setup and a generic improvement across UI tasks.
- Measure missed states, pattern consistency, correctness, review effort, time and cost.
- Check held-out tasks before deciding whether to adopt the candidate.

Download the complete example: [Before bundle](before-bundle.zip) · [After bundle](after-bundle.zip)

## Private models for the team’s work

Our longer-term direction is to adapt private models using work that passes the team’s checks. For this customer, that means learning from accepted UI work. We will compare those models with the team’s existing options on quality, cost and control over data before adopting them.

Each accepted improvement should give the team’s next agent a stronger starting point.
