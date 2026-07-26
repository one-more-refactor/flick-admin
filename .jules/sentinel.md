## 2025-03-05 - Stored XSS via Announcement Link
**Vulnerability:** The announcement link configuration allowed any arbitrary URL string, including dangerous protocol handlers such as `javascript:` or `data:`. If an administrator published an announcement with a malicious URL, users on the main site clicking the link would execute arbitrary JavaScript, leading to Stored Cross-Site Scripting (XSS).
**Learning:** Input fields meant for links must not be trusted blindly even if configured by administrators (principle of least privilege, defense in depth). Validation should occur both on the client/frontend config and the backend API.
**Prevention:** Validate all links/URLs against a safe protocol whitelist (e.g., matching `/^(https?:\/\/|\/)/i`) before saving.
