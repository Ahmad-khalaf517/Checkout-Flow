# Tasks: Multi-Step Checkout Payment Flow (Frontend-Only)

**Feature**: 001-payment-checkout-flow

**Input**: Design documents from `/specs/001-payment-checkout-flow/`

**Prerequisites**:
- plan.md (frontend-only, no backend calls)
- spec.md (user stories)
- research.md (decisions)
- data-model.md (frontend state entities)
- contracts/api-contracts.md (local adapter contracts)
- quickstart.md (manual validation scenarios)

**Tests**: Deferred for this phase by explicit stakeholder direction.

**Organization**: Tasks are grouped by user story and designed for incremental delivery.

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[ID]**: Task ID in execution order (T001, T002, ...)
- **[P]**: Parallelizable task
- **[Story]**: User story label (US1, US2, ...)
- Include exact file path in each task description

---

## Phase 1: Setup (Completed)

**Purpose**: Baseline project structure and core technical foundation

- [X] T001 Create checkout folder structure in `src/components/checkout/`, `src/hooks/`, `src/stores/`, `src/services/`, `src/types/`, `src/constants/`, `src/lib/`
- [X] T002 [P] Install and align core dependencies in `package.json`
- [X] T003 [P] Add environment template in `.env.example`
- [X] T004 [P] Create checkout domain types in `src/types/checkout.ts`
- [X] T005 [P] Export shared types from `src/types/index.ts`
- [X] T006 Create Zod checkout schemas and helpers in `src/lib/validation.ts`
- [X] T007 [P] Define checkout constants in `src/constants/checkout.ts`
- [X] T008 Create API client abstraction in `src/lib/api-client.ts`
- [X] T009 [P] Create payment service module in `src/services/payment.ts`
- [X] T010 Create checkout Zustand store in `src/stores/checkoutStore.ts`
- [X] T011 [P] Create store hook wrapper in `src/hooks/useCheckout.ts`
- [X] T012 [P] Create inline error component in `src/components/checkout/FormError.tsx`
- [X] T013 [P] Create navigation controls in `src/components/checkout/StepNavigation.tsx`
- [X] T014 [P] Create step-navigation helper in `src/hooks/useFormStepNavigation.ts`
- [X] T015 Create checkout orchestration container in `src/components/checkout/CheckoutContainer.tsx`
- [X] T016 Create step-1 summary component in `src/components/checkout/CheckoutSummary.tsx`

**Checkpoint**: Foundation completed; begin next implementation step.

---

## Phase 2: User Story 1 - Complete Checkout With Valid Data (Priority: P1) 🎯 MVP

**Goal**: A user can complete the full multi-step checkout and always reach success when data is valid.

**Independent Test**: Manually complete steps 1-6 with valid data and verify success state with generated order id.

- [X] T017 [US1] Implement PersonalInfoForm (step 2) with React Hook Form + Zod in `src/components/checkout/PersonalInfoForm.tsx`
- [X] T018 [US1] Implement AddressForm (step 3) with local country/state options in `src/components/checkout/AddressForm.tsx`
- [X] T019 [US1] Implement PaymentForm (step 4) with card masking and simulated token in `src/components/checkout/PaymentForm.tsx`
- [X] T020 [US1] Implement review screen (step 5) with editable sections in `src/components/checkout/ReviewOrder.tsx`
- [X] T021 [US1] Implement success screen (step 6a) in `src/components/checkout/CheckoutSuccess.tsx`
- [X] T022 [US1] Implement error screen (step 6b) for invalid submit attempts in `src/components/checkout/CheckoutError.tsx`
- [X] T023 [US1] Wire steps 2-6 into flow container in `src/components/checkout/CheckoutContainer.tsx`
- [X] T024 [US1] Update submit behavior to local validation-first success path in `src/stores/checkoutStore.ts`
- [X] T025 [US1] Replace network behavior with local adapter functions in `src/services/payment.ts`

**Checkpoint**: MVP checkout flow works end-to-end locally without backend calls.

---

## Phase 3: User Story 2 - Inline Validation And Correction (Priority: P1)

**Goal**: Invalid inputs show clear inline errors and user can correct without losing progress.

**Independent Test**: Enter invalid values in steps 2-4, verify inline errors, correct them, and proceed.

- [X] T026 [US2] Add semantic error wiring (`aria-invalid`, `aria-describedby`) to PersonalInfoForm in `src/components/checkout/PersonalInfoForm.tsx`
- [X] T027 [US2] Add onBlur validation behavior and error clearance in `src/components/checkout/PersonalInfoForm.tsx`
- [X] T028 [US2] Add address-level validation and same-as-billing revalidation in `src/components/checkout/AddressForm.tsx`
- [X] T029 [US2] Add real-time Luhn and expiry handling in `src/components/checkout/PaymentForm.tsx`
- [X] T030 [US2] Persist full in-progress form state snapshot and restore in `src/components/checkout/CheckoutContainer.tsx`

