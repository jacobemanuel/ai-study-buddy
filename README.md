# AI Study Buddy

Full-stack research apparatus for comparing text-based and embodied-avatar AI tutors.

`Human-AI Interaction` · `Experimental Software` · `TypeScript` · `React` · `Supabase` · `Embodied AI`

- **Context:** student research project completed at the Technical University of Munich
- **My role:** technical and product lead; architecture, implementation, deployment and study operations
- **Study focus:** trust, engagement and learning in an AI-literacy task

![Participant entry to the AI Study Buddy experiment](media/participant-entry.png)

## Abstract

AI Study Buddy was built to turn a research question into a complete, usable experimental system: how does the experience of learning with an AI tutor change when a chat interface is replaced by an embodied, speaking avatar?

The platform supports the full participant journey, two tutor conditions, multimodal service integration, pre/post measurement, interaction telemetry, data-quality review and research exports. I led the technical and product work in a five-person student team at TUM.

This portfolio focuses on the apparatus and methodology. It does not publish participant-level data or make a causal claim from a single headline number.

## The two study conditions

The learning material and overall study sequence were shared across both conditions.

| Text tutor | Embodied-avatar tutor |
|---|---|
| Written interaction with a streaming AI tutor beside the learning material | Spoken interaction with a real-time video avatar, transcript and participant-controlled microphone |

![Condition selection implemented in the study platform](media/study-conditions.png)

### Text condition

![Text-based tutor condition](media/text-tutor-condition.png)

### Avatar condition

![Embodied-avatar tutor condition](media/avatar-tutor-condition.png)

## What the apparatus had to do

The engineering work extended well beyond placing an LLM behind a chat box.

1. Present study information, informed consent and age eligibility.
2. Record demographics and a pre-test baseline.
3. Route participants into a text or avatar condition.
4. Keep the tutor synchronized with the active learning slide.
5. Capture dialogue, answers and time-on-task without recording raw audio or video.
6. Run a structured post-test covering experience, knowledge and open feedback.
7. Detect incomplete or suspicious sessions and require researcher validation.
8. Export analysis-ready CSV, JSON and PDF artifacts.

## System architecture

- **React, TypeScript and Vite** implement the participant flow and researcher dashboard.
- **Supabase Postgres** stores study sessions, answers, timing records, dialogue turns and validation state.
- **Supabase Auth and role checks** separate participant, researcher, mentor and owner workflows.
- **Deno Edge Functions** mediate writes and external AI-service calls.
- **An OpenAI-compatible streaming endpoint** powers the text tutor.
- **Anam AI** provides the real-time embodied avatar, speech pipeline and transcript events.
- **A separate image-generation service** supports an optional prompt playground inside both learning conditions.

The frontend never treats a completed screen as proof that data was saved. Study actions are persisted through explicit server operations, while failed writes enter a bounded retry path with diagnostic metadata.

## Instrumentation and data quality

Each session receives a random identifier. The platform records answers, timestamps, page and slide durations, tutor dialogue and completion state. Participant names and email addresses are not part of the study flow.

The researcher dashboard supports:

- completeness checks across demographics, pre-test, learning and post-test;
- timing-based flags for implausibly fast progression;
- inspection of text and avatar transcripts;
- explicit accept/ignore decisions before a session enters analysis;
- condition-level pre/post summaries;
- question-level performance, timing and exploratory correlations;
- filtered exports for independent analysis.

The distinction between *recorded sessions* and the *validated sample used for a particular statistic* is important. Sample size can vary after completion checks, exclusions and missing-data rules.

## Research boundaries

This system implements two practically different tutor experiences, not a perfect isolation of embodiment as a single variable. The conditions also differ in interaction modality, provider behavior and parts of the interface. Any interpretation therefore has to remain tied to the actual operationalization.

The apparatus supports condition-specific entry links, while a manual condition-selection route also exists. A rigorous deployment must document which route was used and how assignment was controlled.

Time correlations in a small validated subset are exploratory. They are useful for generating questions, not for claiming that session duration or avatar exposure caused a learning outcome.

## Privacy and ethics

- no participant names or email addresses are required;
- raw microphone audio and camera video are streamed, not stored by the study database;
- dialogue transcripts and free-text answers are stored for research review;
- participants are instructed not to enter personal information in free text;
- sessions can be withdrawn and excluded from analysis;
- public portfolio media contains no participant records.

## My contribution

As technical and product lead, I translated the study concept into the system architecture and implemented the platform end to end. My work covered the participant experience, tutor integration, database model, server functions, telemetry, research dashboard, validation workflow, exports, deployment and operational debugging during the study.

The remaining team members focused on research framing, study materials, analysis, reporting and media. The work was completed as a collaborative student research project at TUM.

## Why this matters for immersive research engineering

AI Study Buddy is not a VR project. Its relevance is the experimental infrastructure behind the interface: controlled flows, multimodal integration, instrumentation, failure handling, data provenance and clear analytical boundaries. Those same concerns determine whether an immersive environment is merely a demo or a dependable research apparatus.

## Public scope

This repository is a portfolio case study. Production source code, backend configuration, service credentials and participant-level data are intentionally not published here.

## Author

**Jakub Majewski**

[github.com/jacobemanuel](https://github.com/jacobemanuel)
