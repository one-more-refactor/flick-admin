## 2025-03-01 - [Nginx Header Inheritance and Missing Content Security Policy]
**Vulnerability:** Nginx configuration did not have a Content Security Policy (CSP). Additionally, Nginx does not inherit `add_header` directives into nested locations that define their own headers, creating a risk of missing security headers on custom route handlers or static asset locations if they are not explicitly repeated.
**Learning:** Whenever an `add_header` is declared within a `location` block in Nginx, any outer `add_header` directives (such as those in the `server` block) are not inherited.
**Prevention:** Always repeat security headers (or use custom include blocks) inside each Nginx `location` block that specifies any custom headers. Additionally, implement a strict CSP that restricts script and style sources to prevent XSS.

## 2026-07-29 - [API Path Traversal and Parameter Manipulation via Resource ID Interpolation]
**Vulnerability:** Resource IDs (such as user and event IDs) were interpolated directly into backend fetch request URLs (e.g., `/api/admin/users/${r.id}`). If an attacker could control or manipulate their own resource ID, they could perform directory traversal attacks (e.g., using `../../session` as ID) and target unauthorized API endpoints.
**Learning:** Dynamic route segments on client-side API requests must be properly encoded. Direct interpolation of variables without encoding can lead to URL structure bypasses or request hijacking.
**Prevention:** Always wrap path parameters / resource IDs in `encodeURIComponent()` when constructing API request paths dynamically on the client-side.
