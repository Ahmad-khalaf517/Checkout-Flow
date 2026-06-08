# Data Model & Domain Architecture

**Feature**: 001-payment-checkout-flow

**Date**: 2026-06-08

---

## 1. Core Domain Entities

### 1.1 Checkout Session

**Purpose**: Represents the user's current checkout journey; persists form state across steps.

**Entity Definition**:
```
CheckoutSession {
  sessionId: UUID (immutable, unique per checkout)
  userId: UUID (nullable; guest checkout allowed)
  status: 'draft' | 'submitted' | 'completed' | 'abandoned'
  
  // Step tracking
  currentStep: 1-6 (summary → personal → address → payment → review → confirmation)
  
  // Form data
  personalInfo: PersonalInfo (nullable until step 2 complete)
  billingAddress: Address (nullable until step 3 complete)
  shippingAddress: Address (nullable or same as billing)
  useShippingAsBilling: boolean (default: true)
  paymentMethod: PaymentMethodToken (never raw card data)
  
  // Cart snapshot
  cartItems: CartItem[] (products in this checkout)
  cartTotal: integer (amount in cents, immutable)
  currency: string (defaults to 'USD', deferred to v2)
  
  // Processing
  idempotencyKey: string (prevents duplicate submissions)
  isProcessing: boolean
  processingError: string | null
  
  // Audit
  createdAt: ISO8601DateTime
  updatedAt: ISO8601DateTime
  abandonedAt: ISO8601DateTime | null
  expiresAt: ISO8601DateTime (30 days from creation; cleanup job)
}
```

**Lifecycle**:
1. Session created when user lands on checkout page (Step 1)
2. Session data updated as user progresses through steps (Steps 2-4)
3. Session submitted when user clicks "Place Order" (Step 5 → Step 6)
4. Session marked completed on successful payment
5. Session marked abandoned if user closes browser (client-side unload) or TTL expires (30 days)

**Relationships**:
- Checkout Session has 1 Order (created after successful payment)
- Checkout Session has M CartItem[] (snapshot of cart at checkout time)
- Checkout Session has 1 User (nullable if guest checkout)

---

### 1.2 PersonalInfo

**Purpose**: End-user contact information collected in Step 2.

**Entity Definition**:
```
PersonalInfo {
  fullName: string (2-100 chars, validated regex)
  email: string (max 255 chars, RFC 5322 format)
  phoneNumber: string (10-15 digits, international format)
}
```

**Validation Rules**:
- `fullName`: Must contain at least 2 characters; can include letters, spaces, hyphens, apostrophes
- `email`: Must be valid email format; used for order confirmation notification
- `phoneNumber`: 10-15 digits only; international support (no country code prefix required)

**Storage**:
- Stored in CheckoutSession during checkout (transient)
- Duplicated in Order after successful payment (permanent)
- PII protection: Can be encrypted at rest if compliance requires

---

### 1.3 Address

**Purpose**: Billing and/or shipping address collected in Step 3.

**Entity Definition**:
```
Address {
  streetAddress: string (5-100 chars, street address line)
  city: string (2-50 chars, city name)
  state: string (2-3 char code, ISO 3166-2 format, e.g., 'CA', 'TX', 'QC')
  postalCode: string (3-20 chars, country+state-specific format)
  country: string (2-char ISO 3166-1 alpha-2 code, e.g., 'US', 'CA', 'GB')
  
  // Optional fields (for v2)
  addressLine2: string | null (apt, suite, etc.)
  isDefault: boolean (for returning customers; v2 feature)
}
```

**Validation Rules**:
- `streetAddress`: Required; minimum 5 characters
- `city`: Required; only letters, spaces, hyphens, apostrophes
- `state`: Required; 2-3 character code (validated against country)
- `postalCode`: Required; format varies by country
  - US ZIP: 5 digits (XXXXX) or 9 digits with +4 (XXXXX-XXXX)
  - Canadian postal code: A1A 1A1 format
  - UK postcode: AAAA AAA, AAAA AA, etc.
- `country`: Required; 2-character ISO code

**Storage**:
- Billing address stored in CheckoutSession (transient)
- Shipping address stored if different from billing
- Both addresses duplicated in Order after successful payment
- Subject to address retention policies (PII protection)

---

### 1.4 PaymentMethod

**Purpose**: Payment card information collected in Step 4 (never stored as raw data).

