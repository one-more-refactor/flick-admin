## 2026-07-28 - [Nginx Header Inheritance and CSP]
**Vulnerability:** Lack of Content-Security-Policy (CSP) headers across pages, risking Cross-Site Scripting (XSS), Clickjacking, and other injection attacks.
**Learning:** In Nginx, the `add_header` directive does not inherit from parent blocks (e.g., server) into child blocks (e.g., locations) that define their own `add_header` directives. Therefore, security headers like CSP must be explicitly repeated in all location blocks that override headers (like `/assets/` or `/`).
**Prevention:** Always verify that newly added security headers are either explicitly declared in every location block that uses `add_header`, or move all header definitions strictly inside location blocks to prevent incomplete inheritance.
