# Tasks: Multi-Step Checkout Payment Flow

**Feature**: 001-payment-checkout-flow

**Input**: Design documents from `/specs/001-payment-checkout-flow/`

**Prerequisites**: 
- ✅ plan.md (implementation plan with architecture, types, validation, API strategy, component hierarchy)
- ✅ spec.md (feature specification with 6 user stories, acceptance criteria, requirements)
- ✅ data-model.md (entity definitions, storage strategy, PII protection)
- ✅ contracts/api-contracts.md (endpoint specifications for checkout, geo, address APIs)

**Constitution**: All tasks aligned with 6 core principles: Code Quality, Test-First Development, Responsive Design, Accessibility (WCAG 2.1 AA), Error Handling, Validation Logic

**Tests**: Test tasks included (test-first development approach per constitution) - Write tests FIRST, ensure they FAIL, then implement

**Organization**: Tasks organized by user story to enable independent implementation and testing of each story

---

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[ID]**: Task ID in sequential order (T001, T002, etc.)
- **[P]**: Can run in parallel (different files, no dependencies within current phase)
- **[Story]**: User story label for story-specific tasks (US1, US2, US3, US4, US5, US6)
- **Description**: Clear action with exact file path

---

## Phase 1: Setup & Foundation (Week 1)

**Purpose**: Project initialization and core infrastructure for all downstream work

### 1.1 Project Structure & Dependencies

- [ ] T001 Create folder structure per plan: `src/components/checkout/`, `src/hooks/`, `src/stores/`, `src/services/`, `src/types/`, `src/constants/`, `src/lib/`
- [ ] T002 [P] Install new dependencies: `pnpm add react-hook-form zod @hookform/resolvers zustand stripe clsx`
- [ ] T003 [P] Create environment variable template: `.env.example` with `REACT_APP_API_BASE_URL`, `REACT_APP_STRIPE_PUBLIC_KEY`

### 1.2 Type Definitions

- [ ] T004 [P] Create core type definitions in `src/types/checkout.ts` (PersonalInfoData, AddressData, PaymentMethodData, CartItem, Order, CheckoutSession, CheckoutStep, FieldError, CheckoutResponse interfaces)
- [ ] T005 [P] Create ISO8601DateTime and type exports in `src/types/index.ts`

### 1.3 Validation & Constants

- [ ] T006 Create Zod validation schemas in `src/lib/validation.ts`:
  - PersonalInfoSchema (fullName 2-100 chars regex, email RFC 5322, phoneNumber 10-15 digits)
  - AddressSchema (street 5-100, city 2-50 regex, state 2-3 code, postalCode 3-20, country 2-char ISO)
  - PaymentMethodSchema (cardholderName, cardNumber Luhn check, expiryDate MM/YY, CVV 3-4 digits)
  - CheckoutSchema (complete multi-step validation)
  - Helper functions: luhnCheck() and isValidExpiryDate()
- [ ] T007 [P] Create validation constants and error messages in `src/constants/checkout.ts` (field labels, error messages, step info)

### 1.4 API Client

- [ ] T008 Create API client wrapper in `src/lib/api-client.ts` (ApiClient class with request, get, post methods; timeout 30 seconds; error handling)
- [ ] T009 [P] Create payment service in `src/services/payment.ts` (submitCheckout, validateAddress, getCountries, getStates functions with retry logic)

### 1.5 State Management (Zustand Store)

- [ ] T010 Create Zustand checkout store in `src/stores/checkoutStore.ts`:
  - Initial state: currentStep, personalInfo, billingAddress, shippingAddress, paymentMethod, isLoadingSubmit, submitError, orderId, orderStatus, cartItems, cartTotal, sessionId
  - Actions: goToStep, updatePersonalInfo, updateBillingAddress, updateShippingAddress, setUseShippingAsBilling, updatePaymentMethod, submitOrder, resetCheckout, setError, clearError
  - Helper: generateSessionId() for idempotency
- [ ] T011 [P] Create custom hook in `src/hooks/useCheckout.ts` that wraps useCheckoutStore()

**Checkpoint**: All setup complete - foundation ready for user story implementation to begin in parallel

---

## Phase 2: Core Components & Form Infrastructure (Week 1-2)

**Purpose**: Foundational components and form state management framework (blocking prerequisites for user stories)

### 2.1 Form Wrappers & Utilities

- [ ] T012 [P] Create FormError reusable component in `src/components/checkout/FormError.tsx` (inline error display with aria-invalid, aria-describedby, field highlighting)
- [ ] T013 [P] Create StepNavigation component in `src/components/checkout/StepNavigation.tsx` (Back, Next/Continue, Place Order buttons with conditional rendering based on step)
- [ ] T014 [P] Create custom hook in `src/hooks/useFormStepNavigation.ts` for step transition logic and validation on navigation

### 2.2 Main Container & Step 1 (Summary)

- [ ] T015 Create CheckoutContainer component in `src/components/checkout/CheckoutContainer.tsx`:
  - Wraps all checkout steps
  - Manages step transitions via store
  - Fetches initial cart data
  - Handles sessionStorage persistence and restore on mount
- [ ] T016 Create CheckoutSummary (Step 1) in `src/components/checkout/CheckoutSummary.tsx`:
  - Display cart items with product name, quantity, price, image
  - Show cart total in cents formatted as currency
  - Show "Continue" button to move to Step 2 (Personal Info)
  - Include order review text for context

---

## Phase 3: User Story 1 - Complete Checkout with Valid Data (Priority: P1) 🎯 MVP

