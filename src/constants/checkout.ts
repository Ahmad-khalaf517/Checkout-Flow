export const CHECKOUT_STEPS = [
  { step: 1, title: "Summary" },
  { step: 2, title: "Personal information" },
  { step: 3, title: "Address" },
  { step: 4, title: "Payment" },
  { step: 5, title: "Review" },
  { step: 6, title: "Result" },
] as const

export const CHECKOUT_FIELD_LABELS = {
  fullName: "Full name",
  email: "Email",
  phoneNumber: "Phone number",
  streetAddress: "Street address",
  city: "City",
  state: "State",
  postalCode: "Postal code",
  country: "Country",
  cardholderName: "Cardholder name",
  cardNumber: "Card number",
  expiryDate: "Expiry date",
  cvv: "CVV",
} as const

export const CHECKOUT_ERROR_MESSAGES = {
  required: "This field is required",
  fullName: "Full name must be 2 to 100 characters and contain valid letters",
  email: "Please enter a valid email address",
  phoneNumber: "Phone number must be 10-15 digits",
  streetAddress: "Street address must be 5 to 100 characters",
  city: "City must be 2 to 50 characters and contain valid letters",
  state: "State code must be 2-3 characters",
  postalCode: "Postal code must be 3-20 characters",
  country: "Country code must be 2 characters",
  cardholderName: "Cardholder name must be 2 to 100 characters",
  cardNumber: "Card number is invalid",
  expiryDate: "Expiry date must be a valid MM/YY date in the future",
  cvv: "CVV must be 3-4 digits",
  server: "Something went wrong. Please try again.",
} as const
