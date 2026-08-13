# Architecture Overview

> Fill this in **after building**, not before. This documents how your app was actually implemented.
> Compare this against your `planning/planning.md` to reflect on where your plan changed and why.

---

## Final Tech Stack

<!-- What framework, language, and key libraries did you end up using?
Did anything change from your original plan in planning.md? If so, why? -->

## Folder Structure

<!-- Paste your actual src/ folder structure and briefly describe what each part does.
Example:
src/
├── detectors/      # One module per detection category (regex + keyword rules)
├── ui/             # Input box, highlighted preview, findings list, redacted output
├── lib/            # Validation helpers (Luhn, ranges), redaction utilities
└── examples/       # Sample/test sentences
-->

## Model & Detection Design

<!-- How does your detection pipeline actually work?
- Which model do you use, and what does it detect (names, orgs, locations)?
- What do you fall back to rules for (cards, API keys, IDs, medical/confidential terms)?
- How do you turn model output (tokens / entities) into redaction spans?
- How do you reduce false positives and avoid over-redacting safe text?
- How does a finding become a highlight, a category/explanation, and the redacted output? -->

## Where the Model Runs

<!-- Local / in-browser / hosted?
- What is the privacy tradeoff of your choice?
- Load time and size of the model, and how you handle it in the UI. -->

## What Changed From the Plan

<!-- Where did your implementation diverge from planning.md and why?
This is not a penalty - honest reflection here is valued. -->