**Goal**: User successfully completes entire checkout (Steps 1-6) with valid data and receives order confirmation

**Independent Test**: Can be fully tested by entering valid data across all checkout steps and verifying order confirmation displays with order number and success message

### 3.1 Unit & Integration Tests for US1

- [ ] T017 [P] Create unit tests for Zod schemas in `src/lib/validation.test.ts`:
  - Test PersonalInfoSchema with valid/invalid names, emails, phone numbers
  - Test AddressSchema with valid/invalid addresses
  - Test PaymentMethodSchema with valid/invalid card numbers (Luhn algorithm)
  - Test Luhn algorithm separately with known credit card numbers
  - Test isValidExpiryDate with past, future, and current dates
- [ ] T018 [P] Create unit tests for Zustand store in `src/stores/checkoutStore.test.ts`:
  - Test goToStep action and state update
  - Test updatePersonalInfo, updateBillingAddress, updatePaymentMethod actions
  - Test submitOrder action with mocked API
  - Test resetCheckout clears all state
- [ ] T019 [P] Create component test for PersonalInfoForm in `src/components/checkout/PersonalInfoForm.test.tsx`:
  - Test form renders with empty fields and correct labels
  - Test form submission with valid data proceeds to next step
  - Test inline error display for invalid email
  - Test form state is restored from store on mount
- [ ] T020 [P] Create component test for AddressForm in `src/components/checkout/AddressForm.test.tsx`:
  - Test form renders billing and shipping address fields
  - Test "Same as Billing" checkbox hides shipping fields on check
  - Test form submission with valid addresses
  - Test invalid postal code shows error
- [ ] T021 [P] Create component test for PaymentForm in `src/components/checkout/PaymentForm.test.tsx`:
  - Test form renders card fields (name, number, expiry, CVV)
  - Test card number field masks input with spaces every 4 digits
  - Test Luhn validation error for invalid card numbers
  - Test expiry date validation
- [ ] T022 [P] Create integration test for checkout flow in `tests/integration/checkout-flow.test.tsx`:
  - Test complete user journey: Step 1 → 6 with valid data
  - Test form state preservation across steps
  - Test API submission is called with correct data
  - Test success page displays order number and confirmation message

### 3.2 Implementation for US1 - Form Components

- [ ] T023 Create PersonalInfoForm (Step 2) in `src/components/checkout/PersonalInfoForm.tsx`:
  - Use React Hook Form with PersonalInfoSchema and zodResolver
  - Validation mode: onBlur (validate on field blur)
  - Fields: fullName (with name regex validation), email (RFC 5322), phoneNumber (10-15 digits)
  - Display inline errors below each field with FormError component
  - Aria attributes: aria-invalid, aria-describedby for errors, role="region" for form
  - Back button goes to Step 1, Continue button validates and moves to Step 3
  - Load and restore personalInfo from store if exists
- [ ] T024 Create AddressForm (Step 3) in `src/components/checkout/AddressForm.tsx`:
  - Use React Hook Form with AddressSchema
  - Billing address form: street, city, state (select from geo API), postalCode, country (select from geo API)
  - Country/state selects populated from getCountries/getStates APIs
  - "Same as Billing" checkbox (controlled) that controls shipping address display
  - Shipping address form (conditional): street, city, state, postalCode, country
  - Load countries/states on component mount (cache in localStorage with 7-day TTL)
  - Aria attributes: aria-live="polite" for dynamic country/state state changes
  - Back button goes to Step 2, Continue button validates both addresses and moves to Step 4
  - Form state persists to store when changed
- [ ] T025 Create PaymentForm (Step 4) in `src/components/checkout/PaymentForm.tsx`:
  - Use React Hook Form with PaymentMethodSchema
  - Fields: cardholderName, cardNumber (with input masking - spaces every 4 digits), expiryDate (MM/YY with auto-stepping), CVV (3-4 digits)
  - NOTE: DO NOT SEND RAW CARD DATA TO SERVER - integrate with Stripe.js for tokenization
  - Before form submission, tokenize card via Stripe client SDK (returns token, NOT raw card)
  - Store token and masked card info (last4Digits, cardType) in paymentMethod state
  - Display Luhn algorithm error for invalid card numbers
  - Display expiry date error for expired or invalid dates
  - Display CVV length error (3-4 digits)
  - Back button goes to Step 3, "Review Order" button validates and moves to Step 5
  - Stripe integration: Load Stripe.js on mount, handle card element styling

### 3.3 Implementation for US1 - Review & Submission

- [ ] T026 Create ReviewOrder (Step 5) in `src/components/checkout/ReviewOrder.tsx`:
  - Display personal info section with editable link to Step 2
  - Display billing address section with editable link to Step 3
  - Display shipping address section (or note "Same as Billing") with editable link
  - Display payment method (masked): card type, last 4 digits, expiry (NO full card number or CVV)
  - Display cart items with quantity, price, image
  - Display order totals: items subtotal, shipping (0 for v1), tax (0 for v1), final total
  - "Edit" links navigate back to respective steps; form data preserved
  - Back button goes to Step 4, "Place Order" button triggers submitCheckout with Idempotency-Key
  - Aria attributes: aria-live="polite" for order summary changes
- [ ] T027 Create CheckoutSuccess (Step 6a) in `src/components/checkout/CheckoutSuccess.tsx`:
  - Display confirmation page with order number prominently
  - Show full order summary (personal info, address, items, total, payment method masked)
  - Display success message and next steps (email confirmation note)
  - "View Order" button navigates to order detail page
  - "Continue Shopping" button resets checkout and returns to home
  - Include print/share options (future enhancement)
