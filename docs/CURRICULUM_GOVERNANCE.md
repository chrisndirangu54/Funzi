# Curriculum governance

Funzi distinguishes three states: **reference**, **validated**, and **published**.

An official URL is only a reference. It does not grant permission to reproduce its text. A dataset becomes validated only after source integrity, provenance, structural mapping and rights status are checked. Publication to learner-facing retrieval requires a human curriculum reviewer.

## Required provenance

Every source-backed node stores publisher, source title, source URL/locator where available, document/framework version, import ID, and timestamps. The import manifest additionally stores the source SHA-256 and reviewer decision.

## Change management

Never overwrite historical framework meaning silently. A changed official design gets a new framework/document version. Stable semantic IDs may remain linked through EXTENDS/RELATED_TO edges. Learner evidence should retain the curriculum version against which it was collected.

## AI boundary

LLMs may propose mappings, aliases, prerequisite candidates and micro-skill decompositions. These proposals must remain candidate data until reviewed. They may not convert themselves into official KICD outcomes or claim KICD provenance.
