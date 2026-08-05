## 2025-03-02 - [Resource ID Unescaped in API Endpoint Construction]
**Vulnerability:** Dynamic resource IDs (`r.id`) were concatenated raw into API URLs inside action hooks (such as user patch/delete and event deletion) without proper URL encoding, leading to potential path traversal and API endpoint hijacking.
**Learning:** Concatenating raw database IDs or identifiers into URLs on the client-side allows malicious users with control over those fields or input identifiers to manipulate the path segments of the targeted endpoint, potentially hitting unauthorized APIs.
**Prevention:** Always wrap dynamic resource identifiers and custom URL path parameters with `encodeURIComponent` to force them to remain within a single path segment boundaries.

## 2025-03-01 - [Nginx Header Inheritance and Missing Content Security Policy]
**Vulnerability:** Nginx configuration did not have a Content Security Policy (CSP). Additionally, Nginx does not inherit `add_header` directives into nested locations that define their own headers, creating a risk of missing security headers on custom route handlers or static asset locations if they are not explicitly repeated.
**Learning:** Whenever an `add_header` is declared within a `location` block in Nginx, any outer `add_header` directives (such as those in the `server` block) are not inherited.
**Prevention:** Always repeat security headers (or use custom include blocks) inside each Nginx `location` block that specifies any custom headers. Additionally, implement a strict CSP that restricts script and style sources to prevent XSS.

## 2025-02-13 - Active Session Expiration Not Enforced Dynamically
**Vulnerability:** Sessions with an `expires_at` timestamp were only checked and discarded upon initial page reload/boot. Active users could remain logged in and interact with the panel indefinitely beyond the session's official expiration time without being logged out, unless they reloaded the page.
**Learning:** Checking the session expiration during the boot sequence ensures persistent state safety but neglects dynamic active session state changes.
**Prevention:** Set up active timer-based monitors (reactive Svelte `$effect` with `setTimeout` or similar schedulers) that trigger automatic client-side logout as soon as the session's expiration time passes.