- [ ] T028 Create CheckoutError (Step 6b) in `src/components/checkout/CheckoutError.tsx`:
  - Display error message (from submitError state)
  - Show error code and details if available (field-level errors)
  - "Retry Payment" button re-enables form and moves back to Step 4 with previous data intact
  - "Use Different Card" button moves to Step 4 with new form
  - "Contact Support" link visible if error persists
  - Display order number if order was created but payment failed

### 3.4 Implementation for US1 - Store Actions & API Integration

- [ ] T029 Implement submitCheckout action in Zustand store:
  - Validate all form data against CheckoutSchema before submission
  - Set isLoadingSubmit = true, disable form submission (prevent double-click)
  - Gen Idempotency-Key from sessionId
  - Call API POST /api/orders/submit with payment token (NOT raw card), personalInfo, addresses, cartItems
  - On success: Set orderId, orderStatus = 'success', currentStep = 6, isLoadingSubmit = false
  - On failure: Set orderStatus = 'failed', submitError = error message, currentStep = 6, isLoadingSubmit = false
  - Handle payment decline (card_declined) → show Card Declined message
  - Handle timeout (504) → show Timeout message with retry button
  - Handle server error (500) → show Server Error message

**Checkpoint**: User Story 1 fully functional - users can complete entire checkout with valid data and see confirmation. MVP is viable.

---

## Phase 4: User Story 2 - Handle Validation Errors & Inline Correction (Priority: P1)

**Goal**: Users receive clear, inline validation feedback for invalid data and can quickly correct errors without losing entered data

**Independent Test**: Can be tested by intentionally entering invalid data and verifying inline error messages appear within 500ms, form state preserved, and corrections clear errors immediately

### 4.1 Tests for US2

- [ ] T030 [P] Create test for FormError component in `src/components/checkout/FormError.test.tsx`:
  - Test error message displays when provided
  - Test aria-invalid is set to true
  - Test aria-describedby links to error ID
  - Test field styling (red border, error color text)
- [ ] T031 [P] Create tests for inline validation in `src/components/checkout/PersonalInfoForm.test.tsx`:
  - Test invalid email triggers error onBlur ("Please enter a valid email address")
  - Test incomplete phone number triggers error onBlur ("Phone number must be 10 digits")
  - Test invalid name (special chars) triggers error ("Full name can only contain letters...")
  - Test error clears when field is corrected
  - Test error message is announced by screen reader (aria-live)
  - Test focus moves to erroneous field when error occurs (via aria-invalid)
- [ ] T032 [P] Create tests for validation in AddressForm:
  - Test invalid postal code for state displays error
  - Test invalid city (numbers) displays error
  - Test errors clear on correction
- [ ] T033 [P] Create tests for validation in PaymentForm:
  - Test invalid card number (Luhn failure) displays error
  - Test expired card (past date) displays error
  - Test CVV wrong length displays error
  - Test errors are screen reader announcements

### 4.2 Implementation for US2 - Real-Time Validation

- [ ] T034 Update PersonalInfoForm to validate onBlur (already using React Hook Form onBlur mode):
  - Ensure validation runs when field loses focus (NOT while typing)
  - Ensure error message appears within 500ms
  - Ensure error clears immediately when user corrects field
  - Set aria-live="polite" on error region for screen reader announcement
- [ ] T035 Update AddressForm with onBlur validation:
  - Validate postalCode against selected country/state rules server-side
  - Show error message if postal code format invalid for that state
  - Ensure "Same as Billing" change re-validates shipping address if visible
- [ ] T036 Update PaymentForm with real-time Luhn validation:
  - Luhn check happens onBlur or as user finishes card number entry
  - Error displays immediately if card number fails Luhn
  - Card type detected from card number (Visa, Mastercard, Amex) and CVV validation adjusted (3 vs 4 digits)
  - Expiry date validation with relative date check (not in past, not >20 years future)

### 4.3 Implementation for US2 - Form State Preservation

- [ ] T037 Update CheckoutContainer to persist form state:
  - On component mount: restore checkout session from sessionStorage (if exists and not expired)
  - Before user leaves checkout page: save current state to sessionStorage
  - On form field change: update store (triggers sessionStorage save)
  - Include sessionStorage TTL (30 days per PCI); clear expired sessions
- [ ] T038 Update all form components to restore from store on mount:
  - PersonalInfoForm loads defaultValues from store.personalInfo
  - AddressForm loads defaultValues from store.billingAddress/shippingAddress
  - PaymentForm loads defaultValues from store.paymentMethod

**Checkpoint**: Full validation and error handling working; form state preserved across navigation and page refresh; users can quickly correct errors inline.

---

## Phase 5: User Story 3 - Navigate Between Checkout Steps (Priority: P1)

**Goal**: Users can move forward/backward through checkout steps without losing data and review/edit any section before final submission

**Independent Test**: Complete personal info, move to address, go back, verify personal info preserved, move forward again, edit address, verify changes reflected in review step

### 5.1 Tests for US3

- [ ] T039 [P] Create navigation test in `tests/integration/step-navigation.test.tsx`:
  - Test user moves from Step 1 → 2 → 3 → 4 → 5
  - Test user goes back from Step 2 → 1 and data is preserved
  - Test user goes back from Step 3 → 2 and all data is preserved
  - Test user edits personal info in Step 2 after moving to Step 3 - changes persist in review (Step 5)
  - Test user edits address in Step 3 - changes reflected in review (Step 5)
