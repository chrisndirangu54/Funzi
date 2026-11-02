# Funzi Home Learning: global curricula with a Kenyan context

**Implementation stage: curriculum reference catalog, parent-managed weekly planning and learning journal. Not an accredited homeschooling school, an authorized awarding centre, a complete official syllabus, or proof of compliance with Kenyan education law.**

## Curriculum families (source-backed reference metadata)

The `src/homeschoolCatalog.ts` register currently lists 16 distinct pathways or pedagogies: Kenya CBE/CBC, legacy 8-4-4 revision, United States K–12 (Common Core Math/ELA with NGSS as separate science reference), US AP enrichment, Chinese 2022 Grades 1–9 compulsory education, England national curriculum, Cambridge International, Pearson Edexcel International, IB study support, India CBSE, South Africa CAPS, Singapore MOE, Australian Curriculum v9, Canada/Ontario, Montessori-inspired and Waldorf-inspired home education.

The register contains named stages, broad subject categories, preferred teaching languages, source publishers, an official reference URL, and specific qualification limitations. This is an **extensible directory**, not a claim that all syllabuses and validated grade-level outcomes have been loaded. Additional curricula can be onboarded after source review; China Grade 10–12 is not misrepresented as covered by its 2022 *compulsory* standards.

### Provenance and international educational boundaries

- **Kenya:** [KICD CBC/CBE designs](https://kicd.ac.ke/cbc-materials/), covering PP1/PP2, Grades 1–9 and Grade 10–12 pathway references. Stage options include STEM, Social Sciences and Arts/Sports for the senior years.
- **USA:** [Common Core](https://corestandards.org/) is a state-adopted math/ELA framework, not a universal US national syllabus; [NGSS](https://www.nextgenscience.org/) covers science reference standards. Specific state frameworks, diploma conditions and course content must be verified separately.
- **China:** [MOE 2022 Grades 1–9 compulsory-education standards](https://www.moe.gov.cn/srcsite/A26/s8001/202204/t20220420_619921.html), with subject references in Chinese, maths, science, languages, history, information technology, physical education, art and labour education.
- **UK/international:** [England National Curriculum](https://www.gov.uk/national-curriculum/overview), [Cambridge](https://www.cambridgeinternational.org/), [Pearson Edexcel](https://qualifications.pearson.com/en/qualifications/edexcel-international-gcses.a-z.html), and [IB](https://www.ibo.org/programmes/) have different awarding rules.
- **India, South Africa and other reference families:** use publisher URLs in the register and require version-specific syllabuses before any official alignment claim.
- **Alternative learning:** Montessori/Waldorf are teaching pedagogies, not a national examination board or automatic qualification.

IB diplomas require enrollment in authorized IB World Schools and cannot be issued by Funzi. Cambridge, Pearson, AP and KNEC qualifications have their own external exam policies; families must check the eligible exam center, assessment arrangements, age conditions and recognition.

## Kenyan homeschool legal positioning (important)

As of the last reviewed Kenya Law sources, **section 30** of Kenya's Basic Education Act places an obligation on parents to ensure their children attend school or another institution authorized and prescribed by the Cabinet Secretary, and **section 31** addresses admission to basic education institutions. The 2023 High Court case *Were & another v Cabinet Secretary, Ministry of Education & 2 others* discusses the lack of an automatic right to replace registered schooling with homeschooling and the need for minimum national education standards. See:
- [Kenya Law: Basic Education Act, Cap. 211](https://new.kenyalaw.org/akn/ke/act/2013/14/eng@2022-12-31)
- [Kenya Law case summary](https://www.kenyalaw.org/kl/index.php?id=11967)

**Funzi must not assert that using its plans alone satisfies compulsory school attendance or that a child can withdraw from an approved school.** Before recommending home education *as a replacement*, families should obtain specific, current guidance from Kenya's Ministry/County education authorities and qualified Kenyan legal counsel. Funzi is presently safe to position as an at-home educational supplement and organizational tool.

## Feature boundaries and authorization

- The **Homeschool** tab lets an email-verified, signed-in adult self-attest and set up up to 8 family learner *aliases*. No child's legal name, birth certificate, ID number or health records are requested. Guardianship is **self-attested, not independently verified**. Never share an adult's login with a child.
- Adults select a primary curriculum, stage, 1–12 subjects, up to 3 alternative curriculum comparisons, learning languages, 1–6 study days/week, daily minutes and a 4–24 week term.
- `buildHomeWeek` deterministically rotates selected subject areas with optional Kenya-specific learning (roughly 20% of selected daily minutes); Kenya layer features KES financial literacy, Kiswahili, local geography/environment, civic knowledge, agriculture, computer literacy and community engagement. This is **an optional enrichment allocation**, not an official compulsory Kenyan timetable.
- A parent may ask the existing moderated **Funzi AI Tutor** to propose a Socratic activity using examples from Kenya. Generated text is for parent review; it is not officially mapped to any unreviewed standard and does not claim AI can grade or certify progress.
- Household lesson logs, observations, subjects, date, duration and optional self-reported scores are stored in private Firestore subcollections, read/written only by authenticated Cloud Functions. `getHomeschoolReport` returns at most 200 most recent records with a truncation flag and an explicit guardian-reported provenance label.
- The cross-curriculum comparison currently compares **subject names** only. It must never be treated as level-by-level grade equivalency, transfer-credit proof or an exam eligibility guarantee.

## Production improvements required

1. Import versioned, licensed curriculum outcomes from each official standard and review them with independent educators before publishing claims of objective-level standards alignment.
2. Build an expert-reviewed **crosswalk** through a competency graph, subject prerequisites and comparable assessment objectives with explicit source/version/confidence and human signoff (e.g. CBC Grade 8 mathematics ↔ US Grade 8 CCSS ↔ China Grade 8 mathematics, where appropriate), rather than naïve grade correspondence.
3. Add diagnostic assessment, error analysis, remedial sequencing, literacy level, SEN/accessibility support, learner-specific outcome mastery and verified teacher review; perform localization checks by bilingual educators.
4. Build opt-in authenticated child accounts, separate verified guardian identities, school links, family membership approvals and privacy-compliant data access, rather than shared login credentials.
5. Integrate schoolwork from the separately scoped TeknTandao Workspace link once the tutoring-school PR is merged and secured. Never copy unrelated school roster, attendance or billing information.
6. Add teacher/tutor scheduling and supervised classes subject to safeguarding verification, then secure payment and exam enrollment arrangements.
7. Add low-bandwidth/offline packages with verified redistribution rights, physical-learning lesson aids, home safety prompts, parent wellness support and accessible formats.
8. Independent QA: emulator access tests, curriculum-version tests, security review, consent/retention policy and professional legal/regulatory review.

## Deployment

From the Funzi repository, configure Firebase Authentication and **App Check** and deploy its Firestore rules and Cloud Functions. Run `npm run build`, `npm --prefix functions run build`, `npm test`, and emulator tests before deployment.

For minors, rely on actual parental verification and policies before introducing separate child accounts, live sessions or revealing personally identifiable educational data. Curriculum sources are references only; redistribution and official trademark/endorsement rights must be checked before production ingestion.
