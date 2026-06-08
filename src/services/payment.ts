import { CheckoutSchema } from "@/lib/validation"
import type { AddressData, CartItem, PaymentMethodData, PersonalInfoData } from "@/types"

export interface SubmitCheckoutPayload {
  personalInfo: PersonalInfoData
  billingAddress: AddressData
  shippingAddress: AddressData
  paymentMethod: PaymentMethodData
  cartItems: CartItem[]
  cartTotal: number
}

export interface CheckoutResponse {
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

export interface CountryOption {
  code: string
  name: string
}

export interface StateOption {
  code: string
  name: string
}

const COUNTRY_OPTIONS: CountryOption[] = [
  { code: "US", name: "United States" },
  { code: "CA", name: "Canada" },
  { code: "LE", name: "Lebanon" },
  { code: "SY", name: "Syria" },
  { code: "JO", name: "Jordan" },
]

const STATE_OPTIONS: Record<string, StateOption[]> = {
  US: [
    { code: "CA", name: "California" },
    { code: "NY", name: "New York" },
    { code: "TX", name: "Texas" },
  ],
  CA: [
    { code: "ON", name: "Ontario" },
    { code: "QC", name: "Quebec" },
    { code: "BC", name: "British Columbia" },
  ],
  LE: [
    { code: "BE", name: "Beirut" },
    { code: "SA", name: "Saida" },
    { code: "TR", name: "Tripoli" },
  ],
  SY: [
    { code: "DM", name: "Damascus" },
    { code: "AL", name: "Aleppo" },
    { code: "HM", name: "Homs" },
  ],
  JO: [
    { code: "AM", name: "Amman" },
    { code: "IR", name: "Irbid" },
    { code: "AQ", name: "Aqaba" },
  ],
}

function buildValidationError(details: Record<string, string>): CheckoutResponse {
  return {
    success: false,
    error: {
      code: "VALIDATION_ERROR",
      message: "Validation failed for one or more fields.",
      details,
    },
  }
}

export async function submitCheckout(
  payload: SubmitCheckoutPayload,
  idempotencyKey: string
): Promise<CheckoutResponse> {
  const parsed = CheckoutSchema.safeParse({
    ...payload,
    paymentMethod: {
      ...payload.paymentMethod,
      cardNumber: payload.paymentMethod.cardNumber ?? "",
      cvv: payload.paymentMethod.cvv ?? "",
    },
  })

  if (!parsed.success) {
    const details: Record<string, string> = {}
    parsed.error.issues.forEach((issue) => {
      details[issue.path.join(".")] = issue.message
    })
    return buildValidationError(details)
  }

  await new Promise((resolve) => setTimeout(resolve, 300))

  return {
    success: true,
    order: {
      orderId: `ORD-${idempotencyKey.slice(0, 8).toUpperCase()}`,
      status: "completed",
      createdAt: new Date().toISOString(),
    },
  }
}

export async function validateAddress(address: AddressData): Promise<{ valid: boolean; message?: string }> {
  const valid =
    address.streetAddress.trim().length >= 5 &&
    address.city.trim().length >= 2 &&
    address.state.trim().length >= 2 &&
    address.postalCode.trim().length >= 3 &&
    address.country.trim().length === 2

  if (valid) {
    return { valid: true }
  }

  return { valid: false, message: "Address is incomplete or invalid." }
}

export async function getCountries(): Promise<CountryOption[]> {
  return COUNTRY_OPTIONS
}

export async function getStates(countryCode: string): Promise<StateOption[]> {
  return STATE_OPTIONS[countryCode] ?? []
}
