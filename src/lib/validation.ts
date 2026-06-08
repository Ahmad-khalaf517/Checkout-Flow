import { z } from "zod"

const FULL_NAME_REGEX = /^[a-zA-Z\s'-]+$/
const CITY_REGEX = /^[a-zA-Z\s'-]+$/

export function luhnCheck(cardNumber: string): boolean {
  const sanitized = cardNumber.replace(/\s+/g, "")
  if (!/^\d{13,19}$/.test(sanitized)) {
    return false
  }

  let sum = 0
  let shouldDouble = false
  for (let i = sanitized.length - 1; i >= 0; i -= 1) {
    let digit = Number.parseInt(sanitized[i], 10)
    if (shouldDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }
    sum += digit
    shouldDouble = !shouldDouble
  }

  return sum % 10 === 0
}

export function isValidExpiryDate(value: string): boolean {
  const matched = value.match(/^(\d{2})\/(\d{2})$/)
  if (!matched) {
    return false
  }

  const month = Number.parseInt(matched[1], 10)
  const year = Number.parseInt(matched[2], 10)
  if (month < 1 || month > 12) {
    return false
  }

  const now = new Date()
  const currentYear = now.getFullYear() % 100
  const currentMonth = now.getMonth() + 1
  const maxFutureYear = (now.getFullYear() + 20) % 100

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return false
  }

  if (currentYear <= maxFutureYear) {
    return year <= maxFutureYear
  }

  return year <= maxFutureYear || year >= currentYear
}

export const PersonalInfoSchema = z.object({
  fullName: z
    .string()
    .min(2)
    .max(100)
    .regex(FULL_NAME_REGEX, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.email().max(255),
  phoneNumber: z
    .string()
    .regex(/^\d{10,15}$/, "Phone number must be 10-15 digits"),
})

export const AddressSchema = z.object({
  streetAddress: z.string().min(5).max(100),
  city: z
    .string()
    .min(2)
    .max(50)
    .regex(CITY_REGEX, "City name can only contain letters, spaces, hyphens, and apostrophes"),
  state: z.string().min(2).max(3),
  postalCode: z.string().min(3).max(20),
  country: z.string().length(2),
})

export const PaymentMethodSchema = z.object({
  cardholderName: z.string().min(2).max(100),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, "Card number must be 13-19 digits")
    .refine(luhnCheck, "Invalid card number"),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/)
    .refine(isValidExpiryDate, "Card has expired or expiry date is invalid"),
  cvv: z.string().regex(/^\d{3,4}$/),
})

export const CheckoutSchema = z.object({
  personalInfo: PersonalInfoSchema,
  billingAddress: AddressSchema,
  shippingAddress: AddressSchema,
  paymentMethod: PaymentMethodSchema.extend({
    token: z.string().optional(),
    last4Digits: z.string().optional(),
    cardType: z.enum(["visa", "mastercard", "amex", "discover", "unknown"]).optional(),
  }),
  cartItems: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number().int().positive(),
      price: z.number().int().nonnegative(),
      image: z.string().optional(),
    })
  ),
  cartTotal: z.number().int().nonnegative(),
})

export type PersonalInfoSchemaData = z.infer<typeof PersonalInfoSchema>
export type AddressSchemaData = z.infer<typeof AddressSchema>
export type PaymentMethodSchemaData = z.infer<typeof PaymentMethodSchema>
export type CheckoutSchemaData = z.infer<typeof CheckoutSchema>
