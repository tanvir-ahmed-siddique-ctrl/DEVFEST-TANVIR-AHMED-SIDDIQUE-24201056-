# Build Log

## Requirements and sample pack

- Prompt: "Read the tender statement and keep the sample pack unchanged. Record every required status, the package order, and the checks a later unseen pack must still pass."
- Changed: saved the statement, the sample requirements, and a ledger of the mandatory rules.
- Verified: the copied requirements file matches the supplied file byte for byte. The two experience certificates share one SHA-256 digest.

## Package rules

- Prompt: "Implement the status rules, one-to-one matching, and exact duplicate check as pure functions, with tests for the deadline boundary and for files that must not block an optional gap."
- Changed: compliance engine and the automated test suite.
- Verified: missing, expiry-needed, expired, not-provided, and OK each map to the statement. A document that expires on the deadline stays valid.

## Workspace and package PDF

- Prompt: "Build a browser-only bilingual desk. Load the requirements, inspect uploaded PDFs, stop a duplicate from being matched twice, and generate one English cover plus the documents in tender order, with a readable footer that does not cover the page."
- Changed: the office workspace, page counts, previews, rejection of files that are not usable PDFs, and the package generator.
- Verified: the sample selection produces `T-2026-0417_Package.pdf` with 16 pages and the footer `T-2026-0417 | Page X of 16` on every page.

## Publish

- Prompt: "Prepare a reproducible public release with the required participant details, verified sample output, and concise setup instructions."
- Changed: participant README, license, sample package, and status screenshot.
- Verified: tests and the production build are the gate for this tree.

## Optional checklist tools

- Prompt: "Add an optional index page, a CSV checklist, browser save and reopen, and a PNG seal only on the pages the user chooses. Keep the default package at 16 pages with an English cover, and add Bangla titles on that cover only when the browser can draw them. Add a small helper that answers from the open tender and reads matched files only after permission. The helper must never be required to generate the package."
- Changed: package options, checklist export, local save and reopen, and the desk helper.
- Verified: 18 tests pass, including the 16-page default and the CSV columns.

## Desk helper and static hosting

- Prompt: "Attach the character to the helper. On the answer button, retrieve notes from the open tender and, only if the user typed a Gemini key, ask the model with those notes. Keep every document check in the browser. Double-click a row to clear a wrong match. Serve the built site as static files."
- Changed: helper retrieval, optional key field, character on the helper button, drag-and-drop, a static container file, and the Vercel project file.
- Verified: 18 tests pass. The package can still be generated with no key and no server.
