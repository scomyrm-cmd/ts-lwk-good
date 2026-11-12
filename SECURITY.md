# Campus OS security and operation

## Administrator setup

Set `CAMPUS_ADMIN_USERNAME` and a random, unique `CAMPUS_ADMIN_SETUP_CODE` of at least 32 characters in the Vercel production environment. Redeploy so the new environment reaches the server.

Open `/admin/login`, select **Set up administrator**, and use the one-time code to choose a fresh password. Use at least 14 characters and no more than 72 UTF-8 bytes. Successful activation updates the configured administrator or creates that account, disables the other administrator logins, and revokes their sessions. It preserves existing accounts and school records. If a normal account already has the configured username, setup stops without changing either account.

Remove the setup code from Vercel after activation. To recover access again, generate a different code and redeploy. Existing administrators can change their own password from **Settings → Security**. A password change invalidates the account’s other sessions.

For owner-managed provisioning with an initial temporary password, set its bcrypt hash in `CAMPUS_ADMIN_TEMPORARY_PASSWORD_HASH` and submit it with the one-time setup code to the administrator setup endpoint. This creates the account with a mandatory password change. That session can use account and password-change endpoints. School records, AI, exports, and all administrative APIs require the password change to be completed. The new private password must meet the usual administrator policy. Reusing the consumed setup code cannot reset the account.

## Administrator profiles and contacts

Administrator identity and profile edits belong to the authenticated account. Student records have separate `guardianEmail` and `guardianPhone` fields. Older contact values are displayed through a compatibility parser and can be saved into the new fields.

## Attendance email notices

Set `EMAILJS_SERVICE_ID`, `EMAILJS_TEMPLATE_ID`, and `EMAILJS_PUBLIC_KEY` in the production environment. If EmailJS private-key authorization is enabled, also set `EMAILJS_PRIVATE_KEY`. Enable non-browser API requests in EmailJS Account → Security. The template’s To Email field must be `{{to_email}}`, its subject `{{notification_subject}}`, and its body `{{attendance_message}}`. Names, classes, dates, and school details are supplied from saved server records. The messages are in French.

Saving today’s attendance as absent or late creates a private delivery record. Current school time determines the date. A background function sends notices sequentially under a shared server lease. One saved student/date/status creates one notice. Ordinary re-saves reuse that notice. Pending notices are checked against the latest attendance before sending. Keep `EMAILJS_ALLOW_PREVIEW` unset or false on previews to isolate testing from actual mail delivery.

Set a random `CRON_SECRET` for the daily recovery invocation. Large batches continue in a fresh authenticated invocation. Failed configuration requests remain visible in Attendance → Guardian email notices. A response accepted by EmailJS is recorded as sent. A network interruption or ambiguous provider failure is recorded for review, since EmailJS’s send API does not provide an idempotency key. Check EmailJS history before retrying uncertain delivery. The server refuses student requests and arbitrary recipient addresses on the notification API.

## Server storage

Production uses the existing private `campus-os/private/state.json` Blob. Missing session, audit, and recovery fields are initialized automatically without a migration. Older cookies must be replaced by signing in again. Preview deployments use isolated paths. When configuring an integration test, set `CAMPUS_PREVIEW_NAMESPACE` only on its preview branch and check that `/api/health` reports `isolated-preview` before writing test records.

Blob writes use a conditional update tied to the version read. The dashboard checks record versions before saving. If two edits conflict, the stale write is rejected. Refresh the affected data before reapplying the edit.

Student reports start pending. Only an administrator can publish a report to the school catalog. Administrators can export a confirmed Excel file from server records. Export audits store the administrator ID, timestamp, and event type.

## Environment

- `JWT_SECRET` holds the private session signing secret. Use at least 32 random characters.
- `BLOB_READ_WRITE_TOKEN` is the private Blob token. A connected store can also use `BLOB_STORE_ID` with the Vercel-managed `VERCEL_OIDC_TOKEN`.
- `GEMINI_API_KEY` enables conversation through Gemini. `GEMINI_MODEL` overrides the default Gemini model.
- `CAMPUS_ADMIN_USERNAME` and `CAMPUS_ADMIN_SETUP_CODE` are needed when provisioning or recovering the primary administrator.
- `CAMPUS_REJECTED_ADMIN_PASSWORD_SHA256` can block known exposed passwords.
- `CAMPUS_ALLOWED_ORIGINS` optionally lists additional trusted HTTPS origins separated by commas. Same-origin requests work by default. The existing `APP_URL` is also accepted when configured.

Campus AI is administrator-only. It supplies all student fields and attendance records to the configured Gemini provider so administrators can ask questions and propose edits. It never supplies account hashes, credentials, sessions, or recovery codes. Photo scanning sends a compressed JPEG/PNG/WebP inline to Gemini; Campus OS does not persist the image. Keep secrets and unrelated personal information out of free-form prompts. Conversation history is stored privately when enabled. Voice input and read-aloud depend on browser speech support.


## Reviewed AI edits and document imports

`POST /api/admin/ai/scan` extracts Arabic/French roster or absence-sheet rows without writing records or sending email. `POST /api/admin/ai/preview` checks identities against current server records and returns a draft. Chat replies can also contain drafts. `POST /api/admin/ai/apply` requires an administrator session, explicit confirmation, allowed student/attendance fields, and matching record versions. One private Blob transaction saves the validated batch, activity/audit entries, idempotency receipt, and any eligible attendance outbox entries. Replaying the same operation does not create duplicate students or notices. Historical attendance imports do not enqueue new email notices.

Moroccan class presets cover primary years 1–6, collège years 1–3, tronc commun and bac years 1–2. Class sections and lycée branches are editable. Existing groups and records are retained. `classNumber` is a class-local roll number; `studentId` is the unique school-wide identifier. Imports without a Massar/student ID receive a deterministic `LOCAL-` identifier, never a fabricated Massar code. Ambiguous, missing or conflicting rows require correction. Extraction uses structured prompts and examples, not fine-tuning. No training dataset is collected.
