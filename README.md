# AI Study Buddy

**A full-stack research apparatus for comparing text-based and embodied-avatar AI tutors.**

`Human-AI Interaction` · `Experimental Software` · `TypeScript` · `React` · `Supabase` · `Embodied AI`

| Context | My role | Study design | Public scope |
|---|---|---|---|
| Student research project at the Technical University of Munich | Technical and product lead | 30-participant comparison of two AI-tutor conditions | Apparatus, methodology and de-identified interface views |

![Participant entry to the AI Study Buddy experiment](media/participant-entry.png)

## Research question

How does the experience of learning with an AI tutor change when a familiar chat interface is replaced by an embodied, speaking avatar?

I translated that question into an end-to-end experimental system rather than a standalone interface demo. The platform guides a participant from consent and baseline measurement through one of two tutor conditions, records interaction and timing telemetry, runs the post-test, validates session quality and produces analysis-ready exports.

The study examined **trust, engagement and learning** in an AI-literacy task. Across the complete cohort, correct understanding of one central AI concept rose from **23% before learning to 95% afterward**. This is a descriptive pre/post result across the study, not evidence that the avatar alone caused the change.

## Two operationalized conditions

The learning material and overall study sequence were shared. The interaction channel was deliberately different.

| Text tutor | Embodied-avatar tutor |
|---|---|
| Written interaction with a streaming AI tutor beside the learning material | Spoken interaction with a real-time video avatar, transcript and participant-controlled microphone |

![Condition selection implemented in the study platform](media/study-conditions.png)

### Text tutor

![Text-based tutor condition](media/text-tutor-condition.png)

### Embodied-avatar tutor

![Embodied-avatar tutor condition](media/avatar-tutor-condition.png)

The comparison is intentionally described as **text tutor versus embodied-avatar tutor**, not as a perfectly isolated embodiment variable. Voice, provider behavior and parts of the interface also differ between the conditions; those differences belong to the operationalization and therefore to the interpretation.

## What I built

The engineering work extended well beyond placing an LLM behind a chat box.

1. Present study information, informed consent and age eligibility.
2. Record demographics and a pre-test baseline.
3. Route participants into a text or avatar condition.
4. Keep the tutor synchronized with the active learning slide.
5. Capture dialogue, answers and time-on-task without storing raw audio or camera video in the study database.
6. Run a structured post-test covering experience, knowledge and open feedback.
7. Detect incomplete or suspicious sessions and require researcher validation.
8. Export filtered CSV, JSON and PDF artifacts for independent analysis.

This created one traceable path from the participant-facing experience to the final research dataset. A screen transition was never treated as proof that data had been saved: study actions use explicit server operations, while failed writes enter a bounded retry path with diagnostic metadata.

| Consent | Baseline | Experience assessment | Knowledge check |
|---|---|---|---|
| ![Informed-consent step](media/protocol-consent.png) | ![Pre-test baseline](media/protocol-pretest.png) | ![Post-intervention experience assessment](media/protocol-experience.png) | ![Post-test knowledge check](media/protocol-knowledge.png) |

*One continuous study flow: informed consent, baseline measurement, the assigned learning condition, experience ratings and a post-test knowledge check.*

## System architecture

- **React, TypeScript and Vite** implement the participant flow and researcher dashboard.
- **Supabase Postgres** stores study sessions, answers, timing records, dialogue turns and validation state.
- **Supabase Auth and role checks** separate participant, researcher, mentor and owner workflows.
- **Deno Edge Functions** mediate writes and external AI-service calls.
- **An OpenAI-compatible streaming endpoint** powers the text tutor.
- **Anam AI** provides the real-time embodied avatar, speech pipeline and transcript events.
- **A separate image-generation service** supports an optional prompt playground inside both learning conditions.

The architecture separates study state from service state. If an external tutor or avatar session fails, the experimental record still has an explicit status and the researcher can distinguish a technical interruption from a completed response.

## Instrumentation and research operations

Each session receives a random identifier. The platform records answers, timestamps, page and slide durations, tutor dialogue, completion state and validation decisions. Participant names and email addresses are not part of the study flow.

The researcher dashboard supports:

- completeness checks across demographics, pre-test, learning and post-test;
- timing-based flags for implausibly fast progression;
- inspection of text and avatar transcripts;
- explicit accept or ignore decisions before a session enters analysis;
- condition-level pre/post summaries;
- question-level performance, timing and exploratory correlations;
- filtered exports for independent analysis.

![Research dashboard with aggregate study and data-quality views](media/research-dashboard.png)

*The dashboard view is an aggregate, filter-dependent research snapshot. The validated sample can differ by statistic after completion checks, exclusions and missing-data rules.*

That distinction between **recorded sessions** and the **validated sample used for a specific statistic** was a core product requirement. It prevents an attractive dashboard number from silently becoming the study's source of truth.

## Data quality and analytical boundaries

The apparatus supports condition-specific entry links, while a manual condition-selection route also exists. A rigorous deployment must document which route was used and how assignment was controlled.

Time correlations in a small validated subset are exploratory. They can generate hypotheses, but they do not show that session duration or avatar exposure caused a learning outcome. Likewise, the 23% to 95% knowledge result demonstrates learning across the complete experience; it does not identify which interface component produced it.

These boundaries are documented in the portfolio because reliable research software must preserve not only data, but also the meaning and limits of the data it produces.

## Privacy

- no participant names or email addresses are required;
- raw microphone audio and camera video are streamed, not stored by the study database;
- dialogue transcripts and free-text answers are stored for research review;
- participants are instructed not to enter personal information in free text;
- sessions can be withdrawn and excluded from analysis;
- public portfolio media contains no participant records.

## My contribution

As technical and product lead in a five-person student team, I translated the study concept into the system architecture and implemented the platform end to end. My work covered the participant experience, tutor integration, database model, server functions, telemetry, research dashboard, validation workflow, exports, deployment and operational debugging during the study.

The remaining team members focused on research framing, study materials, analysis, reporting and media. This distinction matters: the platform was collaborative research, while my primary ownership was the technical apparatus and its operation.

## Why it matters for immersive research engineering

AI Study Buddy is not a VR application. Its relevance to immersive research lies in the infrastructure behind the interface: controlled participant flows, multimodal integration, instrumentation, failure handling, data provenance and explicit threats to validity. The same concerns determine whether a VR environment is only a convincing demo or a dependable experimental apparatus.

## Public scope

This repository is a portfolio case study. Production source code, backend configuration, service credentials and participant-level data are intentionally not published. The public repository was created as a clean documentation snapshot; it is not a mirror of the private development history.

## Author

**Jakub Majewski**

[github.com/jacobemanuel](https://github.com/jacobemanuel)
