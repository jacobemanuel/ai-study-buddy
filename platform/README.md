# AI Study Buddy platform

The code behind the [AI Study Buddy](../README.md) study: the participant flow, both tutor conditions, the researcher dashboard and the Supabase backend. Participant data and the study's own Supabase project aren't part of it.

## What's here

| Path | What it does |
|---|---|
| `src/pages` | The participant flow from the study link to the post-test, plus the researcher login and dashboard |
| `src/components/modes` | The two learning conditions: a streaming text tutor, and a speaking avatar with a live transcript |
| `src/components/admin` | Dashboard views for sessions, responses, questions, slides, the audit log and settings |
| `src/lib/studyData.ts`, `src/lib/edgeQueue.ts` | Every study write goes through an edge function. A write that fails waits in a local queue and is retried with a growing delay |
| `src/hooks/useBotDetection.ts`, `src/lib/suspicion.ts` | Timing rules that flag sessions which moved implausibly fast, and the explanation the dashboard shows for each flag |
| `src/lib/permissions.ts` | What each dashboard role may see and change |
| `supabase/functions` | Ten Deno edge functions for study writes, the two tutors, session validation and settings |
| `supabase/migrations` | The database schema and its row-level security, in the order they were applied |

## Run the tests

```bash
cd platform
npm ci
npm test
npm run typecheck
npm run build
```

The 54 tests cover how study data gets saved and retried, how sessions get flagged, who may do what in the dashboard, and the answer widgets. A smoke test renders the first screens, and two tests build the dashboard's PDF reports from sample data. CI runs all of them on every push.

## Run it against a backend

Copy `.env.example` to `.env` and point it at a Supabase project, apply the migrations with the Supabase CLI and set these function secrets:

| Secret | Used for |
|---|---|
| `AI_GATEWAY_URL`, `AI_GATEWAY_KEY` | The text tutor and the image playground. Any OpenAI-compatible chat completions endpoint works |
| `ANAM_API_KEY` | The avatar. A key saved in the dashboard settings takes precedence |
| `OWNER_EMAIL`, `VIEWER_EMAILS`, `ADMIN_EMAILS` | Dashboard roles, and the accounts `create-admin-users` sets up |
| `ADMIN_CREATION_SECRET`, `OWNER_PASSWORD`, `DEFAULT_ADMIN_PASSWORD`, `MENTOR_PASSWORD` | `create-admin-users` |

One early migration had the owner's address in a policy that a later migration replaced. Here it's a placeholder.

## Left out

The study's data and its Supabase project, every key and password, the generated specification documents, and the logo and background images used during the study. The lesson slides in `src/data` come from the team's study materials.

© 2026 Jakub Majewski. All rights reserved.
