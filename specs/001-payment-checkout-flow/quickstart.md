# Quickstart: Frontend-Only Checkout Validation

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
pnpm install
pnpm dev
```

Open the local app URL shown by Vite.

## Validation Scenarios

### Scenario 1: Happy Path Submit

1. Navigate through steps 1 to 5.
2. Enter valid personal info, address, and payment details.
3. Click `Place Order`.

Expected:
- Submit button shows loading state briefly.
- Flow transitions to step 6 success.
- Order confirmation message and generated order id are visible.

### Scenario 2: Invalid Data Blocking

1. Enter invalid email and short phone number.
2. Attempt to continue/submit.

Expected:
- Inline field errors appear.
- Navigation/submit is blocked until values are valid.
- No network call is required for this behavior.

### Scenario 3: Session Restore

1. Fill fields in step 2 or 3.
2. Refresh browser tab.

Expected:
- Checkout session restores from `sessionStorage` if not expired.

## Related Artifacts

- Plan: `specs/001-payment-checkout-flow/plan.md`
- Research: `specs/001-payment-checkout-flow/research.md`
- Data model: `specs/001-payment-checkout-flow/data-model.md`
- Contracts: `specs/001-payment-checkout-flow/contracts/api-contracts.md`

## Note on Tests

Automated tests are intentionally deferred for this phase per stakeholder instruction and should be reinstated in the next planning/implementation cycle.
