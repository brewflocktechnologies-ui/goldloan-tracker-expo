# Fields Missing From the Google Sheet Backend

These are fields the app *displays* but that have **no corresponding column** in the Google Sheet
(`backend/Code.gs` `SHEET_COLUMNS`), or that had a real source available but the app wasn't reading it.

Sheet columns checked against `backend/Code.gs` lines 5-9 (`SHEET_COLUMNS`).

> **Update (2026-09-24):** the Users screen's mock-data fallbacks have been removed — see
> [Resolved](#resolved--users-screen) below. Ornaments and the Loans "Outstanding Amount" gap are
> still open.

## 1. Ornaments sheet — no column exists at all (still open)

Current `Ornaments` sheet columns:
`OrnamentId, UserId, OrnamentName, OrnamentType, OrnamentCategory, Description, GrossWeight, NetWeight, MetalWeight, StoneWeight, Purity, HallmarkNumber, Quantity, BuyingPricePerGram, CurrentPricePerGram, BuyingCost, TotalPrice, MarketValue, AppreciationValue, AppreciationPercentage, MakerName, EstimatedValue, OrnamentImages, Remarks, Status, ReleaseDate, ReleasedLoanId`

| Field shown in UI | Where | Missing column | Notes |
|---|---|---|---|
| Assay Center | Ornament detail screen | `AssayCenter` | Always shows hardcoded `"Bangalore"` — no field exists to set it, add/edit wizard has no input for it either. |
| Year of Marking | Ornament detail screen | `YearOfMarking` | Always shows hardcoded `"2026"` — same as above. |
| Hallmark verification status | Ornament detail screen | *(no field)* | Row unconditionally shows "✓ Verified" — there is no boolean/status field backing this claim at all. |

**Not yet labeled `(mock)` in the UI** — these still display as if real. Flag for a follow-up pass
identical to what was done for Users (either wire up real fields in the sheet + add form, or append
`(mock)` next to each).

## 2. Loans — Outstanding Amount (partially resolved)

Current `Loans` sheet columns:
`LoanId, LoanNumber, UserId, BankAccountId, BankName, LoanDate, LoanAmount, InterestRate, InterestType, LoanPeriod, GrossWeight, NetWeight, ProcessingFee, DocumentCharge, InsuranceCharge, TotalCharges, NetDisbursementAmount, DueDate, LoanStatus, Remarks, CreatedDate, UpdatedDate, ClosedDate, ClosureRemarks`

| Field shown in UI | Where | Missing column | Status |
|---|---|---|---|
| Outstanding Amount | Users → Loans tab | *(no field)* | **Still fake** (`LoanAmount × 0.6`) — no real calc exists anywhere (frontend or backend). A `Payments` sheet (`PrincipalAmount`, `PaymentDate`, etc.) exists and could drive a real calculation, but nothing uses it for this yet. **Now labeled "Outstanding (mock)" in the UI** so it's not mistaken for real data. |
| "X days left / overdue" badge | Users → Loans tab | — | ✅ **Fixed** — now computed for real from the real `DueDate` column instead of a hardcoded string. |

## Resolved — Users screen

Everything below used to fall back to fake data and has been fixed (see `src/mock/userMockExtras.ts`
and `src/app/(tabs)/users.tsx`):

| Field | Old behavior | New behavior |
|---|---|---|
| Mobile / Aadhaar / PAN | Fake `+91 98765 43210` / `XXXX XXXX 1234` / `ABCDE1234F` when blank | Shows `'—'` when the (real) sheet cell is empty |
| Last active | Hash-generated fake date when both `CreatedDate`/`UpdatedDate` were blank | Row is hidden entirely when both are blank |
| Bank Accounts tab | Two entire fake accounts (SBI/HDFC) shown when a customer had 0 real accounts | Shows a real empty state ("No bank accounts on file") instead |
| Loans tab | Two entire fake loans (`LN 2024 001/002`) shown when a customer had 0 real loans | Shows a real empty state ("No loans on file") instead |
| Bank/loan per-field fallbacks | Fake branch/IFSC/UPI/limits/dates on otherwise-real records | Shows `'—'`/`0` instead |
| Loan count & gold weight (user list card) | Hash formula, unrelated to real data | Real count/sum from `store.loans`/`store.ornaments` |

## Fields that were never missing — sheet has the column, mock only fired on a blank cell

- **Users**: `MobileNumber`, `AadhaarNumber`, `PANNumber`, `City`, `State`, `Gender`, `CreatedDate`/`UpdatedDate`
- **BankAccounts**: `BranchName`, `IFSCCode`, `UPI_ID`, `MaxLoanAmount`, `UtilizedLoanAmount`, `BankName`, `AccountNumber`
- **Loans**: `LoanNumber`, `LoanDate`, `DueDate`, `LoanAmount`, `InterestRate`, `InterestType` (weight is even auto-computed server-side from linked ornaments if blank)

Fill these in the sheet and the app will show the real value — no code change needed.

## Still open

1. **Ornaments**: `AssayCenter`, `YearOfMarking`, hallmark-verification claim — need either real fields + form inputs, or a `(mock)` label like Outstanding Amount got.
2. **Loans**: `Outstanding Amount` — needs a real calculation against the `Payments` sheet to stop being `(mock)`.
