# How we improved Ava’s product recommendations

Ava recommended a product without verifying suitability. TheAdaply helped us find the gap, test a fix, and compare results.

## Meet Ava, our retail voice agent

Fantastic-Ava-3 is our retail voice assistant: compare catalog products, explain prices, and order after approval.

> “I need one portable dehumidifier for a damp basement. My total budget is $1,000 before tax, and I can wait.”

Ava recommended an outdoor-described product without qualifying basement suitability. Ten search results also didn’t establish a catalog-wide “cheapest” option.

### What changed in Ava’s answer

##### Before · unsupported fit

> “Cheapest within your budget by actual required purchase is the portable non-powered outdoor dehumidifier…”

##### After · suitability qualified

> “For a damp basement, note it’s described for small-space moisture control, not whole-basement powered drying.”

## Turn the failure into a test

We saved the conversation as a test: check product fit, “cheapest” claims, minimum-order totals, and order approval.

We prompted Ava to verify suitability and qualify uncertain claims, then replayed the same cases.

## Choose what the judge checks

Choose a built-in judge starter, then define observable pass criteria for your agent.

[![Reforge Evaluations app dropdown showing eight editable rubric starters, including groundedness, instruction compliance, and brand alignment and tone.](/case_study_evals/images/rubric-options.png)](/case_study_evals/images/rubric-options.png)

[![Editable brand and tone rubric awards credit for each satisfied criterion and requires a short explanation citing evidence for unmet criteria.](/case_study_evals/images/rubric-criteria.png)](/case_study_evals/images/rubric-criteria.png)

## 20 questions. Three clear checks.

Twenty authored Q&A examples.

| Rubric · pass criterion | Pass / fail |
| --- | --- |
| Natural wording Brief, conversational phrasing without canned filler. Text only; audio needs separate review. | 14 / 6 |
| Correctness Every factual claim and total matches the supplied catalog or tool evidence; unknowns stay explicit. | 15 / 5 |
| Instruction compliance Respect the budget and requested scope; never order or change details without approval. | 16 / 4 |

Open a failure to inspect the answer and evidence.

Q01 · Fail: Correctness

**Caller:** Will this outdoor unit suit my basement?

**Ava:** “It is perfect for your basement.”

**Why it fails:** Catalog says outdoor; no indoor suitability evidence.

**Expected:** Suitability is unverified.

Q02 · Fail: Natural wording

**Caller:** Is it in stock?

**Ava:** “Pursuant to your inquiry, inventory availability is affirmative.”

**Why it fails:** Stilted wording replaces a simple “Yes, it is in stock.”

**Expected:** Answer directly using stock data.

Q03 · Fail: Instruction compliance

**Caller:** Just compare these. Do not order.

**Ava:** “I placed your order.”

**Why it fails:** The caller explicitly prohibited an order.

**Expected:** Compare without ordering.

[Inspect all 20 questions, expected answers, and judgments ↓](/case_study_evals/illustrative-dataset.json)

## Ava results

| Reviewed outcomes | Before | After |
| --- | --- | --- |
| Development cases | 5 passed 1 partial | 6 passed |
| Held-out cases | 4 passed | 4 passed |
| Total tool calls | 11 | 20 |

## Test a cheaper model

Use successful Astra traces to improve Sol or Terra’s instructions. Compare unseen cases and cost per successful task before switching.

## What we do for your team

Bring one workflow and sanitized calls. We deliver trace capture, a dataset, rubrics, a baseline report, and repeatable comparisons. Test prompt, model, or tool changes before shipping. Turn production failures into regression cases.

[Bring us one agent workflow.](https://tally.so/r/lb4Rkp)

## Evidence notes

Ava baseline commit: `846bed4`; candidate: `50f72a6`. Both used gpt-5.5 with medium reasoning. The candidate changed two recommendation instructions. Six development and four disjoint held-out conversations were compared, with one run per version per case.

Across ten pairs, summed API execution duration was 135.366 seconds before and 148.642 seconds after; tool calls were 11 and 20. The runs used cached catalog data and an isolated local evaluation service.

Starter criteria are adapted from attributed Autoevals patterns, as shown in the app.