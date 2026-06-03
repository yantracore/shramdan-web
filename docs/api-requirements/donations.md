# Donation + Expense (transparency ledger)

> A donation is a recorded inflow to a श्रमदान event — funds, materials, or in-kind. An expense is a recorded outflow against that event — receipts attached. Together they form the public transparency ledger surfaced at `/ledger`. The principle: every rupee that flows in or out is publicly visible by default; donor identities are public only when the donor opts in, otherwise displayed as anonymous.

**Spec status:** `draft`
**Last updated:** 2026-06-03

---

## Donation fields

- **id** (`string`, required, public).
- **eventId** (`string`, optional, public) — campaign the donation is earmarked to. Null for general-fund donations.
- **kind** (`enum`, required, public) — `FUNDS`, `MATERIALS`, `LABOR_PLEDGE`, `LOGISTICS`, `OTHER`. `FUNDS` records carry a numeric amount; other kinds carry a description.
- **amount** (`number`, optional, public) — Nepali rupees. Required when `kind === 'FUNDS'`.
- **currency** (`string`, optional, public) — ISO 4217. Defaults to `NPR`.
- **description** (`string`, optional, public) — short narrative; required when `kind !== 'FUNDS'`.
- **donorName** (`string`, optional, public) — display name shown in the ledger. `null` means donor opted to remain anonymous.
- **donorMemberId** (`string`, optional, internal) — server-side link to the member record when the donor is signed in. Never surfaced publicly.
- **channel** (`enum`, required, public) — `ESEWA`, `KHALTI`, `BANK`, `FOREIGN`, `IN_KIND`, `OTHER`. Drives the receipt rendering and matches the rails set in roadmap 5.4.
- **referenceId** (`string`, optional, internal) — payment-gateway transaction id; not public.
- **receivedAt** (`datetime`, required, public).
- **acknowledgedAt** (`datetime`, optional, public) — when the financial-advisor role confirmed receipt.
- **note** (`string`, optional, public) — donor's optional public note.

---

## Expense fields

- **id** (`string`, required, public).
- **eventId** (`string`, required, public) — campaign the expense is against.
- **kind** (`enum`, required, public) — `TOOLS`, `MATERIALS`, `TRANSPORT`, `REFRESHMENTS`, `PERMITS`, `MEDICAL`, `OTHER`.
- **amount** (`number`, required, public).
- **currency** (`string`, required, public). Defaults to `NPR`.
- **description** (`string`, required, public) — what was bought / paid for.
- **paidToName** (`string`, optional, public) — vendor / recipient label.
- **receiptUploadId** (`string`, optional, public) — reference to the uploaded receipt image / PDF.
- **paidAt** (`datetime`, required, public).
- **paidById** (`string`, required, internal) — member who recorded the expense (usually the financial-advisor role); never surfaced publicly.
- **approvedById** (`string`, optional, internal) — second-witness sign-off for amounts above a configurable threshold.

---

## Operations

| Operation | Transport | RBAC | Description |
|-----------|-----------|------|-------------|
| List donations | REST GET | Public | Paginated public ledger. Filters: `eventId`, `kind`, `channel`, date range. |
| Record a donation | REST POST | FinancialAdvisor or Admin | Manual entry (in-kind, bank-transfer reconciliation). For Esewa / Khalti, the webhook records it server-side. |
| Acknowledge a donation | REST PATCH | FinancialAdvisor or Admin | Sets `acknowledgedAt`. Triggers thank-you message. |
| List expenses for an event | REST GET | Public | Paginated. |
| Record an expense | REST POST | FinancialAdvisor or Admin | Body: `{ kind, amount, description, paidToName, receiptUploadId, paidAt }`. |
| Approve an expense | REST PATCH | Admin (when amount > threshold) | Second-witness sign-off; sets `approvedById`. |
| Get event fund summary | REST GET | Public | Aggregate `{ donatedTotal, spentTotal, surplus, expenseCount, donationCount }` for a single event. |

---

## Fund summary (aggregate)

The per-event fund summary surfaced on `/events/[id]` and `/ledger` is derived from the two ledgers:

```
donatedTotal  = sum(donations where eventId = X and kind = 'FUNDS')
spentTotal    = sum(expenses where eventId = X)
surplus       = donatedTotal - spentTotal
```

Non-funds donations (materials, labor pledges, logistics) are not summed numerically; they appear as a separate "in-kind contributions" badge with a count.

---

## Visibility

- Donations: all fields above are public by default. `donorName === null` means the donor opted to remain anonymous; the ledger renders "Anonymous donor" in their place.
- Expenses: all fields above are public. The receipt upload (if attached) is publicly viewable.
- Internal fields (`donorMemberId`, `referenceId`, `paidById`, `approvedById`) are never returned in public reads.
- Foreign donations may carry an additional `swcReferenceId` field once SWC approval is integrated (roadmap 5.4.4).

---

## Future-proofing notes

- Anonymized donor patterns / fraud-detection summary — out of scope for MVP.
- Multi-currency conversions — store original currency + amount; compute NPR-equivalent for the summary at the rate observed on `receivedAt`.

---

## Recent changes

- `2026-06-03` — initial spec draft. Captures the donation + expense entities needed by the new `/ledger` route and the per-event `FundSummaryStrip` (roadmap Phase 6.1 + 6.2 + 6.4).
