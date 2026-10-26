# AI Study Buddy

**A chatbot would have been the easy part. I built the whole study platform around it.**

`Human-AI Interaction` · `Experimental Software` · `TypeScript` · `React` · `Supabase` · `Embodied AI`

| Context | My role | Study design | Public scope |
|---|---|---|---|
| Course project for Human-AI Interaction at the Technical University of Munich | Technical and product lead | 30-participant comparison of two AI-tutor conditions | Study platform, methodology and de-identified interface views |

![Participant entry to the AI Study Buddy experiment](media/participant-entry.png)

## The question behind the interface

How does the experience of learning with an AI tutor change when you replace a familiar chat interface with an embodied avatar that speaks?

On the surface the comparison was simple. Text tutor or speaking avatar. The actual research problem was harder. Both experiences had to teach the same material and survive real participant sessions. They also had to leave enough evidence behind to compare them honestly.

So I turned that question into an end-to-end experimental system instead of a standalone interface demo. The platform takes a participant from consent and baseline measurement through one of two tutor conditions. It records interaction and timing telemetry and runs the post-test. It also checks session quality and produces analysis-ready exports.

The study looked at **trust, engagement and learning** in an AI-literacy task. Correct answers to the CFG-scale question went up from **23% before the learning session to 95% afterward** across the complete cohort. That's a descriptive pre/post result for the whole study. It doesn't show that the avatar alone caused the change.

## Two tutor experiences, one learning task

Both conditions used the same learning material and the same overall study sequence. The interfaces differed in interaction modality, provider behavior and presentation.

| Text tutor | Embodied-avatar tutor |
|---|---|
| Written chat with a streaming AI tutor next to the learning material | Spoken conversation with a real-time video avatar, plus a transcript and a participant-controlled microphone |

![Condition selection implemented in the study platform](media/study-conditions.png)

### Text tutor

![Text-based tutor condition](media/text-tutor-condition.png)

### Embodied-avatar tutor

![Embodied-avatar tutor condition](media/avatar-tutor-condition.png)

I call this **text tutor versus embodied-avatar tutor**. It isn't a perfectly isolated test of embodiment. Voice, provider behavior and parts of the interface changed too. Pretending otherwise would make the conclusion cleaner. It wouldn't make it more true.

## A chatbot was the easy part

Putting an LLM behind a chat panel was the easy bit. The interesting engineering problem was making the whole study survive real participants.

1. Show study information, informed consent and age eligibility.
2. Record demographics and a pre-test baseline.
3. Route participants into a text or avatar condition.
4. Keep the tutor in sync with the active learning slide.
5. Capture dialogue, answers and time-on-task without storing raw audio or camera video in the study database.
6. Run a structured post-test covering experience, knowledge and open feedback.
7. Detect incomplete or suspicious sessions and require a researcher to validate them.
8. Export filtered CSV, JSON and PDF artifacts for independent analysis.

The result was one traceable path from the participant-facing experience to the final research dataset. For critical study writes, moving on to the next screen didn't count as proof that the data was saved. Instead the platform uses explicit server operations and a bounded retry path with diagnostic metadata.

| Consent | Baseline | Experience assessment | Knowledge check |
|---|---|---|---|
| ![Informed-consent step](media/protocol-consent.png) | ![Pre-test baseline](media/protocol-pretest.png) | ![Post-intervention experience assessment](media/protocol-experience.png) | ![Post-test knowledge check](media/protocol-knowledge.png) |

*One continuous study flow: informed consent, baseline measurement, the assigned learning condition, experience ratings and a post-test knowledge check.*

## What runs underneath

- **React, TypeScript and Vite** for the participant flow and the researcher dashboard.
- **Supabase Postgres** stores study sessions, answers, timing records, dialogue turns and validation state.
- **Supabase Auth and role checks** keep participant, researcher, mentor and owner workflows apart.
- **Deno Edge Functions** handle participant-data writes and calls to external AI services.
- **An OpenAI-compatible streaming endpoint** powers the text tutor.
- **Anam AI** provides the real-time embodied avatar, the speech pipeline and the transcript events.
- **A separate image-generation service** is behind an optional prompt playground in both learning conditions.

The architecture keeps study state separate from service state. If an external tutor or avatar session fails, the experimental record still has an explicit status. So the researcher can tell a technical interruption from a completed response.

## Keeping the study measurable

Each session gets a random ID. The platform records answers, timestamps, tutor dialogue and how long people spend on each page and slide. It also logs completion state and validation decisions. Participant names and email addresses aren't part of the study flow.

The researcher dashboard supports:

- completeness checks across demographics, pre-test, learning and post-test
- timing-based flags for sessions that progress implausibly fast
- reading through text and avatar transcripts
- explicit accept or ignore decisions before a session goes into analysis
- condition-level pre/post summaries
- question-level performance, timing and exploratory correlations
- filtered exports for independent analysis

![Research dashboard with aggregate study and data-quality views](media/research-dashboard.png)

*The dashboard view is an aggregate research snapshot that depends on the filters. The validated sample can differ from statistic to statistic after completion checks, exclusions and missing-data rules.*

Telling **recorded sessions** apart from the **validated sample used for a specific statistic** was a core product requirement. It stops a nice-looking dashboard number from quietly becoming the study's source of truth.

## Where the experiment could lie to us

The apparatus supports condition-specific entry links. There's also a manual condition-selection route. A rigorous deployment has to document which route was used and how assignment was controlled.

Time correlations in a small validated subset are exploratory. They can generate hypotheses. They don't show that session duration or avatar exposure caused a learning outcome. The same goes for the 23% to 95% knowledge result, which shows learning across the complete experience. It doesn't tell you which interface component produced it.

I kept these limitations explicit because the dashboard is only useful when its numbers stay interpretable.

## Privacy

- no participant names or email addresses are required
- raw microphone audio and camera video are streamed and the study database doesn't store them
- dialogue transcripts and free-text answers are stored for research review
- participants are told not to enter personal information in free text
- sessions can be withdrawn and excluded from analysis
- public portfolio media contains no participant records

## My contribution

I was the technical and product lead in a five-person student team. I turned the study concept into the system architecture and built the platform end to end. My work covered the participant experience, tutor integration, database model, server functions, telemetry, research dashboard, validation workflow, exports and deployment. It also included operational debugging during the study.

The rest of the team focused on research framing, study materials, analysis, reporting and media. This distinction matters. The platform was collaborative research. What I mainly owned was the technical system and its operation.

## Why this matters for immersive research

AI Study Buddy isn't a VR application. What makes it relevant to immersive research is the infrastructure behind the interface: controlled participant flows, multimodal integration, instrumentation, failure handling, data provenance and explicit threats to validity. The same concerns decide whether a VR environment is just a convincing demo or a dependable experimental apparatus.

## Public scope

This repo is a portfolio case study. Production source code, backend configuration, service credentials and participant-level data are left out on purpose. The public repo was created as a clean documentation snapshot. It doesn't mirror the private development history.
