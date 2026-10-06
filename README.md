# Funzi — Adaptive Learning Intelligence

Funzi is an AI-native learning platform designed around a persistent **Learner Twin**, curriculum knowledge graph and mastery engine rather than a generic chatbot. The platform is intended for Grade 1–12 learners, teachers and parents, with Kenya-first curriculum support and an architecture that can expand internationally.

## Implemented foundation

- Responsive React/Vite learning dashboard
- Learner Twin domain model
- Confidence-weighted mastery and exam-readiness calculation
- Prerequisite-aware next-best-skill ranking
- Adaptive daily study-plan generator
- Mastery map UI
- Product surfaces for AI Tutor, diagnostics, quizzes, leaderboard, Teacher Copilot, Parent Intelligence and safety/provenance
- Firebase client configuration via environment variables

## Architecture

```
Curriculum / Knowledge Graph
          ↓
      Learner Twin
          ↓
 Mastery + Diagnostic Engine
          ↓
 Tutor ─ Quiz ─ Planner ─ Revision
   ↓        ↓       ↓         ↓
 Student   Teacher  Parent  Leaderboards
```

The learner model should remain provider-independent. Generative AI providers should sit behind server-side callable functions so model API keys are never exposed to the browser.

## Run locally

```bash
npm install
cp .env.example .env
npm run dev
```

Add a Firebase web app and place its public client configuration in `.env`.

## Production data model

Recommended Firestore collections: `users`, `learnerTwins`, `curriculumNodes`, `curriculumEdges`, `masteryEvidence`, `diagnostics`, `studyPlans`, `classrooms`, `leaderboardSnapshots`, `parentLinks`, `safetyEvents`, and `contentProvenance`.

### Roles

- **learner** — own profile, learning evidence, tutor sessions and study plans
- **parent** — explicitly linked learner summaries, never unrestricted child records
- **teacher** — assigned classes, interventions and assessments
- **school_admin** — institution-level management and aggregate analytics
- **platform_admin** — protected operational administration

## Intelligence roadmap

1. Curriculum graph ingestion and versioned CBC/CBE mappings.
2. Adaptive diagnostic using item-response evidence and prerequisite traversal.
3. Retrieval-grounded Socratic tutor with citations and age-appropriate policies.
4. Spaced-repetition scheduler with memory-strength estimates.
5. Dynamic study-plan replanning from missed tasks and mastery changes.
6. Growth-aware national/county/school/class leaderboards that reward improvement as well as mastery.
7. Teacher intervention clustering and differentiated lesson generation.
8. Parent copilot that translates learning evidence into practical actions.
9. Vision-based handwritten-work feedback and essay coaching.
10. Offline-first content packs and deferred progress synchronization.

## Safety and privacy

Funzi should use least-privilege Firestore rules, explicit parent/teacher relationships, auditable admin actions, age-aware AI policies, content provenance, moderation/escalation workflows, data minimization and aggregated/anonymized analytics for institutional reporting. Exam-readiness outputs must be presented as estimates rather than guaranteed outcomes.

## Status

This repository now contains the first executable product foundation. The UI uses demonstration learner data until Firebase collections and server-side AI functions are configured.