**Checkpoint**: Validation behavior is clear, immediate, and state-safe.

---

## Phase 4: User Story 3 - Step Navigation And Edit Flow (Priority: P1)

**Goal**: Users can move backward/forward, edit from review, and keep all form data intact.

**Independent Test**: Fill steps 2-4, move between steps repeatedly, edit from step 5, and confirm updates persist.

- [X] T031 [US3] Add forward-step guard logic based on required step data in `src/stores/checkoutStore.ts`
- [X] T032 [US3] Refine conditional button behavior by step state in `src/components/checkout/StepNavigation.tsx`
- [X] T033 [US3] Add review edit-link navigation to specific steps in `src/components/checkout/ReviewOrder.tsx`
- [X] T034 [US3] Persist each form section on change via store actions in `src/components/checkout/PersonalInfoForm.tsx`, `src/components/checkout/AddressForm.tsx`, `src/components/checkout/PaymentForm.tsx`

**Checkpoint**: Navigation and edit loop is stable and user-friendly.

---

## Phase 5: User Story 5 - Responsive Checkout UI (Priority: P1)

**Goal**: Checkout is usable on mobile, tablet, and desktop without horizontal scrolling.

**Independent Test**: Validate at 375px, 768px, 1920px breakpoints and confirm all actions remain reachable.

- [ ] T035 [US5] Apply mobile-first responsive layout rules across checkout screens in `src/components/checkout/*.tsx`
- [ ] T036 [P] [US5] Ensure touch target sizes and mobile input legibility in `src/components/checkout/*.tsx`
- [ ] T037 [P] [US5] Improve responsive image rendering in summary/review in `src/components/checkout/CheckoutSummary.tsx`, `src/components/checkout/ReviewOrder.tsx`

**Checkpoint**: Responsive behavior meets quickstart manual criteria.

---

## Phase 6: User Story 6 - Accessibility Compliance (Priority: P1)

**Goal**: Checkout is keyboard and screen-reader friendly with clear semantic structure.

**Independent Test**: Complete flow using keyboard-only navigation and validate screen-reader announcements.

- [ ] T038 [US6] Add semantic fieldset/legend and ARIA labels to forms in `src/components/checkout/PersonalInfoForm.tsx`, `src/components/checkout/AddressForm.tsx`, `src/components/checkout/PaymentForm.tsx`
- [ ] T039 [US6] Add keyboard-focus management on validation failure in `src/components/checkout/PersonalInfoForm.tsx`, `src/components/checkout/AddressForm.tsx`, `src/components/checkout/PaymentForm.tsx`
- [ ] T040 [US6] Add visible focus styles and non-color error indicators in `src/components/checkout/*.tsx`, `src/index.css`
- [ ] T041 [US6] Add submit-status live announcements in `src/components/checkout/CheckoutContainer.tsx`

**Checkpoint**: Accessibility baseline is in place for manual audit.

---

## Phase 7: Polish & Cross-Cutting

**Purpose**: Final cleanup and readiness checks for this frontend-only phase.

- [ ] T042 [P] Remove commented-out legacy service/store code in `src/services/payment.ts`, `src/stores/checkoutStore.ts`
- [ ] T043 [P] Run lint/type/build and fix issues in `package.json`, `src/**`
- [ ] T044 Sync implementation docs with final behavior in `specs/001-payment-checkout-flow/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

1. Setup (Phase 1) is complete.
2. Start with Phase 2 (US1) as MVP.
3. Phase 3 (US2) and Phase 4 (US3) depend on core forms from US1.
4. Phase 5 (US5) and Phase 6 (US6) can run after US1 screens exist.
5. Phase 7 runs last.

### User Story Dependencies

- US1 is the immediate next step and required for all downstream stories.
- US2 and US3 depend on US1 components.
- US5 and US6 depend on implemented screens but can proceed in parallel after US1.

### Parallel Opportunities

- T036 and T037 are parallel in US5.
- T042 and T043 are parallel in polish phase.

---

## Parallel Example (After US1)

```bash
# Parallel visual hardening tasks
Task: T036 [US5] touch targets and mobile legibility
Task: T037 [US5] responsive images
```

---

## Implementation Strategy

### MVP First

1. Begin at T017 and complete T017-T025.
2. Validate quickstart happy path manually.
3. Continue with validation and navigation hardening (T026-T034).

### Incremental Delivery

1. US1 functional flow.
2. US2 validation refinement.
3. US3 navigation/edit refinement.
4. US5/US6 UX hardening.
5. Polish and finalize.

---

## Next Step To Start Now

- **T017 [US1]** Implement `src/components/checkout/PersonalInfoForm.tsx`.
