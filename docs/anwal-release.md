# Anwal Digital release — 26 November 2026

## Implemented

- New institutional/editorial public website with navy, green, muted gold and off-white colors; Plus Jakarta Sans and Cairo; responsive navigation, dark mode, Arabic RTL and French/English interfaces.
- Published content collections for news, journal, announcements, events, clubs, video, audio, photos/albums, school pages/staff and educational resources.
- Search, category/month archive filters, Moroccan grade and subject filters, publication detail pages, related articles, copy-link sharing, calendar grouping, album photo viewer, YouTube privacy embeds and native audio controls.
- Separate private CMS with draft/submission/review/scheduled/publication/archive/rejection states, translations, formatting controls, preview, revision history, optimistic concurrency and audit events.
- Server-managed editorial roles separate from existing school access, controlled private media uploads and public media delivery, consent checks and image metadata removal.
- Public AI with published context only; editorial AI produces drafts, translations and summaries for review.
- School building photo crop with attribution and link to the original press report. No identifiable pupils are distributed in the new asset.
- Existing student records, attendance, EmailJS notices, Lost & Found, administrative AI, scanning, Excel export, accounts and session handling retained.
- Code splitting for the private workspace and CMS, updated PWA metadata, public robots/sitemap, CSP for approved video embeds, and noindex headers for private frontend routes.
- Removed a pre-existing publicly served screenshot containing account credentials; repository history is not rewritten. If those old credentials were real and remain in use, their owner should replace them.

## Data changes

Adds `cms.json` and private media objects to the existing environment-scoped Blob storage. No account or student schema migration, deletion, reset, or production test data insertion. School administrators are responsible for confirming public content and official-site authorization. The independent demonstration label is enabled by default.

## Validation

Type checking and production compilation are run using the npm lockfile. Existing automated tests cover school authorization, session rotation, student changes, scanning, exports, private persistence and email deduplication. An added integration test covers editorial permissions, own-draft submission, restricted publication, public draft isolation, scheduling/expiry, XSS handling, version conflicts and spoofed media rejection. Deployment and browser verification are recorded in the delivery response.

## Practical limits

School-specific information and additional authorized media are intentionally empty until supplied. This release provides simple Markdown formatting rather than a full WYSIWYG editor. Uploads are limited to 2.5 MB. Radio is on demand, the calendar groups dated events, and the virtual tour uses approved pages/photos. Existing school-admin account permissions are preserved; editorial roles provide no new access to private school records. Static sitemap entries cover sections; article-level SEO is client-rendered. The original school's real credentials and production records are not used for testing.
