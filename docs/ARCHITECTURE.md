# Funzi Intelligence Architecture

## Core principle
Every experience reads from and contributes evidence to one longitudinal Learner Twin. Generative models may explain, converse and generate candidate content, but they do not directly declare mastery.

## Learning loop
1. **Observe** — diagnostic, quiz, tutor, assignment or flashcard produces evidence.
2. **Estimate** — mastery service updates skill probability/confidence.
3. **Reason** — graph service traverses prerequisites and identifies the highest-value next skills.
4. **Act** — planner/tutor selects an intervention appropriate to grade, language and modality.
5. **Verify** — a new assessment checks whether learning transferred.
6. **Schedule** — memory scheduler returns concepts before predicted forgetting.

## Knowledge graph
Node types: curriculum, subject, strand, substrand, concept, micro-skill, assessment objective, resource. Edge types: CONTAINS, PREREQUISITE_OF, ASSESSED_BY, REMEDIATES, EXTENDS, RELATED_TO.

Never hard-code a single curriculum into the learner model. Curriculum versions should map external standards to stable skill IDs.

## AI boundary
Browser → authenticated callable API → policy/safety layer → retrieval → model gateway → structured validator → response. Store provider secrets server-side only. Generated educational claims should retain source/provenance metadata and confidence.

## Adaptive diagnostics
Start from grade-level anchors, choose the next item using estimated information gain, descend prerequisites after repeated errors, and stop when confidence is sufficient. Record answer correctness, latency, self-reported confidence, hints and attempt count as evidence rather than reducing assessment to a raw percentage.

## Leaderboards
Do not rank children solely by raw attainment. Publish separate mastery, consistency and improvement leagues, enforce minimum evidence thresholds, use privacy-preserving display names, and permit school/guardian opt-out.

## Child safety
Use age-aware interaction policies, no open adult-to-child messaging, explicit guardian/school relationship records, moderation and escalation queues, restricted profile discovery, minimal personal data, retention controls, auditable privileged actions, and human review for high-impact safety decisions.

## Next backend increment
Implement Firebase Authentication, Firestore converters, Cloud Functions/API endpoints for tutor/diagnostic/planner, App Check, emulator tests for security rules, curriculum ingestion, and a provider-independent model gateway with retrieval-grounded responses.
