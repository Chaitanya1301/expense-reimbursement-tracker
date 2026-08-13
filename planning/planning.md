# Planning Document

> Complete this document **before writing any code**. This is part of the evaluation.
> Your intent here will be compared against what you actually built in `docs/architecture.md`.

---

## Tech Stack

**Framework / Language:**

> Why did you choose this stack?

**Key Libraries:**

---

## Model

**Which model will you use?**

> Pretrained is fine, training is optional. Choosing and justifying your model is
> part of the challenge.

**Where does it run (local / in-browser / hosted)?**

> On-device inference is preferred for privacy. Note the tradeoff if you use a
> hosted model.

**Any regex helpers for structured data (cards, API keys, IDs)?**

---

## Detection Categories

> Which of the six categories will you detect (at least four)? Note whether the
> model or a rule handles each.

| Category | Detect? | Model or rule? |
|----------|---------|----------------|
| Names & contact information | | |
| Government or financial identifiers | | |
| Passwords, API keys or credentials | | |
| Medical or sensitive personal information | | |
| Employee, client or volunteer information | | |
| Confidential organizational or project information | | |

---

## Evaluation Plan

> How will you measure accuracy? You must report precision / recall / F1 on at
> least 10 labelled synthetic cases, including safe ones.

**Test data source (synthetic):**

**How you will label and score it:**

---

## Phases & Priorities

| Phase | Target Dates | Goals |
|-------|-------------|-------|
| 1 | | |
| 2 | | |
| 3 | | |

---

## What I'll Cut If Time Is Short

> Be honest. What's the first thing you'd drop, and what's the last?

---

## Open Questions / Risks

> Any uncertainties or technical risks? (e.g. model size and load time, avoiding
> over-redaction on safe text, running the model on-device.)
