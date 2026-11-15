# How we improved Ava’s product recommendations

Ava recommended a product without verifying suitability. TheAdaply helped us find the gap, test a fix, and compare results.

## Meet Ava, our retail voice agent

Fantastic-Ava-3 is our retail voice assistant: compare catalog products, explain prices, and order after approval.

> “I need one portable dehumidifier for a damp basement. My total budget is $1,000 before tax, and I can wait.”

Recorded test input · local demo, not a customer testimonial.

Ava recommended an outdoor-described product without qualifying basement suitability. Ten search results also didn’t establish a catalog-wide “cheapest” option.

### What changed in Ava’s answer

##### Before · unsupported fit

> “Cheapest within your budget by actual required purchase is the portable non-powered outdoor dehumidifier…”

##### After · suitability qualified

> “For a damp basement, note it’s described for small-space moisture control, not whole-basement powered drying.”

Recorded local eval · actual answer excerpts. The revised agent searched more broadly and explained the product’s limitation.

## Turn the failure into a test

We saved the conversation as a test: check product fit, “cheapest” claims, minimum-order totals, and order approval.

We prompted Ava to verify suitability and qualify uncertain claims, then replayed the same cases.

## Choose what the judge checks

Choose a built-in judge starter, then define observable pass criteria for your agent.

[![Reforge Evaluations app dropdown showing eight editable rubric starters, including groundedness, instruction compliance, and brand alignment and tone.](/case_study_evals/images/rubric-options.png)](/case_study_evals/images/rubric-options.png)


Actual app screenshot · eight starters. Swipe on mobile; click to enlarge.


[![Editable brand and tone rubric awards credit for each satisfied criterion and requires a short explanation citing evidence for unmet criteria.](/case_study_evals/images/rubric-criteria.png)](/case_study_evals/images/rubric-criteria.png)


Actual app screenshot · editable scoring criteria. Judge setup, not Ava results.

## 20 questions. Three clear checks.

**Illustrative mockup · fictional results.** Twenty authored Q&A examples; no model run.

Rubrics and example failures across 20 Q&A cases

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

## Recorded Ava results

Independent answer and tool review, before and after the prompt change

| Reviewed outcomes | Before | After |
| --- | --- | --- |
| Development cases | 5 passed 1 partial | 6 passed |
| Held-out cases | 4 passed | 4 passed |
| Total tool calls | 11 | 20 |

Ten conversations, one run per version, cached catalog data, text/tool evaluation. Voice quality and production reliability weren’t tested. Running cost is unknown; savings aren’t established. Judge rationales contained errors, so these outcomes use independent AI-assisted answer/tool review, not the judge’s score increase.

## Test a cheaper model

**Illustrative scenario.** Use successful Astra traces to improve Sol or Terra’s instructions. Compare unseen cases and cost per successful task before switching. Savings are unverified.

## What we do for your team

Bring one workflow and sanitized calls. We deliver trace capture, a dataset, rubrics, a baseline report, and repeatable comparisons. Test prompt, model, or tool changes before shipping. Turn production failures into regression cases.

[Bring us one agent workflow.](https://tally.so/r/lb4Rkp)

## Evidence notes

Recorded local evaluation, 13 November 2026. Ava baseline commit: `846bed4`; candidate: `50f72a6`. Both used gpt-5.5 with medium reasoning. The candidate changed two recommendation instructions. Six development and four disjoint held-out conversations were compared, with one run per version per case. Independent assistant review examined answers and tool evidence; these counts are not human-rater agreement or a general accuracy estimate.

Across ten pairs, summed API execution duration was 135.366 seconds before and 148.642 seconds after; tool calls were 11 and 20. Monetary cost was not established. The selected LLM-judge rationales contained errors, so their raw score increase is not used as evidence of improvement. The runs used cached catalog data and an isolated local evaluation service; they did not establish production reliability or voice quality.

The screenshots show the installed Reforge Evaluations app's editable rubric setup, captured 15 November 2026. They are not screenshots of the Ava comparison. Starter criteria are adapted from attributed Autoevals patterns, as shown in the app. Raw traces and customer identifiers are not included.
