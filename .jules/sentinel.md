## 2025-03-05 - [Unencoded Dynamic Resource IDs in API Request Paths]
**Vulnerability:** Resource IDs (e.g., `r.id`) were interpolated directly into backend API routes (like `/api/admin/users/${r.id}`) without URI encoding. This leaves the system open to API route manipulation, request parameter injection, or path traversal if an operator or malicious identity creates or controls a resource with special characters (like `../`, `?`, or `#`).
**Learning:** Even internal admin identifiers, if generated or supplied dynamically, can contain special URI characters (e.g., mail addresses, custom slugs, or escaped IDs) that alter the structure of REST API calls.
**Prevention:** Always wrap dynamic resource IDs in `encodeURIComponent()` when constructing API endpoints dynamically in paths to prevent path traversal and API route manipulation.

## 2025-03-01 - [Nginx Header Inheritance and Missing Content Security Policy]
**Vulnerability:** Nginx configuration did not have a Content Security Policy (CSP). Additionally, Nginx does not inherit `add_header` directives into nested locations that define their own headers, creating a risk of missing security headers on custom route handlers or static asset locations if they are not explicitly repeated.
**Learning:** Whenever an `add_header` is declared within a `location` block in Nginx, any outer `add_header` directives (such as those in the `server` block) are not inherited.
**Prevention:** Always repeat security headers (or use custom include blocks) inside each Nginx `location` block that specifies any custom headers. Additionally, implement a strict CSP that restricts script and style sources to prevent XSS.

## 2025-02-13 - Active Session Expiration Not Enforced Dynamically
**Vulnerability:** Sessions with an `expires_at` timestamp were only checked and discarded upon initial page reload/boot. Active users could remain logged in and interact with the panel indefinitely beyond the session's official expiration time without being logged out, unless they reloaded the page.
**Learning:** Checking the session expiration during the boot sequence ensures persistent state safety but neglects dynamic active session state changes.
**Prevention:** Set up active timer-based monitors (reactive Svelte `$effect` with `setTimeout` or similar schedulers) that trigger automatic client-side logout as soon as the session's expiration time passes.
