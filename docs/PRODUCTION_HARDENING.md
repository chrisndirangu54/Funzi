# Production hardening

## App Check
Create a reCAPTCHA Enterprise site key for the deployed web origins, register the web app in Firebase App Check, set VITE_RECAPTCHA_ENTERPRISE_SITE_KEY, and deploy. AI-generation callable functions enforce App Check. Use Firebase's documented debug token flow only for local/emulator development; never commit a debug token.

## Rate controls
Firestore-backed fixed-window limits protect expensive AI endpoints. Current defaults: tutor 30/minute, quiz 10/minute, flashcards 10/minute, curriculum imports 4/minute. Tune using observed legitimate traffic and cost. Add Cloud Armor/API Gateway controls if endpoints are later exposed outside callable Functions.

## Safeguarding
Tutor input and generated output are moderated server-side. Flagged events record category/status in safetyEvents without copying the student's raw message into the review record. High-risk categories enter needs_review. Platform admins can read that queue; human safeguarding procedures must define response SLAs, guardian/school escalation, emergency handling, retention, staff training, and false-positive review. AI moderation is a triage control, not the safeguarding policy itself.

## CBC/CBE ingestion
The importer requires framework/version, level, subject, typed nodes, source provenance, learning outcomes and graph integrity. Imports are staged in curriculumImports, rejected when edges reference missing nodes, and committed in bounded batches. Do not scrape or invent official curriculum text. Load authoritative/licensed source material, preserve publisher/document version/source URL metadata, and review mappings before production publication.

Suggested hierarchy: learning area → strand → substrand → specific learning outcome → skill/assessment indicator, with cross-links to core competencies, values and pertinent/contemporary issues. Stable IDs should survive wording changes; frameworkVersion identifies the official revision.

## Test gates
CI builds both Vite and Cloud Functions, runs intelligence unit tests, then launches the Firestore emulator and executes rules tests. Expand the rules matrix whenever a role or collection is introduced. A deployment should not bypass these gates.