- [ ] T040 [P] Create test for ReviewOrder edit links in `src/components/checkout/ReviewOrder.test.tsx`:
  - Test clicking "Edit" on personal info moves to Step 2
  - Test clicking "Edit" on billing address moves to Step 3
  - Test form data in Step 2/3 is populated with existing data
  - Test after editing and returning to review, changes are reflected

### 5.2 Implementation for US3 - Back/Next Navigation

- [ ] T041 Implement goToStep action in store (already implemented in T010, verify it works):
  - Validates current step has required data before allowing next step
  - Stores errors in submitError if validation fails on next
  - Allows arbitrary backward navigation without validation (Step 5 → Step 2 allowed)
- [ ] T042 Update StepNavigation component with conditional buttons:
  - Step 1: Only "Continue" button
  - Steps 2-4: "Back" and "Continue" buttons
  - Step 5: "Back" and "Place Order" buttons
  - Steps 6a/6b: No navigation buttons (terminal states)
  - Back button always goes to previous step
  - Continue button validates form before moving next

### 5.3 Implementation for US3 - Form Data Preservation

- [ ] T043 Update PersonalInfoForm to save data on every field change:
  - On blur or value change: dispatch store.updatePersonalInfo(data)
  - Form defaultValues load from store.personalInfo (if exists)
- [ ] T044 Update AddressForm to save data on every field change:
  - On blur or value change: dispatch store.updateBillingAddress(data) and store.updateShippingAddress(data)
  - Form defaultValues load from store (if exists)
- [ ] T045 Update PaymentForm to save data on every field change:
  - On blur or value change: dispatch store.updatePaymentMethod(data)
  - Ensure masked card data (last4Digits, token) is stored, never raw card number

### 5.4 Implementation for US3 - Review & Edit

- [ ] T046 Update ReviewOrder component to link back to form steps:
  - "Edit" link on personal info section → goToStep(2)
  - "Edit" link on billing address section → goToStep(3)
  - "Edit" link on shipping address section → goToStep(3) with scroll to shipping
  - Personal info/address sections display current data from store
  - Payment method section shows last4Digits and cardType (never show full card)
  - All edits update store immediately; changes reflected when returning to review

**Checkpoint**: Users can navigate between all checkout steps, edit any section, and data is preserved throughout. Review step shows all data clearly with edit links.

---

## Phase 6: User Story 4 - Handle Payment Submission Failures (Priority: P2)

**Goal**: Payment submission failures (declined card, timeout, server error) are handled gracefully with clear, actionable error messages and recovery options

**Independent Test**: Test by simulating payment failures (declined card, network timeout, server error) and verify appropriate error messages and retry capability appear

### 6.1 Tests for US4

- [ ] T047 [P] Create test for payment decline handling in `src/services/payment.test.ts`:
  - Test submitCheckout with declined card response → returns PAYMENT_DECLINED error
  - Test user message is friendly (not technical code)
  - Test retry button is available
- [ ] T048 [P] Create test for timeout handling:
  - Test API timeout after 30 seconds → returns TIMEOUT error
  - Test retry button triggers resubmission with same idempotency key
- [ ] T049 [P] Create test for server error handling:
  - Test 500 error → returns SERVER_ERROR with supportable message
  - Test exponential backoff retry logic (1s, 2s, 4s)
  - Test max retry limit (3 attempts)
- [ ] T050 [P] Create test for idempotency handling:
  - Test duplicate submission with same Idempotency-Key returns cached response (not new order)
  - Test 409 Conflict response shows existing order (not duplicate)

### 6.2 Implementation for US4 - Error Messages & Recovery

- [ ] T051 Create error message mapping in `src/constants/checkout.ts`:
  - Map error codes to user-friendly messages:
    - VALIDATION_ERROR → "Please check your form. Specific fields have errors."
    - PAYMENT_DECLINED → "Your card was declined. Please check your card details or try another card."
    - CARD_EXPIRED → "Your card has expired. Please use a different card."
    - INSUFFICIENT_FUNDS → "Insufficient funds. Please try another card."
    - 3D_SECURE_REQUIRED → "Your card requires verification. Please try another card."
    - TIMEOUT → "Payment processing timed out. Please try again."
    - SERVER_ERROR → "We encountered an error. Please try again or contact support."
    - IDEMPOTENCY_CONFLICT → "Order already submitted. Showing existing order..."
- [ ] T052 Update CheckoutError component to display error type-appropriate UI:
  - Card decline errors: Show "Retry Payment" and "Use Different Card" buttons
  - Timeout errors: Show "Retry Payment" button with countdown timer (exponential backoff)
  - Server errors: Show "Retry Payment" button and "Contact Support" link
  - Duplicate order errors: Show existing order details instead of error
  - Display error code and details if available (field-level validation errors)

### 6.3 Implementation for US4 - Retry Logic

- [ ] T053 Implement exponential backoff retry logic in API client:
  - On network error or timeout: retry with delays 1s → 2s → 4s (max 3 attempts)
  - Use Idempotency-Key to ensure retries don't create duplicate orders
  - Log retry attempts for debugging
- [ ] T054 Update submitOrder action in store:
  - Catch API errors and categorize (validation, payment decline, timeout, server error)
  - Set submitError with user-friendly message
  - For retryable errors (TIMEOUT, SERVER_ERROR): show "Retry Payment" button
  - For non-retryable errors (VALIDATION_ERROR, PAYMENT_DECLINED): keep form editable
  - Preserve form data so user doesn't lose work when retrying

