# Data Model: Frontend-Only Checkout

**Feature**: 001-payment-checkout-flow  
**Date**: 2026-06-08

## 1. Entities

### 1.1 CheckoutSession

Represents all state needed to drive the multi-step checkout UI.

```ts
CheckoutSession {
  sessionId: string
  currentStep: 1 | 2 | 3 | 4 | 5 | 6
  personalInfo: PersonalInfoData | null
  billingAddress: AddressData | null
  shippingAddress: AddressData | null
  useShippingAsBilling: boolean
  paymentMethod: PaymentMethodData | null
  cartItems: CartItem[]
  cartTotal: number
  isLoadingSubmit: boolean
  submitError: string | null
  orderId: string | null
  orderStatus: "idle" | "processing" | "success" | "failed"
}
```

### 1.2 PersonalInfoData

```ts
PersonalInfoData {
  fullName: string
  email: string
  phoneNumber: string
}
```

Validation:
- fullName: 2-100 chars, letters/spaces/hyphen/apostrophe
- email: valid email, max 255
- phoneNumber: 10-15 digits

### 1.3 AddressData

```ts
AddressData {
  streetAddress: string
  city: string
  state: string
  postalCode: string
  country: string
}
```

Validation:
- streetAddress: 5-100 chars
- city: 2-50 chars, letters/spaces/hyphen/apostrophe
- state: 2-3 chars
- postalCode: 3-20 chars
- country: ISO alpha-2 code

### 1.4 PaymentMethodData

```ts
PaymentMethodData {
  cardholderName: string
  cardNumber?: string
  expiryDate: string
  cvv?: string
  token?: string
  cardType?: "visa" | "mastercard" | "amex" | "discover" | "unknown"
  last4Digits?: string
}
```

Notes:
- In this phase, token generation is simulated on frontend.
- Raw card fields are used only for client-side validation and are not persisted beyond session state.

### 1.5 LocalOrderReceipt

```ts
LocalOrderReceipt {
  orderId: string
  createdAt: string // ISO8601
  status: "completed"
  items: CartItem[]
  orderTotal: number
  personalInfo: PersonalInfoData
  billingAddress: AddressData
  shippingAddress: AddressData
  paymentMethod: {
    cardType?: string
    last4Digits?: string
    expiryDate: string
    cardholderName: string
  }
}
```

## 2. Relationships

- CheckoutSession aggregates PersonalInfoData, AddressData, PaymentMethodData, and CartItem[].
- LocalOrderReceipt is produced from valid CheckoutSession submit action.

## 3. State Transitions

1. `idle` -> `processing` when submit starts.
2. `processing` -> `success` when schema validation passes.
3. `processing` -> `failed` only when validation fails or unexpected client error occurs.

## 4. Persistence Model

- `sessionStorage` stores checkout session snapshot with TTL.
- Expired sessions are discarded during restore.