**Entity Definition** (Client-side form capture):
```
PaymentMethodFormData {
  cardholderName: string (cardholder name, matches PersonalInfo.fullName)
  cardNumber: string (16 digits for Visa/MC; 15 for Amex; raw input masked)
  expiryDate: string (MM/YY format, e.g., '12/25')
  cvv: string (3-4 digits, never logged or stored)
}
```

**Entity Definition** (Stored in Order & CheckoutSession):
```
PaymentMethodToken {
  token: string (Stripe/Square payment token, not raw card data)
  cardholderName: string (from form input)
  cardType: enum ('visa' | 'mastercard' | 'amex' | 'discover')
  last4Digits: string (last 4 digits for display only, e.g., '4242')
  expiryDate: string (MM/YY format, public)
  
  // Never stored:
  // - Full card number (NEVER)
  // - CVV (NEVER)
}
```

**Validation Rules**:
- `cardNumber`: 13-19 digits; passes Luhn algorithm check
- `expiryDate`: MM/YY format; must not be expired; must not be >20 years in future
- `cvv`: 3 digits for Visa/Mastercard/Discover; 4 digits for Amex
- `cardholderName`: 2-100 characters; matches full name field (UX hint)

**PCI DSS Compliance**:
- Raw card data is **NEVER** sent to your backend server
- Use Stripe, Square, or similar payment processor for tokenization
- Only the `token` (and non-sensitive fields) sent to server
- CVV is **NEVER stored** anywhere (discarded after tokenization)
- Payment method is treated as write-only; no retrieval after submission

---

### 1.5 CartItem

**Purpose**: Represents product in the shopping cart at checkout time.

**Entity Definition**:
```
CartItem {
  id: string (product SKU or UUID)
  name: string (product name)
  description: string | null (optional short description)
  quantity: integer (1+)
  price: integer (unit price in cents, e.g., 2999 = $29.99)
  image: string | null (optional product image URL)
  
  // Calculated fields (read-only)
  subtotal: integer (price * quantity, in cents)
}
```

**Relationships**:
- CartItem is part of CheckoutSession.cartItems[]
- CartItem snapshot is copied to Order.items[] (immutable after order)

---

### 1.6 Order

**Purpose**: Permanent record of a completed or failed payment transaction.

**Entity Definition**:
```
Order {
  orderId: string (UUID or database auto-increment)
  sessionId: string (reference to original CheckoutSession)
  userId: string | null (customer ID if authenticated; null for guest)
  
  // Collected checkout data (immutable snapshot)
  personalInfo: PersonalInfo (copy from checkout session)
  billingAddress: Address (copy from checkout session)
  shippingAddress: Address (copy from checkout session or same as billing)
  
  // Payment info (never includes raw card data)
  paymentMethod: PaymentMethodToken (tokenized card; last4Digits only)
  
  // Items & totals
  items: CartItem[] (snapshot of cart at checkout time)
  itemsSubtotal: integer (sum of all items in cents)
  shippingCost: integer (0 for v1; calculated server-side in v2)
  tax: integer (calculated server-side; varies by shipping address)
  orderTotal: integer (itemsSubtotal + shippingCost + tax)
  currency: string (USD for v1)
  
  // Order state
  status: enum (
    'pending' = payment submitted, awaiting processing
    'completed' = payment approved, order ready to ship
    'failed' = payment declined or processing failed
    'cancelled' = user cancelled or admin cancelled
  )
  paymentId: string (reference from payment processor, e.g., Stripe charge ID)
  
  // Audit trail
  createdAt: ISO8601DateTime (when order was placed)
  processedAt: ISO8601DateTime | null (when payment was processed)
  shippedAt: ISO8601DateTime | null (when order shipped; v2 feature)
  deliveredAt: ISO8601DateTime | null (when order delivered; v2 feature)
  
  // Error handling
  failureReason: string | null (if status = 'failed'; e.g., 'card_declined')
  failureDetails: JSON | null (additional context for debugging)
}
```

**Lifecycle**:
1. Order is created when CheckoutSession.submitCheckout() is called
2. Order status set to 'pending' while payment is processing
3. Upon successful tokenization & payment approval → status = 'completed'
4. Upon payment decline or error → status = 'failed'
5. Order is immutable after creation (audit trail)

**Relationships**:
- Order has 1 CheckoutSession (reference)
- Order has 1 User (if authenticated)
- Order has M Items (CartItem[])
- Order has 1 PaymentTransaction (external payment processor)

