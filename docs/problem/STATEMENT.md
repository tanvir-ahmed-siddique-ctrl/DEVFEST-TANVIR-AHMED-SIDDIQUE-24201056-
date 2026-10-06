# Problem Statement

- Source: `AIDevFest-ViveCoding_ProblemStatement.pdf`
- Original, byte-identical PDF: `samples/AIDevFest-ViveCoding_ProblemStatement.pdf`
- Title: Tender Document Package Builder
- Build window stated in the source: 90 minutes

The original PDF is the authoritative verbatim statement. This working transcription records its checkable requirements.

## Required workflow

1. Load `requirements.json` and show tender details and requirements sorted by `order`.
2. Upload multiple PDF files, show file name and page count, reject non-PDF input clearly, and allow removal.
3. Match files one-to-one with requirements and allow matches to be changed or undone.
4. Request an expiry date when a matched requirement has `has_expiry: true`.
5. Recompute and show exactly one status for every requirement after every change.
6. Detect byte-identical uploaded files even when their names differ and prevent them being matched to different requirements.
7. Disable Generate while any requirement has a blocking status and explain the blockers.
8. Download the result as `<tender_id>_Package.pdf`.
9. Provide a complete Bangla/English interface and use the matching `title_bn` or `title_en` value.

## Exact English statuses

| Status | Rule | Blocking |
|---|---|---|
| `Missing` | Mandatory requirement without a matched file | Yes |
| `Expiry date needed` | Expiry-bearing matched requirement without an expiry date | Yes |
| `Expired` | Expiry date is before the submission deadline | Yes |
| `Not provided` | Optional requirement without a matched file | No |
| `OK` | File matched and any required expiry date is on/after the deadline | No |

An expiry date equal to the submission deadline is `OK`.

## Package rules

- Page 1 is an English cover showing tender ID, title, procuring entity, bidder, submission deadline, package creation date, and included documents in order.
- Source documents follow in requirement `order`; all source pages remain in their original order. Unmatched optional requirements are skipped.
- Every page has a readable, non-overlapping footer: `<tender_id> | Page X of Y`.
- Processing is entirely in the browser.
- Accept at most 30 files and 50 MB total.
- Target the latest Google Chrome.

## Required repository deliverables

- `output/<tender_id>_Package.pdf` generated from the corrected sample pack.
- `screenshots/` with at least one screenshot showing document statuses.
- Public repository and public HTTPS deployment, plus rulebook-required README and MIT license.

## Optional bonuses

Index page; seal/signature placement; CSV/Excel checklist; save/reopen; Bangla cover/index; filename auto-match; safe damaged/encrypted PDF handling; optional user-key AI assistance.
