# Funzi curriculum data pipeline

This directory deliberately separates **source discovery** from **content ingestion**.

- `sources/kicd.json` contains official KICD source pointers and provenance metadata.
- Protected curriculum text is not vendored into this repository by default.
- A licensed/permitted extraction can be transformed into `CurriculumImportRecord[]` and validated before Firestore publication.
- Every imported record must retain publisher, source title, framework version and source locator.

## Import lifecycle

1. Acquire an authoritative source and confirm permission/licence for the intended storage/use.
2. Record SHA-256 of the acquired source and its retrieval date.
3. Extract only the fields permitted for Funzi's use.
4. Map hierarchy: learning area → strand → substrand → specific learning outcome → skill/assessment indicator.
5. Attach competencies, values and pertinent/contemporary issues as linked nodes rather than flattening them into prompts.
6. Run `npm run curriculum:validate -- <file.json>`.
7. Human reviewer verifies mappings against the source.
8. Authorized admin sends the validated graph through `ingestCurriculum`; Firestore records the import ID and provenance.

Never treat an LLM-generated curriculum summary as authoritative curriculum data.