---

## 2. Data Model Diagram

```
┌─────────────────────────────┐
│      User (Optional)         │
│  ├─ userId: UUID            │
│  ├─ email: string           │
│  ├─ savedAddresses: Address[]│
│  └─ paymentMethods: [] (v2) │
└────────────┬────────────────┘
             │
             │ 1:M (optional)
             ▼
┌─────────────────────────────┐
│   CheckoutSession           │
│  ├─ sessionId: UUID         │
│  ├─ currentStep: 1-6        │
│  ├─ personalInfo: PersonalInfo
│  ├─ billingAddress: Address │
│  ├─ shippingAddress: Address│
│  ├─ paymentMethod: Token    │
│  ├─ cartItems: CartItem[]   │
│  ├─ orderTotal: int         │
│  ├─ status: draft|submitted │
│  └─ createdAt: DateTime     │
└────────────┬────────────────┘
             │
      1:1 (after submit)
             ▼
┌─────────────────────────────┐
│        Order                │
│  ├─ orderId: UUID           │
│  ├─ userId: UUID (nullable) │
│  ├─ personalInfo: PersonalInfo (snap)
│  ├─ billingAddress: Address (snap)
│  ├─ shippingAddress: Address (snap)
│  ├─ paymentMethod: PaymentMethodToken
│  ├─ items: CartItem[] (snap)
│  ├─ orderTotal: int         │
│  ├─ status: pending|completed|failed
│  ├─ processedAt: DateTime   │
│  └─ failureReason: string   │
│                             │
│  References:                │
│  ├─ → User (nullable)       │
│  ├─ → CheckoutSession       │
│  └─ → PaymentProcessor      │
└─────────────────────────────┘
```

---

## 3. Data Storage Strategy

### 3.1 Client-Side (Browser)

**Session Storage** (cleared on browser close):
- Checkout session state (Zustand store)
- Current step, form data in progress
- Cart data (cached copy)

**Local Storage** (persists across browser sessions):
- Country/State dropdown data (TTL: 7 days)
- User preferences (v2 feature)

**What NOT to store client-side**:
- Raw card data (NEVER)
- CVV (NEVER)
- Full personal information (PII protection)

### 3.2 Server-Side (Database)

**CheckoutSession Table**:
- Parent record for audit trail
- Expires after 30 days (retention policy)
- Linked to Order after successful payment

**Order Table** (Immutable):
- Permanent record of all transactions
- Retention policy: 7 years (PCI DSS compliance)
- PII encrypted at rest (email, phone, address)
- Payment token stored (not raw card data)

**PaymentTransaction Table** (External):
- Records from Stripe/Square API
- Reference ID stored in Order.paymentId
- Synced via webhook for audit trail

---

## 4. API Contracts

See separate `../contracts/api-contracts.md` document for:
- POST /orders/submit (Checkout submission)
- POST /geo/countries (List countries)
- POST /geo/states/:country (List states by country)
- POST /addresses/validate (Address validation)
- GET /orders/:orderId (Order retrieval, user)

---

## 5. Type Safety & Zod Schemas

See `plan.md` → Section 3 (Type Definitions) and Section 4 (Validation Strategies) for:
- PersonalInfoSchema
- AddressSchema
- PaymentMethodSchema
- CheckoutSchema (comprehensive)
- Luhn algorithm validation
- Expiry date validation

---

## 6. Data Retention & Privacy

### 6.1 Retention Policy

| Data | Duration | Reason |
|------|----------|--------|
| Order (completed) | 7 years | PCI DSS compliance |
| Order (failed) | 90 days | Debug failed payments |
| CheckoutSession | 30 days | Abandoned cart recovery |
| Payment Logs | 1 year | Audit trail |

### 6.2 PII Protection

- All PII (email, phone, address) encrypted at rest
- Full card numbers **NEVER** stored
- CVV **NEVER** stored anywhere
- Access logged and audited
- Deletion on request (GDPR compliance)

---

## 7. Backup & Recovery

**Checkout Session**:
- No recovery needed; considered transient
- Data lost if user closes browser mid-checkout

**Order**:
- Backed up daily to cold storage (S3/GCS)
- Recovery time: <4 hours if needed
- Immutable after creation (no accidental deletion)

**Payment Transaction**:
- Authoritative source is payment processor (Stripe/Square)
- Local record is cached reference only
- Can be re-synced from processor via API on recovery
