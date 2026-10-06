# Tender Document Package Builder

A bilingual, browser-only workspace that helps office staff check, arrange, and combine tender documents into a correctly ordered submission PDF. Files never leave the user's browser.

**Participant:** Tanvir Ahmed Siddique  
**Registration:** 24201056

## Repository

https://github.com/tanvir-ahmed-siddique-ctrl/DEVFEST-TANVIR-AHMED-SIDDIQUE-24201056-

## Live site

GitHub Pages publishes this repository. Open it at https://tanvir-ahmed-siddique-ctrl.github.io/DEVFEST-TANVIR-AHMED-SIDDIQUE-24201056-/ after the first deployment finishes.

## 60-second judge tour

1. Select **Load sample workspace**.
2. Confirm that `company_logo.png` is rejected and both experience certificates are marked **Duplicate**.
3. Select **Apply safe suggestions**. Ambiguous Trade License and Experience candidates intentionally remain manual.
4. Match `trade_license_2026.pdf`, enter `2027-06-30`, and match one experience certificate.
5. Match `scan_0042.pdf` to Signed Declaration and enter `2026-12-31` for Bank Solvency.
6. Switch to বাংলা and verify that labels, statuses, errors, and blocker explanations change language.
7. Generate and download `T-2026-0417_Package.pdf`.

## Completed main features

- Validated `requirements.json` loading with stable ordering by the `order` field.
- Multi-PDF upload, page counts, thumbnails, removal, and clear rejection messages.
- SHA-256 exact-content duplicate detection, independent of file names.
- One-to-one file matching with duplicate cross-match prevention and undo/change support.
- Immediate `Missing`, `Expiry date needed`, `Expired`, `Not provided`, and `OK` statuses.
- Deadline-boundary correctness: expiry on the deadline is valid.
- Generate button blockers with requirement-specific reasons.
- English cover, original document page order, and a reserved footer strip on every page.
- Complete Bangla/English application interface, including errors and statuses.
- Responsive layout and reduced-motion support.
- Safe handling of non-PDF, damaged, and password-protected input.

## Bonus features

- Page thumbnails, including image-only scans.
- Filename-based auto-match suggestions that refuse ambiguous matches.
- Built-in sample workspace for quick judging.

## Sample output

The repository includes [`output/T-2026-0417_Package.pdf`](output/T-2026-0417_Package.pdf), generated from the corrected sample selection. Without an optional index page it has 16 pages, ordered by requirement rather than filename.

![Document status workspace](screenshots/document-statuses.png)

## Run locally

Requirements: Node.js 22+ and pnpm 11+.

```bash
pnpm install
pnpm dev
```

Verification:

```bash
pnpm test
pnpm build
pnpm generate:sample
```

## Architecture

- React + TypeScript + Vite
- `pdfjs-dist` for safe browser-side inspection, page counts, and thumbnails
- Web Crypto SHA-256 for exact duplicate detection
- `pdf-lib` for the cover, ordered merge, reserved footer strip, and download
- Vitest for compliance and edge-case tests

Core rule evaluation is isolated from React in `src/engine/compliance.ts`. Display strings are translated only in the UI layer, so status behavior remains identical in both languages.

## Known limitations

- The generated cover is English as required. Bangla cover text is not included.
- Optional index, signature placement, CSV export, and project save/reopen are not included.
- The live site appears after GitHub Pages finishes the first deployment.

## AI use

Cursor was used for requirements analysis, implementation, testing, PDF generation, and documentation. The main implementation prompt was: “Build a browser-only bilingual desk that checks tender PDFs for expiry and duplicates, then generates one correctly ordered package with an English cover and a footer on every page.”

All document processing is deterministic and works without an AI service or API key.

