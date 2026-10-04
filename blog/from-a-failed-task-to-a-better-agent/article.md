# From a failed task to a better agent

How the work a team does can improve the instructions, skills and workflows its agents use.

Illustrative API scenario. The bundle is a proposed change; no improvement has been measured.

## Find the recurring failure

A developer asks an agent to fix an API endpoint. The agent repairs the happy path, runs a test with valid credentials and reports success. During review, the developer tries an expired credential. The endpoint still accepts the expired credential, and there is no test for that case. The developer sends the work back.

On another endpoint, the same omission happens again. The individual fixes may ship, but the team keeps spending time on the same correction. The problem is specific enough to act on: authentication changes need failure-case tests before the agent considers them complete.

re-forge starts with evidence from that work: the request, tool calls, review intervention and checks actually run. Captured sessions can be organized into task episodes and compared to find recurring failures. A transcript alone does not establish success; the outcome needs supporting evidence.

## Change the harness

The candidate below changes the environment around the agent: its instructions, skills, review agent and completion reminder. The API skill asks for regression tests. The reviewer checks untested failure paths. The hook asks the agent to separate checks it ran from checks it only recommends.

These parts need to be considered together. An instruction can contradict a skill, and a reviewer can lack a needed tool. A versioned bundle makes the complete change inspectable and keeps a parent version available for rollback. The model and tool permissions in this example remain the same.

This is the breed step: produce a small, testable candidate from the captured pattern. Adding more instructions is not the goal. A useful candidate might simplify or remove a rule.

## Test before adopting

Run representative tasks with both the current and candidate bundles in isolated environments. Repeat the runs, compare against a generic improvement, and check correctness, unwanted behavior, time and cost. Keep the tasks used to choose the candidate separate from the final test.

This select step must distinguish a dependable improvement from ordinary variation. A candidate that passes can move to a controlled rollout and be watched on fresh work. If it fails, retain the current bundle.

For the customer, the value is less time repeating corrections and more dependable delegation. Each accepted bundle preserves something the team learned, so that knowledge can travel to the next task instead of staying in a single conversation.

## Current capabilities

Repository-scoped capture, harness bundles and an experimental evaluation pipeline exist. Controlled live rollout is the next step. This example shows a candidate awaiting evaluation.
