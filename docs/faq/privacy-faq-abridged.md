# Privacy FAQ (Abridged)

Status: Public draft (H1)

What we do

- We do not collect or display personal data of children or caregivers.
- Feedback text is auto-scrubbed: emails and phone numbers are masked; Indonesian NIK is blocked.
- Event analytics exclude sensitive fields and include integrity markers only (hashes, not raw PII).

PII detection

- Patterns covered: email, phone, and NIK (Indonesia) as a starting set.
- If NIK is detected, the submission is blocked.
- If contact info is detected, it is masked in stored text.

Salt rotation

- Hashing salt for any privacy-related hashing rotates daily (automated).
- Last 14 salts are retained for short analysis windows only.

User rights

- For changes or objections on public institutional information, contact the maintainers via the repository’s issue tracker.

References

- docs/privacy/pii-pattern-library-v1.md
- docs/privacy/pii-rotation-policy.md
