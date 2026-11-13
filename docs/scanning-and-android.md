# School document scanning and Android preparation

## Class rosters

Use **Students → Scan a school document → Student list**. Photograph the whole table and class heading. Rows stay in photographed order: first student 1, second 2, etc. For a continuation page, enter that page’s first roll number before reading it. Unreadable student rows must remain placeholders until corrected so later numbers do not shift. Check the extracted count and names against the photo before applying. Applying adds the students to the extracted class; the class becomes available in student and attendance filters automatically.

Massar IDs and class-local numbers are separate. Without Massar, a deterministic LOCAL identifier is generated. Existing names, class, Massar and roll numbers must agree; conflicts require correction, and saved guardian contacts are preserved. APIC class labels stay distinct from AC and primary AP labels.

## Weekly absence grids

Import the class roster first. Use **Attendance → Scan a school document → Weekly grid of absent numbers**. If the class cannot be read, select or type the exact saved class. Each number inside a day/lesson cell identifies an absent student in that class. Commas, spaces or hyphens separate numbers; they are not ranges. The date is taken from the row and the lesson from the column heading. Dates can also be derived from an explicit full week-start date and a clearly labeled weekday in that week.

The extractor ignores signatures, subject labels, headers, date numbers and stamps. Clearly cancelled numbers are omitted; uncertain overwritten numbers, dates and intervals require review. Blank cells never create attendance. Missing dates never default to today. A number-only scan cannot create students. Unknown numbers must be corrected or imported through a roster first.

One record per student/day is retained. `absencePeriods` stores exact lesson intervals such as `08:00-09:00`; the daily absent count means the student had an absence that day, not necessarily a whole-day absence. Repeated cells and rescans are deduplicated. Additional lessons merge with previously saved lesson absences. Existing whole-day absences are not narrowed by a scan. Other dates and unrelated students are preserved. Current-day guardian notices still use the existing outbox and daily deduplication; historical imports do not send new notices.

The existing EmailJS `attendance_date` variable includes lesson wording for a lesson absence, so older templates show the scope. `attendance_date_only` is the date without that wording; `attendance_periods` contains the lesson intervals. `attendance_message` also includes them. A notice already sent for the same student/date/status is not sent again when more lessons are imported.

## Gemini and verification

This is example-guided structured extraction, not model fine-tuning. Synthetic instructions describe the document layouts; real student photos are not embedded in code or published as examples. Photos are processed per request and are not saved by Campus OS. JPEG, PNG and WebP are resized in the browser. HEIC/HEIF up to 2.5 MB is passed to Gemini directly; some browsers cannot show a local HEIC preview.

The authenticated scan endpoint extracts a draft; preview validates identities and changes; apply atomically persists reviewed edits. Role checks, version checks and operation receipts protect against unauthorized writes, stale reviews and duplicate submissions. Automated tests cover numbering, class/roll matching, lesson merging, missing/unknown values, private persistence and email parameters using synthetic data and mocked providers. OCR accuracy on new handwriting still requires visual review.

## Web app manifest

`public/manifest.json` is served at `/manifest.json`, linked from the HTML head, and includes a stable ID, root start URL/scope, standalone display, theme/background colors and 192/512 PNG icons including an Android maskable icon. The icons reuse the existing Campus OS mark. No service worker caches student or authentication responses.

This prepares the web metadata; it does not create or sign an APK. A later Trusted Web Activity build needs an Android package ID, signing certificate and the matching Digital Asset Links file for the deployed domain. Do not publish placeholder package names or certificate fingerprints. Existing login and server persistence continue to apply in an installed web app or wrapper.
