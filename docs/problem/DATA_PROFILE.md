# Sample Data Profile

## `requirements.json`

- One tender with ID `T-2026-0417` and deadline `2026-10-20`.
- Ten requirements, IDs R01-R10, already ordered 1-10.
- Eight mandatory requirements and two optional requirements (R06, R07).
- Three requirements declare expiry handling (R01, R04, R07).

## Documents

| File | Pages | Observation |
|---|---:|---|
| `trade_license_2025.pdf` | 1 | Expired 2025-06-30 |
| `trade_license_2026.pdf` | 1 | Valid through 2027-06-30 |
| `03_tin_certificate.pdf` | 1 | No expiry |
| `04_vat_certificate.pdf` | 1 | No expiry |
| `bank_solvency.pdf` | 1 | Valid through 2026-12-31 |
| `experience_cert.pdf` | 2 | Same bytes as `experience_cert (1).pdf` |
| `experience_cert (1).pdf` | 2 | Exact duplicate |
| `02_technical_proposal.pdf` | 6 | Requirement R08/order 8 |
| `01_financial_proposal.pdf` | 2 | Requirement R09/order 9; filename prefix is not package order |
| `scan_0042.pdf` | 1 | Image-only signed declaration; no extractable text |
| `company_logo.png` | n/a | Non-PDF; must be rejected if selected as a document |

## Rules not exercised by the sample

- Expiry exactly equal to the submission deadline.
- Damaged and password-protected PDFs.
- Empty requirement list, invalid JSON, duplicate requirement IDs/orders, and malformed dates.
- The 30-file and 50 MB boundaries.
- Mixed page rotations and unusual page sizes.
