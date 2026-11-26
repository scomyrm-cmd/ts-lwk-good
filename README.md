# Anwal Digital · Campus OS

Public school website and editorial platform for Collège Anwal, Khénifra, built around the existing Campus OS school workspace. French is the default interface language; Arabic uses RTL and English is also available.

The site identifies itself as an **independent demonstration** until a school administrator records official authorization in the site settings. School history, staff, contact details, clubs, achievements and events must be entered by authorized staff; no fictional school data is seeded.

## Run and verify

Node 24 or newer and npm are required. The npm lockfile is authoritative.

```sh
npm ci
npm run lint
npm test
npm run build
npm run dev -- --host 127.0.0.1
```

Vite serves frontend assets. API functions run on Vercel. Configure the names in `.env.example` privately in Vercel. The existing private Blob store, accounts, session secret, Gemini key and EmailJS configuration are reused. No credential reset is required by this update.

## Public website

`/` presents the school identity, notices, news, editorial channels, events, clubs, gallery, resources and links to school services. Public collections include `/about`, `/news`, `/journal`, `/school-life`, `/clubs`, `/tv`, `/radio`, `/podcasts`, `/gallery`, `/science`, `/sports`, `/culture`, `/environment`, `/events`, `/resources`, `/virtual-tour` and `/contact`.

A publication has a stable URL such as `/journal/my-article`. Each translation can be edited independently. If a translation is missing, the available content is shown; interface labels remain in the selected language. Empty collections explicitly say that approved content has not yet been published.

## Publishing

1. Sign in at `/admin/login` with an existing administrator account.
2. Open **Gestion des publications** in the sidebar, or visit `/editor`.
3. Choose a collection and create a draft. Enter the French, Arabic and English texts as available, a unique URL slug, category and approved public author signature.
4. Add an uploaded image, audio episode or PDF. Videos use YouTube links. Files are limited to 2.5 MB after image optimization. Images are converted to WebP and re-encoded server-side without EXIF metadata.
5. Preview the content. The text editor supports headings, bold text and lists. Campus AI can propose text, translations or summaries; its output remains an unsaved draft for human review.
6. Confirm publication rights, school authorization and consent for identifiable people before publishing. Scheduled items become visible when their publication time arrives. Expired and archived items remain private.

Teachers and student journalists can save drafts and submit their own work. Editors and website administrators can review and publish. These editorial permissions do **not** grant access to student records. Existing Campus OS administrators retain their school management access.

The site settings editor manages the hero, introduction, translations, contact details, official status and navigation visibility. Create school presentation pages for history, facilities, regulations, principal's message and other approved information; the same workflow manages staff profiles, clubs, events, resources, albums and announcements. Categories are entered per item and become available in public filters.

All writes use an optimistic version check. If another device saves first, refresh before retrying. Previous item versions can be restored as drafts. Publication actions and role changes appear in the editorial audit log.

## Data and privacy

The existing `state.json` school records and accounts are preserved. Editorial content uses a new private `cms.json` object in the same environment-specific storage namespace, with private files under `media/`. The new object is initialized lazily; no destructive migration or student import is performed.

The public API returns only visible published/scheduled content and public site settings. It excludes draft content, internal owner IDs, revisions, roles, school records and parent contacts. Media is served only when attached to a visible publication/hero or requested by an authorized contributor. Private APIs continue to validate cookie sessions on the server. Public AI receives only published titles, summaries and site information and has no write tools.

Language/theme preferences are the only new values stored in localStorage. No school data, passwords or permissions are stored there. No service worker caches private records.

## Photograph and references

`public/images/anwal-facade.webp` is a small architectural crop from Al3omk's report dated 28 March 2022:
https://al3omk.com/735370.html

The crop shows the building only; the identifiable pupils in the original are excluded. It is credited and linked on the homepage and in the gallery. The original full image is not distributed with the project. The photograph documents a detail from 2022, not the school's present condition or a complete campus view. Replace or remove it through editorial management if needed.

Structure was informed by the school presentation, journalism, television and radio sections at the user-provided examples:
- https://elhassanedakhil.wixsite.com/clubmedia
- https://college-fetouaki.webnode.fr/
- https://collegebabi.kesug.com/ (unavailable during this work)

No reference-site branding or articles were copied.

## Deployment and limits

The existing Vite project on Vercel is used. `vercel.json` routes public/private frontend pages to the SPA and API paths to the existing server function. CSP allows only the privacy-enhanced YouTube player for embedded video. Existing deployment protection remains in force.

The sitemap contains public section URLs; publication-specific metadata is applied in the browser. Full server-rendered article metadata and automatic article sitemap entries are future SEO improvements. Audio/file uploads are intended for short episodes and small worksheets; large recordings need a dedicated upload/storage workflow. There is no streaming radio service or 360° tour engine: the radio supports on-demand episodes, and the tour section displays approved photo/page content. Unpublished school information and media must be supplied by the school.
