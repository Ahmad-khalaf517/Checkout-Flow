# Research: Frontend-Only Checkout Scope

## Decision 1: No backend service calls in this phase

- **Decision**: Do not call HTTP APIs for submit, geo lookup, or address validation in this phase.
- **Rationale**: Stakeholder requested a frontend-only project for now. This reduces delivery risk and keeps work focused on UX, validation, and state transitions.
- **Alternatives considered**:
  - Keep API calls with mocked endpoints: rejected because it still introduces network coupling.
  - Feature flag between mock and real API: deferred to backend integration phase.

## Decision 2: Submit succeeds when checkout data is valid

- **Decision**: Submission transitions to success state after client-side schema validation passes.
- **Rationale**: Matches stakeholder request and enables end-to-end UI flow validation immediately.
- **Alternatives considered**:
  - Simulate random failure rates: rejected because it conflicts with deterministic success requirement.
  - Simulate full gateway behavior: deferred until backend-enabled phase.

## Decision 3: Keep contracts stable for future backend integration

- **Decision**: Preserve request/response shapes in TypeScript contracts even when executed locally.
- **Rationale**: Allows future backend wiring without reworking UI/store payload assembly.
- **Alternatives considered**:
  - Use loosely typed local objects: rejected due to maintainability and migration risk.

## Decision 4: Defer automated tests temporarily

- **Decision**: Skip test implementation in this planning cycle.
- **Rationale**: Explicit stakeholder request to ignore tests for now.
- **Alternatives considered**:
  - Add lightweight smoke tests only: deferred to keep strict alignment with request.
