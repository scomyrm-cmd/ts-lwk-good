# Anwal documented-content release

The public website reads its content from `/api/public/site`, which projects the private editorial CMS. The research import adds 45 managed records to that CMS on its first read after this release: 14 news stories, one archived announcement, 12 achievements, 15 gallery collections and two school-focused videos. One school-identity page is included in the 45 records. Existing custom records, uploads and editorial roles are retained.

## Evidence and media decisions

- The complete supplied dossier is in `report.md`.
- `media-review.md` records all 33 source records, every P01–P63 image decision and each V01–V11 video decision.
- `/research/source-inventory.json` is the downloadable public register, also exposed through `/sources`.
- Thirty-three valid images were visually reviewed; 30 references were unavailable or returned non-image pages. No additional exact image duplicates were found. The recorded collages and overlapping images are labelled.
- No publisher photo republication permission was established. The 63 image references therefore lead to the original credited galleries. The old unlicensed facade crop and its default CMS record are withdrawn. Custom uploaded images are retained.
- Gallery thumbnails and the native, keyboard-accessible lightbox display approved CMS uploads when available. External collections use clearly labelled, self-authored category artwork and an original-gallery link; they do not masquerade as school photographs or hotlink publisher images.
- Both school-focused videos reported `OK` and `playableInEmbed=true` in the platform player metadata. No YouTube player, thumbnail or video file loads before interaction; a direct watch link remains available.
- V03–V07 are retained as shared regional-reception references; V08–V09 show another school’s performances; V10 concerns unrelated football; V11 is unavailable and the original embed has a malformed suffix. These nine are not embedded as Anwal footage.

## Accuracy

The journalism workshop has no assigned event date. The 2026 awards retain the school year and source publication date; no exact ceremony day is inferred. December 2019 cross-country results remain achievements of 2019, even when the source was published in January 2020. The official pioneer list is the 2026 edition, code 26225E, entry 412, page 19; it does not establish an original label-award year. The recovered Anwar Press corroborating report was published on 30 December 2019 (S13), distinct from S12’s 4 January 2020 date.

The 2017 source confirms four Anwal participants and aggregate Moroccan team medals; its retrieved text does not establish each Anwal pupil’s medal. The national-team title remains attributed to Morocco. Provincial programme totals, the hospital caravan totals, the Elhri robotics prize, another school’s theatre prize and unrelated football results are not presented as Anwal achievements or enrolment.

The visual-arts article S32 was recovered during this audit: its publication is 10 June 2022; no complete event date is assigned. The BioRender item remains an archived announcement, with delivery unconfirmed.

## Editing and storage

The import is versioned in `src/content/researchSeed.ts`. It uses the existing optimistic Blob update and existing preview namespace isolation. It only changes the editorial CMS document, never the private school-state document. The import is idempotent and does not republish an entry subsequently archived by an administrator. Existing IDs or slugs take precedence over imported records.

Researched entries can be edited only by an existing administrator. Existing editorial permissions for other content remain in place. Source/date metadata is preserved from the reviewed record and cannot be replaced by a client payload. Text, publication status, approved uploaded images and ordinary content fields remain editable through the CMS. A future provenance correction should use an explicit reviewed migration.

## Re-running the research audit

Keep downloads and contact sheets outside the repository. The following commands use the standard Python library and the project’s existing Sharp package:

```sh
python scripts/audit-research.py /tmp/anwal-audit
node scripts/review-research-images.mjs /tmp/anwal-audit --contact-sheets
python scripts/review-research-videos.py /tmp/anwal-audit
python scripts/build-research-content.py
python scripts/build-source-inventory.py /tmp/anwal-audit
npm run lint
npm test
npm run build
```

Inspect the source pages and generated contact sheets before accepting a newly generated audit. HTTP 200 alone is not proof of an image, a usable video or republication permission. Editorial classifications and the source publication-date table are deliberate review decisions.

## Automated validation

TypeScript, the production build and 31 tests pass. Added coverage checks dossier completeness, safe external-media decisions, event-date uncertainty, competition outcomes, idempotent import, preservation of custom CMS data and administrator-only research edits. Existing authentication, school-record, attendance, export, scanning, AI privacy and editorial tests remain included.