### 6.4 Implementation for US4 - Idempotency

- [ ] T055 Verify Zustand store sessionId is unique per checkout:
  - sessionId generated on store creation (T010 ensures this)
  - sessionId persisted to sessionStorage and restored on reload
  - sessionId sent as Idempotency-Key header in submitCheckout
- [ ] T056 Test idempotency key prevents duplicate orders:
  - Create test with mocked API that returns same orderId for identical Idempotency-Key
  - Ensure second submission returns existing order (not new order)

**Checkpoint**: Payment failures handled gracefully with clear messages and recovery options; idempotency prevents duplicate orders; exponential backoff handles transient network errors.

---

## Phase 7: User Story 5 - Responsive Design on Different Devices (Priority: P1)

**Goal**: Checkout flow displays correctly and is fully functional on mobile (375px), tablet (768px), and desktop (1920px+) screens

**Independent Test**: Test on multiple device sizes verifying touch targets ≥44px, fields legible without zoom, buttons clickable, no horizontal scrolling, and form submission works

### 7.1 Tests for US5

- [ ] T057 [P] Create responsive layout test in `tests/responsive/checkout-responsive.test.tsx`:
  - Test PersonalInfoForm layout on mobile (375px), tablet (768px), desktop (1920px)
  - Test form inputs are full-width on mobile, reasonable width on tablet/desktop
  - Test labels are above inputs (not adjacent) on mobile
  - Test font sizes are legible (≥16px on mobile) without zoom
  - Test button sizes ≥44px × 44px on mobile (touch targets)
  - Test no horizontal scrolling on mobile
- [ ] T058 [P] Create responsive image test:
  - Test product images in CheckoutSummary use srcSet for responsive sizes
  - Test images don't overflow on mobile
- [ ] T059 [P] Create responsive form validation test:
  - Test error messages display inline on all screen sizes
  - Test error text wraps properly on narrow screens
- [ ] T060 [P] Create touch interaction test on mobile:
  - Test buttons are tappable (≥44px × 44px)
  - Test inputs don't trigger zoom on iOS (font-size ≥16px)
  - Test form submission works with touch

### 7.2 Implementation for US5 - Responsive CSS with Tailwind

- [ ] T061 Update all checkout components with responsive Tailwind classes:
  - Mobile-first approach: base classes for 375px, then sm:, md:, lg: breakpoints
  - Container: w-full on mobile, max-w-2xl with mx-auto on desktop
  - Form inputs: w-full on mobile, responsive width on desktop
  - Labels: text-sm on mobile, text-base on desktop
  - Buttons: w-full on mobile (full-width), auto on desktop
- [ ] T062 Update PersonalInfoForm with responsive layout:
  - Mobile: full-width inputs, single column
  - Tablet (md): 2-column layout where appropriate
  - Desktop (lg): constrained width, centered
  - Input padding and font size responsive to screen size
- [ ] T063 Update AddressForm with responsive layout:
  - Mobile: full-width inputs, single column
  - Tablet (md): 2-column layout (street/city, state/postal code)
  - Desktop (lg): 2-column layout with constraints, right sidebar for summary
  - Country/state selects full-width on mobile, inline on desktop

### 7.3 Implementation for US5 - Touch-Friendly Interactions

- [ ] T064 Ensure all interactive elements meet minimum touch target size:
  - Buttons: min-h-12 (≥48px), min-w-12 (≥48px) on mobile
  - Form inputs: h-12 (≥48px) for comfortable touch
  - Links: py-2 px-3 minimum padding for touch
- [ ] T065 Optimize for iOS (no zoom on input focus):
  - Set font-size: 16px on all inputs (prevents auto-zoom)
  - Remove -webkit-appearance: none to use native iOS styling
  - Add touch-action: none on buttons to prevent double-tap zoom
- [ ] T066 Test and optimize for landscape orientation:
  - Inputs stack properly on mobile landscape (375×667)
  - No horizontal scrolling in landscape
  - Form remains single-column in landscape (or thin 2-column)

### 7.4 Implementation for US5 - Responsive Images

- [ ] T067 Update CheckoutSummary with responsive product images:
  - Use <picture> element or srcSet for responsive image sizes
  - Mobile: max-width: 100px (small thumbnail)
  - Tablet: max-width: 150px
  - Desktop: max-width: 200px
  - Lazy-load images below fold if checkout is long

**Checkpoint**: Checkout is fully responsive and usable on all device sizes from mobile phones to desktop monitors; touch interactions are friendly and appropriately sized.

---

## Phase 8: User Story 6 - Accessibility Compliance (Priority: P1)

**Goal**: All users, including those using keyboard navigation or screen readers, can complete checkout without barriers (WCAG 2.1 AA compliance)

**Independent Test**: Complete checkout using keyboard-only navigation and with screen reader (NVDA/JAWS); all form labels, error messages, and buttons are announced correctly

### 8.1 Tests for US6

- [ ] T068 [P] Create keyboard navigation test in `tests/accessibility/keyboard-nav.test.tsx`:
  - Test Tab key moves focus through all interactive elements in logical order (top-to-bottom)
  - Test all buttons are accessible via keyboard
  - Test form fields are accessible with Tab key
  - Test error messages are announced when errors occur
  - Test focus is visible (visible outline on all focused elements)
  - Test Escape key cancels form (optional enhancement)
- [ ] T069 [P] Create screen reader test in `tests/accessibility/screen-reader.test.tsx`:
  - Test all form labels are announced with their inputs
  - Test error messages are announced and role="alert" on FormError
  - Test form sections have aria-label (e.g., "Personal Information")
  - Test button purposes are announced ("Continue", "Place Order", etc.)
  - Test field requirements are announced (required fields marked with *)
  - Test form step progress is announced (e.g., "Step 2 of 5")
