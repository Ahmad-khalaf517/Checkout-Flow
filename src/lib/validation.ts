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
    .min(2, "Full name must be at least 2 characters long")
    .max(100, "Full name must be 100 characters or fewer")
    .regex(FULL_NAME_REGEX, "Full name can only contain letters, spaces, hyphens, and apostrophes"),
  email: z.string().email("Enter a valid email address").max(255, "Email must be 255 characters or fewer"),
  phoneNumber: z
    .string()
    .regex(/^\d{10,15}$/, "Phone number must be 10-15 digits"),
})

export const AddressSchema = z.object({
  streetAddress: z
    .string()
    .min(5, "Street address must be at least 5 characters long")
    .max(100, "Street address must be 100 characters or fewer"),
  city: z
    .string()
    .min(2, "City must be at least 2 characters long")
    .max(50, "City must be 50 characters or fewer")
    .regex(CITY_REGEX, "City name can only contain letters, spaces, hyphens, and apostrophes"),
  state: z.string().min(2, "State or region is required").max(3, "State or region code is too long"),
  postalCode: z.string().min(3, "Postal code is required").max(20, "Postal code is too long"),
  country: z.string().length(2, "Please choose a country"),
})

export const PaymentMethodSchema = z.object({
  cardholderName: z
    .string()
    .min(2, "Cardholder name must be at least 2 characters long")
    .max(100, "Cardholder name must be 100 characters or fewer"),
  cardNumber: z
    .string()
    .regex(/^\d{13,19}$/, "Card number must be 13-19 digits")
    .refine(luhnCheck, "Invalid card number"),
  expiryDate: z
    .string()
    .regex(/^\d{2}\/\d{2}$/, "Enter expiry as MM/YY")
    .refine(isValidExpiryDate, "Card has expired or expiry date is invalid"),
  cvv: z.string().regex(/^\d{3,4}$/, "CVV must be 3 or 4 digits"),
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
