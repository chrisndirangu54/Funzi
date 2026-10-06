# Private KICD RAG pipeline

Architecture: KICD source → private Cloud Storage → PDF parsing/chunking → OpenAI embeddings → Firestore vector index → metadata/curriculum graph → filtered KNN retrieval → tutor/generator → guarded paraphrase.

## Storage
Upload authorized PDFs to the private path `rag-private/kicd/`. Do **not** put source PDFs in GitHub or public Firebase Hosting. Storage rules deny client access to this path. The ingestion function runs with server credentials.

Object custom metadata can include: `sourceTitle`, `publisher`, `framework`, `frameworkVersion`, `grade`, `subject`, `skillIds`, and `rights`.

## Index
Chunks are stored in `ragChunks` with source/document hashes and vector embeddings. Raw chunks are server-only. Learner clients never read them directly. Firestore vector search requires a vector index for `ragChunks.embedding` (1024 dimensions). Create the index in the Firebase/Google Cloud console or CLI before production retrieval.

Example CLI:

`gcloud firestore indexes composite create --collection-group=ragChunks --query-scope=COLLECTION --field-config field-path=embedding,vector-config='{"dimension":"1024","flat":"{}"}'`

If you use grade/subject prefilters, create the composite vector indexes Firestore requests for those filters.

## Generation guard
Retrieved chunks are evidence, not learner-facing copy. The tutor must synthesize in its own words, avoid extended quotations, avoid exposing raw chunks/system context, distinguish curriculum-grounded claims from general enrichment, and return compact source labels for auditability.

## Operational prerequisites
- Blaze billing for Cloud Storage/Functions.
- `OPENAI_API_KEY` Functions secret.
- Private Storage rules deployed.
- Firestore vector index created.
- Upload only material Funzi is authorized to store/process.