- [ ] T070 [P] Create color contrast test using axe:
  - Test all text has color contrast ≥4.5:1 (WCAG AA standard)
  - Test error colors (red) meet contrast requirements
  - Test links and buttons have sufficient contrast
- [ ] T071 [P] Create form semantics test:
  - Test all inputs have associated labels (htmlFor and id connected)
  - Test form structure is logical (fieldset for address sections)
  - Test error messages linked via aria-describedby

### 8.2 Implementation for US6 - ARIA Attributes

- [ ] T072 Update all form components with semantic HTML and ARIA attributes:
  - All inputs have <label> with htmlFor matching input id
  - All inputs have aria-invalid="true" when error exists
  - Error messages have id and linked via aria-describedby on input
  - Form sections have role="region" aria-label="Section Name"
  - Form has main heading <h1> or <h2> with clear purpose
- [ ] T073 Update PersonalInfoForm with accessibility features:
  - Wrap form in <fieldset> with legend
  - Add aria-label="Personal Information Form"
  - Link error spans via aria-describedby
  - All inputs are properly labeled
  - Use semantic <input type="email"> and <input type="tel">
- [ ] T074 Update AddressForm with accessibility features:
  - Separate fieldsets for billing and shipping addresses
  - Billing section: <fieldset><legend>Billing Address</legend>...</fieldset>
  - Shipping section toggles display based on useShippingAsBilling checkbox
  - All selects (Country, State) are properly labeled
  - Dynamic state list: announce updates via aria-live="polite"
- [ ] T075 Update PaymentForm with accessibility features:
  - Add aria-label to card input (identify what card field it is)
  - Link all inline errors via aria-describedby
  - Ensure card number input label identifies it as "Card Number"
  - CVV field has aria-label or label explaining what it is
  - Validate and announce card type detection (Visa, Amex, etc.)

### 8.3 Implementation for US6 - Keyboard Navigation

- [ ] T076 Ensure all interactive elements are keyboard accessible:
  - All buttons focusable via Tab key
  - All form inputs focusable and editable
  - Tab order is logical: top to bottom, left to right
  - Remove tabindex="0" or negative indexes unless necessary
  - Focus visible indicator on all elements (use outline or custom styling)
- [ ] T077 Update StepNavigation with keyboard support:
  - Back and Next buttons accept Enter/Space key activation
  - Button focus is visibly highlighted
  - No keyboard trap (focus can leave any element via Tab)
- [ ] T078 Add focus management on form validation:
  - When validation error occurs, focus moves to erroneous field
  - Use useRef and focus() to move focus programmatically
  - Announce error to screen reader via aria-live region

### 8.4 Implementation for US6 - Visual Indicators

- [ ] T079 Add visual focus indicators:
  - Override default focus outline with custom style (ring from Tailwind)
  - Apply focus indicators to all interactive elements
  - Contrast of focus indicator ≥3:1 against background
  - Use explicit focus-visible or focus-ring utility
- [ ] T080 Add error visual indicators (beyond color):
  - Error fields show red border (color indicator)
  - Error fields also show icon (✗ or ⚠️) for colorblind users
  - Error text below field reinforces the error (text indicator)
  - Combine multiple indicators for accessibility
- [ ] T081 Add form submission status announcements:
  - Initially: "Submit button. Press to place order."
  - While loading: "Form is being submitted. Please wait." (aria-busy)
  - After success: "Order placed successfully. Order number: ..."
  - After error: "Order submission failed. [Error message]"

### 8.5 Implementation for US6 - Testing

- [ ] T082 Run automated accessibility audit:
  - Install and run `axe-core` or `jest-axe`
  - Add accessibility test to all checkout components
  - Fix all violations before launch (WCAG 2.1 AA level)
- [ ] T083 Manual testing with screen reader:
  - Test with NVDA (Windows) on at least one component
  - Verify form labels are announced
  - Verify error messages are announced
  - Verify form structure is clear to screen reader user

**Checkpoint**: Checkout is fully accessible via keyboard and screen reader; WCAG 2.1 AA compliance verified; all users can complete checkout regardless of assistive technology.

---

## Phase 9: Polish, Testing & Cross-Cutting Concerns (Week 4)

**Purpose**: Quality improvements, final testing, documentation, and deployment readiness

### 9.1 Code Quality & Cleanup

- [ ] T084 [P] Code cleanup: remove console.logs, unused variables, dead code
- [ ] T085 [P] Add TypeScript strict mode check (if not already enabled)
- [ ] T086 [P] ESLint and Prettier formatting pass on all checkout files

### 9.2 Performance Optimization

- [ ] T087 [P] Profile bundle size: ensure checkout path <200KB gzipped
- [ ] T088 [P] Optimize images: convert to WebP, add srcSet for responsive sizes
- [ ] T089 Lazy-load country/state data: fetch on AddressForm mount, cache in localStorage (7-day TTL)
- [ ] T090 Memoize form components: apply React.memo to reduce re-renders on store updates
- [ ] T091 Use Zustand selectors to prevent unnecessary re-renders: `store((state) => state.currentStep)`

### 9.3 Full Integration Testing

