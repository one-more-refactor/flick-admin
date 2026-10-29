## 2025-03-03 - [Robust Client-Side URL Protocol Validation for XSS Prevention]
**Vulnerability:** String prefix checks (e.g. `startsWith('javascript:')`) for validating URL links can be bypassed or misclassify input when control characters (`\x00-\x1F`, `\x7F`) or unexpected relative link formats (e.g. `//`) are supplied.
**Learning:** String prefix checks fail to match standard browser URL parsing and resolution semantics.
**Prevention:** Strip ASCII control characters and null bytes (`/[\x00-\x1F\x7F]/g`) and parse using standard `new URL(sanitized, origin)` constructor while enforcing strict protocol and relative path boundaries.

## 2025-03-01 - [Nginx Header Inheritance and Missing Content Security Policy]
**Vulnerability:** Nginx configuration did not have a Content Security Policy (CSP). Additionally, Nginx does not inherit `add_header` directives into nested locations that define their own headers, creating a risk of missing security headers on custom route handlers or static asset locations if they are not explicitly repeated.
**Learning:** Whenever an `add_header` is declared within a `location` block in Nginx, any outer `add_header` directives (such as those in the `server` block) are not inherited.
**Prevention:** Always repeat security headers (or use custom include blocks) inside each Nginx `location` block that specifies any custom headers. Additionally, implement a strict CSP that restricts script and style sources to prevent XSS.

## 2025-02-13 - Active Session Expiration Not Enforced Dynamically
**Vulnerability:** Sessions with an `expires_at` timestamp were only checked and discarded upon initial page reload/boot. Active users could remain logged in and interact with the panel indefinitely beyond the session's official expiration time without being logged out, unless they reloaded the page.
**Learning:** Checking the session expiration during the boot sequence ensures persistent state safety but neglects dynamic active session state changes.
**Prevention:** Set up active timer-based monitors (reactive Svelte `$effect` with `setTimeout` or similar schedulers) that trigger automatic client-side logout as soon as the session's expiration time passes.
