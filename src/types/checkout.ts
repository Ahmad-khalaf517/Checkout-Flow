export type ISO8601DateTime = string

export type CheckoutStep = 1 | 2 | 3 | 4 | 5 | 6

export interface PersonalInfoData {
  fullName: string
  email: string
  phoneNumber: string
}

export interface AddressData {
  streetAddress: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface PaymentMethodData {
  token?: string
  cardholderName: string
  cardNumber?: string
  expiryDate: string
  cvv?: string
  cardType?: "visa" | "mastercard" | "amex" | "discover" | "unknown"
  last4Digits?: string
}

export interface CartItem {
  id: string
  name: string
  quantity: number
  price: number
  image?: string
}

export interface Order {
  orderId: string
  personalInfo: PersonalInfoData
  billingAddress: AddressData
  shippingAddress: AddressData
  paymentMethod: Omit<PaymentMethodData, "cardNumber" | "cvv"> & {
    last4Digits: string
  }
  items: CartItem[]
  orderTotal: number
  status: "pending" | "completed" | "failed"
  createdAt: ISO8601DateTime
}

// export interface CheckoutResponse {
//   success: boolean
//   order?: Order
//   error?: {
//     code: string
//     message: string
//     details?: Record<string, string>
//   }
// }

export interface FieldError {
  field: string
  message: string
}

export interface CheckoutSession {
  currentStep: CheckoutStep
  personalInfo: PersonalInfoData | null
  billingAddress: AddressData | null
  shippingAddress: AddressData | null
  useShippingAsBilling: boolean
  paymentMethod: PaymentMethodData | null
  isLoadingSubmit: boolean
  submitError: string | null
  orderId: string | null
  orderStatus: "idle" | "processing" | "success" | "failed"
  cartItems: CartItem[]
  cartTotal: number
  sessionId: string
}