- [ ] T092 [P] End-to-end test for complete happy path (all steps, valid data, success)
- [ ] T093 [P] E2E test for error path (validation errors, correction, resubmission)
- [ ] T094 [P] E2E test for navigation (back/forward, edit, form preservation)
- [ ] T095 E2E test for mobile and desktop layouts (responsive design verification)
- [ ] T096 E2E test for accessibility (keyboard nav, screen reader with test runner)

### 9.4 API Integration & Mocking

- [ ] T097 Update API client error handling with proper retry logic and logging
- [ ] T098 Create mocked API services for development/testing (mock payment endpoints)
- [ ] T099 Test API integration with real backend (smoke test against staging API)

### 9.5 Documentation & Quickstart

- [ ] T100 [P] Create developer README in src/components/checkout/README.md:
  - Architecture overview
  - Component hierarchy
  - State management guide
  - How to add new fields or steps
  - Testing instructions
- [ ] T101 Create user documentation: checkout flow walkthrough (for support team)
- [ ] T102 Create deployment checklist: environment variables, API endpoints, payment processor keys

### 9.6 Deployment Preparation

- [ ] T103 [P] Verify environment variables configured (.env.local, staging, production)
- [ ] T104 [P] Verify HTTPS is enforced (required for payment forms)
- [ ] T105 [P] Verify CORS is configured for API endpoints
- [ ] T106 [P] Verify rate limiting is configured on payment endpoints
- [ ] T107 [P] Configure error monitoring (Sentry, LogRocket, etc.)
- [ ] T108 [P] Configure analytics tracking (GA events for checkout steps, payment success/failure)
- [ ] T109 [P] Security review: CSP headers, X-Frame-Options, authentication, PCI compliance
- [ ] T110 Set up Stripe/payment processor webhook for order status updates (future enhancement)

### 9.7 Final QA & Validation

- [ ] T111 [P] Run accessibility audit with axe DevTools browser extension
- [ ] T112 [P] Test on real devices: iPhone, iPad, Android phone, desktop browsers
- [ ] T113 [P] Test cross-browser: Chrome, Firefox, Safari, Edge (latest 2 versions)
- [ ] T114 Validate specification compliance: ensure all acceptance criteria from spec.md are met
- [ ] T115 Validate constitutional compliance: ensure all 6 principles are embodied (Code Quality, Test-First, Responsive Design, Accessibility, Error Handling, Validation)
- [ ] T116 Performance audit with Lighthouse: FCP <2s, LCP <2.5s, CLS <0.1

**Checkpoint**: Checkout is production-ready, tested across browsers and devices, accessible, performant, and compliant with all requirements and constitution.

---

## Dependencies & Execution Order

### Phase Dependencies

1. **Setup (Phase 1)**: No dependencies - start immediately ✓
2. **Core Components (Phase 2)**: Depends on Setup completion - MUST complete before user stories
3. **User Stories (Phases 3-8)**: Depend on Core Components completion
   - **Phase 3 (US1)**: Foundation - CAN RUN FIRST (most critical for MVP)
   - **Phase 4 (US2)**: Validation - CAN RUN IN PARALLEL (different tests/components)
   - **Phase 5 (US3)**: Navigation - CAN RUN IN PARALLEL (extends US1 functionality)
   - **Phase 6 (US4)**: Error Handling - CAN RUN IN PARALLEL (separate error paths)
   - **Phase 7 (US5)**: Responsive - CAN RUN IN PARALLEL (CSS-only, no component changes)
   - **Phase 8 (US6)**: Accessibility - CAN RUN IN PARALLEL (attributes, no component logic)
4. **Polish & Testing (Phase 9)**: Depends on all user stories - final integration and QA

### Critical Path (Minimum for MVP)

**Minimum viable: Complete Phases 1 → 2 → 3 (US1 only)**
- Gives users ability to complete checkout with valid data and see confirmation
- Foundation for all other user stories
- Can be deployed and monetized immediately
- Users can test entire flow, identify issues

**Recommended MVP+: Phases 1 → 2 → 3 → 4 → 6** (US1, US2, Error Handling)
- Add validation feedback and error recovery
- Users won't lose work due to validation errors
- Payment failures won't trap users
- ~1 week of development

### Parallel Opportunities by Phase

**Phase 1 (Setup)**:
- T002 (dependencies), T003 (env vars) run in parallel [P]
- T004 (types), T005 (types exports) run in parallel [P]
- All can start immediately, complete in 1 day

**Phase 2 (Core)**:
- T012 (FormError), T013 (StepNav), T014 (useFormStepNav) run in parallel [P]
- Complete Phase 1 before starting Phase 2

**Phase 3 (US1 - Critical Path)**:
- All tests (T017-T022) run in parallel [P]
- Components (T023-T028) run in sequence (some dependencies on types/store)
- Start implementation after store complete (T010-T011)

**Phases 4-8 (User Stories)**:
- **All user story phases can run IN PARALLEL** after Phase 2 completes
- Assign different team members to US2, US3, US4, US5, US6
- US1 and US2 tests (T017-T033) run in parallel
- Reduces total delivery time from 4 weeks (sequential) to ~2 weeks (parallel)

**Phase 9 (Polish)**:
- All [P] marked tasks run in parallel (cleanup, optimization, docs)
- Final integration testing (T092-T096) requires all stories complete
- Start non-blocking tasks (T084-T091) while waiting for stories

### Parallel Example: Week 2 Execution

