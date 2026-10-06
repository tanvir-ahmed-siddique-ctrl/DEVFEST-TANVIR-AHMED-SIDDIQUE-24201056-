# Sample and Adversarial Checks

| ID | Scenario | Expected result |
|---|---|---|
| S01 | Mandatory requirement has no match | `Missing`, blocking |
| S02 | Optional requirement has no match | `Not provided`, non-blocking |
| S03 | Expiry-bearing document is matched without a date | `Expiry date needed`, blocking |
| S04 | Expiry is before 2026-10-20 | `Expired`, blocking |
| S05 | Expiry is exactly 2026-10-20 | `OK`, non-blocking |
| S06 | Expiry is after 2026-10-20 | `OK`, non-blocking |
| S07 | Duplicate bytes under different names | Both marked duplicate; cannot cross-match |
| S08 | Financial filename sorts before technical filename | Output still follows requirement order R08 then R09 |
| S09 | Corrected sample, without index | 16 pages including cover; footer uses total 16 |
| S10 | PNG selected as a document | Rejected with a clear localized error |
| S11 | 31st file or total above 50 MB | Rejected without losing prior valid state |
