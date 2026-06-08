# Frontend Contracts: Local Checkout Adapters

**Feature**: 001-payment-checkout-flow  
**Date**: 2026-06-08

This phase intentionally avoids backend calls. Contracts below define local interfaces that emulate external boundaries while keeping future integration straightforward.

## 1. Checkout Submission Contract

```ts
type SubmitCheckoutPayload = {
  personalInfo: PersonalInfoData
  billingAddress: AddressData
  shippingAddress: AddressData
  paymentMethod: PaymentMethodData
  cartItems: CartItem[]
  cartTotal: number
}

type CheckoutResponse = {
  success: boolean
  order?: {
    orderId: string
    status: "completed"
    createdAt: string
  }
  error?: {
    code: string
    message: string
    details?: Record<string, string>
  }
}

type SubmitCheckout = (payload: SubmitCheckoutPayload, idempotencyKey: string) => Promise<CheckoutResponse>
```

Behavior in this phase:
- If payload is valid according to `CheckoutSchema`, return `success: true`.
- If payload is invalid, return `success: false` with validation details.
- No HTTP/fetch call is performed.

## 2. Geo Options Contract

```ts
type CountryOption = { code: string; name: string }
type StateOption = { code: string; name: string }

type GetCountries = () => Promise<CountryOption[]>
type GetStates = (countryCode: string) => Promise<StateOption[]>
```

Behavior in this phase:
- Returns static, local options from frontend constants.

## 3. Address Validation Contract

```ts
type AddressValidationResult = {
  valid: boolean
  message?: string
}

type ValidateAddress = (address: AddressData) => Promise<AddressValidationResult>
```

Behavior in this phase:
- Performs synchronous rule checks wrapped in a Promise.
- No network verification.

## 4. Future Backend Compatibility

When backend scope is enabled:
- Keep contract shapes unchanged.
- Replace local adapter implementations with API client calls.
- Preserve idempotency key parameter and response envelope.