```
Team Member 1: US1 (Phase 3) - Checksum happy path
  T012-T028: Form components, store submission

Team Member 2: US2 (Phase 4) - Validation & Error Handling
  T030-T038: Validation tests, error display, form preservation

Team Member 3: US5 (Phase 7) - Responsive Design
  T057-T067: Responsive tests, Tailwind CSS updates
  (Can test alongside US1/US2 components)

Team Member 4: US6 (Phase 8) - Accessibility
  T068-T083: Accessibility tests, ARIA attributes, keyboard nav
  (Can run in parallel with all component work)

All: Phase 2 (T012-T014) - Complete first before component work

Result: All stories ready by end of Week 2, ready for Phase 9 QA
```

---

## Success Criteria (Definition of Done)

**All tasks completed when:**

✅ **Functional**:
- [ ] Users can complete checkout in <3 minutes (happy path)
- [ ] Form validation errors appear inline within 500ms
- [ ] Payment processes within 15 seconds average
- [ ] Checkout works on mobile (375px), tablet (768px), desktop (1920px+)
- [ ] Users can go back/forward without losing data
- [ ] Form state preserved across browser refresh
- [ ] Payment failures show ACTIONABLE error messages
- [ ] Duplicate orders prevented by idempotency

**Quality**:
- [ ] All unit tests pass (99%+ coverage for business logic)
- [ ] All integration tests pass (happy path + error paths)
- [ ] Accessibility audit passes: WCAG 2.1 AA (axe automated + manual screen reader testing)
- [ ] Cross-browser testing passes: Chrome, Firefox, Safari, Edge (last 2 versions)
- [ ] Mobile testing passes: iPhone, iPad, Android (real devices or emulator)
- [ ] Performance audit passes: Lighthouse FCP <2s, LCP <2.5s, CLS <0.1
- [ ] Code review approved by team lead
- [ ] No TypeScript errors or eslint violations

**Constitutional Compliance**:
- [ ] ✅ Code Quality: Type-safe (TypeScript), well-structured, documented
- [ ] ✅ Test-First: All components have tests written BEFORE implementation
- [ ] ✅ Responsive Design: Works on all device sizes (mobile-first approach)
- [ ] ✅ Accessibility: WCAG 2.1 AA compliant (keyboard nav, screen reader)
- [ ] ✅ Error Handling: All error paths tested, actionable user messages
- [ ] ✅ Validation Logic: Comprehensive client + server validation

**Deployment Ready**:
- [ ] Environment variables documented (.env.example)
- [ ] HTTPS enabled for payment forms
- [ ] CORS configured for API endpoints
- [ ] API contracts implemented and tested against real backend
- [ ] Error monitoring configured (Sentry/LogRocket)
- [ ] Analytics tracking configured
- [ ] Deployment checklist completed (T103-T109)
- [ ] Release notes written

---

## MVP Recommendation

**🎯 For fastest time-to-market MVP:**

**Scope**: Phase 1 + Phase 2 + Phase 3 (US1 only) + selectedPhase 9 tasks
**Timeline**: 1 week
**Team Size**: 2 developers
**User Benefit**: Users can complete checkout with valid data and receive order confirmation

**Gives you:**
- ✅ Revenue-generating checkout flow
- ✅ 90% of user journeys covered (happy path is 90% of traffic)
- ✅ Foundation for all other stories
- ✅ Real user feedback to prioritize Phase 4-8

**Does NOT include (Phase 4+):**
- ❌ Inline validation errors (Phase 4)
- ❌ Back button navigation (Phase 5)
- ❌ Error recovery guidance (Phase 6)
- ❌ Responsive design polish (Phase 7)
- ❌ Accessibility (Phase 8) - ONLY if legally required

**Recommended MVP+**: Add Phase 4 (validation) + Phase 6 (error handling)
- **Timeline**: 2 weeks
- **User Benefit**: Form tells users what's wrong + payment failures don't trap them
- Covers ~95% of real-world usage patterns
- Minimizes support tickets (clear errors)

**Full Feature Release**: All Phases 1-9
- **Timeline**: 4 weeks
- **User Benefit**: Professional-grade, accessible, responsive checkout
- Fully compliant with all specifications and constitutional principles

---

## Task Statistics

**Total Tasks**: 116

**By Phase**:
- Phase 1 (Setup): 9 tasks
- Phase 2 (Foundation): 3 tasks
- Phase 3 (US1): 23 tasks (including 6 test tasks)
- Phase 4 (US2): 9 tasks (including 4 test tasks)
- Phase 5 (US3): 10 tasks (including 2 test tasks)
- Phase 6 (US4): 14 tasks (including 4 test tasks)
- Phase 7 (US5): 20 tasks (including 4 test tasks)
- Phase 8 (US6): 24 tasks (including 4 test tasks)
- Phase 9 (Polish): 27 tasks

**Implementation**: 69 tasks (~60%)
**Tests**: 34 tasks (~29%)
**Documentation & QA**: 13 tasks (~11%)

**Parallelizable [P]**: ~40% of tasks can run in parallel (different files, no block dependencies)

**MVP Scope** (Phase 1-3): 35 tasks → 1 week
**MVP+ Scope** (Phase 1-4 + Phase 6): 58 tasks → 2 weeks
**Full Scope** (Phase 1-9): 116 tasks → 4 weeks

---

## Task Status Template

Track completion using this format:

- [ ] = Not started (red 🔴)
- [x] = Completed (green ✅)
- [w] = In progress (yellow 🟡)

Use search/replace to update status:
- `- [ ]` → `- [ ]` (not started)
- `- [ ]` → `- [w]` (in progress)
- `- [w]` → `- [x]` (completed)

Example tracking:
- [x] T001 Create project structure per implementation plan
- [w] T002 Install new dependencies
- [ ] T003 Create environment variables template
