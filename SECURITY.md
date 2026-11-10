# Campus OS security and operation

## Administrator setup

Set `CAMPUS_ADMIN_USERNAME` and a random, unique `CAMPUS_ADMIN_SETUP_CODE` of at least 32 characters in the Vercel production environment. Redeploy so the new environment reaches the server.

Open `/admin/login`, select **Set up administrator**, and use the one-time code to choose a fresh password. Use at least 14 characters and no more than 72 UTF-8 bytes. Successful activation updates the configured administrator or creates that account, disables the other administrator logins, and revokes their sessions. It preserves existing accounts and school records. If a normal account already has the configured username, setup stops without changing either account.

Remove the setup code from Vercel after activation. To recover access again, generate a different code and redeploy. Existing administrators can change their own password from **Settings → Security**. A password change invalidates the account’s other sessions.

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

Campus AI reads the roster and attendance on the server. It keeps exact identity and contact fields out of the model’s school-data context and redacts known identifiers from chat turns. Keep secrets and unrelated personal information out of free-form prompts. Conversation history is stored privately when enabled. Voice input and read-aloud depend on browser speech support.
