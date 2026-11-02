# Funzi tutoring marketplace, school partners and schoolwork alignment

## Scope implemented in this branch

Funzi's **Tutoring** navigation brings together:
- Independent freelance-teacher applications with professional qualifications, subject/grade preferences, email verification and manual approval; the platform never auto-promotes a learner's Firestore `users.role`.
- School tutoring publisher applications tied to a claimed `workspaceOrgId`, held **pending** until a human reviewer verifies control of the corresponding TeknTandao Workspace organization. School publisher approval is not proof that any learner has connected.
- Individually reviewed individual/group tutoring packages with public published status, listed KES price, grade, subject, curriculum, duration and maximum group size. Prices are **catalogue data only**; no payment is charged, settled or escrowed in this change.
- Safeguarded session requests, adult/guardian eligibility review, provider acceptance/decline, and in-app messages subject to rate limits, forbidden external-contact exchange, OpenAI moderation and safety event reporting.
- AI assistance through the existing moderated Funzi Socratic tutor. Schoolwork items may be explicitly selected as prompts; grades, identity and sensitive school records are not placed in prompts.
- An authorized, learner-specific, read-only TeknTandao coursework sync function.

## Learner/school content transfer contract

Existing **Connect School ↔ Connect Funzi** pairing is the authority for a specific `funziLearnerId`; it uses proof of control of both accounts and a single-use 5-minute code. It must be deployed before coursework sync works. An organization ID or matching email is not permission.

The backend callable `syncLinkedSchoolwork({orgId})` exchanges a **server-only** dedicated TeknTandao Firebase service refresh token for an ID token and calls the already existing `funziSchoolFeed` for each of `lessons`, `assignments`, `announcements`. TeknTandao independently verifies that the learner's Funzi UID is linked to an enrolled student and that the school integration is active and the class is in its allowlist.

Only `id`, learning-item `name`, `subject` and assignment `dueAt` are retained. The schoolwork snapshot is valid for **24 hours**, is readable only via authenticated Funzi callables, and is deleted if a synchronization attempt fails. No roster, student name, marks/grades, attendance, contacts, invoices, health records or private assessment responses cross the boundary. The snapshot is not a substitute for the authoritative school record.

The transfer is **Workspace → Funzi read-only**. Funzi does not write into a school's authoritative gradebook, import files from unrelated students or automatically retrieve all classes. There is no continuous webhook or real-time feed: users explicitly synchronize and stale snapshots expire. A fresh sync is required to confirm continued authorization.

## Production secrets and deployment

From the **Funzi Firebase project**, configure these Firebase Functions secrets:

```bash
firebase functions:secrets:set OPENAI_API_KEY
firebase functions:secrets:set TEKNTANDAO_WORKSPACE_API_KEY
firebase functions:secrets:set TEKNTANDAO_FUNZI_SERVICE_REFRESH_TOKEN
firebase functions:secrets:set TEKNTANDAO_FUNZI_SCHOOL_FEED_URL
```

- `TEKNTANDAO_WORKSPACE_API_KEY`: the public Firebase Web API key for the **Workspace** Firebase project; configured as a secret here to keep related service settings server-side.
- `TEKNTANDAO_FUNZI_SERVICE_REFRESH_TOKEN`: a dedicated TeknTandao **Workspace Firebase Auth user's** refresh token, stored **only** as a Firebase Function secret. This account's UID must match the `funziUid` approved in each school's `configureFunziSchoolAccess`. Restrict and rotate/revoke it as a privileged integration identity; do not reuse an owner account.
- `TEKNTANDAO_FUNZI_SCHOOL_FEED_URL`: the actual HTTPS deployment URL of Workspace `funziSchoolFeed`.
- `OPENAI_API_KEY`: needed for moderation and existing AI tutor calls.

On Workspace Functions configure `FUNZI_FIREBASE_PROJECT_ID`, deploy `redeemFunziLinkFromFunzi`, and in Funzi web set `VITE_TEKNTANDAO_FUNZI_LINK_URL` to its deployed HTTPS endpoint.

Enable Firebase App Check for both web callables, deploy Firestore rules before enabling tutoring, and run the Functions build + emulator security tests. Confirm that the platform admin's `users/{uid}.role` is `platform_admin` using the existing protected bootstrap/admin tools.

**School partnership setup:** in TeknTandao Workspace's School Management → Funzi tutoring tab, copy the organization ID, visit the deployed Funzi app and submit a school application. Configure the Workspace dashboard at build time with `--dart-define=FUNZI_PUBLIC_URL=https://<your-live-funzi-host>` to enable the open-app action. A Funzi moderator must check that the applicant controls the Workspace organization before approving publisher access.

## Safeguarding and launch gates

The following are **not yet implemented** and must not be presented as active:
- Integrated live video conferencing, proctoring, call/stream transcription, real-time speech/video moderation, recording consent or emergency response coordination.
- Tutor KYC/credential checks, independent school ownership checks, child/guardian ID verification, safeguarding clearance or dispute handling as automated services. The approval queue stores human review decisions; independent checks are still an operating procedure.
- Payment collection, payment splitting, Kenyan tax invoices, chargebacks, refund handling, contractual tutoring terms, payout onboarding, tutor availability/calendar guarantees or automated school settlement.
- Identity and age verification of tutoring users. A platform reviewer must verify a guardian's authorization or adult learner eligibility before any booking is allowed.

A **submitted** package is not visible until approved. A **requested** session is not confirmed, and an **accepted** request creates only a moderated text interaction; it does not create a meeting link or charge money. Private contact details and external URLs are disallowed in messages to reduce off-platform safeguarding risk.

Before launch with children: perform DPIAs, establish minimum-age/guardian consent flows appropriate for applicable law, verify tutor identities and qualifications, define mandatory safeguarding reporting operations, arrange human incident review staffing and retention/deletion schedules, test App Check & security rules, add supervised audio/video only with consent and live moderator coverage, and confirm Kenyan data protection, children's rights and consumer requirements with counsel.

## Collection ownership

All collections below are server-only. Firestore client rules deny direct reads and writes:
`tutoringProviders/{uid}`, `tutoringEligibility/{uid}`, `tutoringPackages/{id}`, `tutoringBookings/{id}/messages/{id}`, `tutoringAudit/{id}`, `schoolworkSnapshots/{uid}`.

Cloud Functions enforce the user's verified Firebase authentication, row-level ownership and required provider status for booking and messaging. Schools never see a learner's schoolwork snapshot, grades or personal details by being listed as a provider.

## Recommended next milestones

1. Emulator authorization tests with tutors, learners, parents, schools and untrusted accounts.
2. Verified identity / guardian consent / school ownership workflow with auditable evidence checks and retention limits.
3. Scheduling, no-show/attendance dispute workflows, payments and settlements with appropriate licensing/agreements.
4. Safe supervised video classroom, human escalation console and moderation SLAs.
5. Opt-in, teacher-reviewed alignment between synchronized assignments and tutoring lesson plans; assessment evidence write-back only after separate school authorization.
