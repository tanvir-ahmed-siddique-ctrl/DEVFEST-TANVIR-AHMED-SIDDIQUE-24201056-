# Requirements Ledger

| ID | Requirement | Type | Verification | Status |
|---|---|---|---|---|
| M01 | Load and validate requirements JSON | MUST | 12-test suite + browser judge path | Done |
| M02 | Sort requirements by numeric `order` | RULE | `sorts by the order field` test | Done |
| M03 | Upload multiple PDFs, page count, removal | MUST | sample browser flow | Done |
| M04 | Reject non-PDF, damaged, and encrypted files safely | MUST/BONUS | sample PNG rejection + guarded PDF parser | Done |
| M05 | Enforce one-file/one-requirement matching | RULE | duplicate/reuse tests | Done |
| M06 | Capture expiry dates for applicable matches | MUST | status tests + browser UI | Done |
| M07 | Compute exact five statuses immediately | STRING/RULE | unit tests S01-S06 | Done |
| M08 | Detect byte-identical duplicates | MUST | SHA-256 browser flow + unit test S07 | Done |
| M09 | Disable Generate and explain every blocker | UX | sample browser flow | Done |
| M10 | Generate English cover with all required fields | MUST | sample PDF generation | Done |
| M11 | Merge all pages in requirement order | RULE | 16-page sample assertion | Done |
| M12 | Add readable non-overlapping footer to every page | MUST | reserved strip; pages 1, 2, 3, 16 rendered and inspected | Done |
| M13 | Download `<tender_id>_Package.pdf` | STRING | browser implementation | Done |
| M14 | Complete Bangla/English UI | MUST/UX | browser language audit including statuses/errors | Done |
| L01 | Maximum 30 files and 50 MB total | LIMIT | exact-boundary tests | Done |
| D01 | Correct sample output under `output/` | DELIVERABLE | 16-page structure check + render inspection | Done |
| D02 | Status screenshot under `screenshots/` | DELIVERABLE | `screenshots/document-statuses.png` inspected | Done |
| D03 | README and MIT license | DELIVERABLE | repository audit | Done |
| D04 | Public HTTPS deployment matching final commit | DELIVERABLE | incognito judge path | Not deployed |
| B01 | Filename auto-match suggestions | BONUS | safe suggestions refuse ambiguous names | Done |
| B02 | Index page | BONUS | PDF structure test | Not started |
| B03 | CSV checklist export | BONUS | content test | Not started |
| B04 | Save and reopen work | BONUS | reload test | Not started |
