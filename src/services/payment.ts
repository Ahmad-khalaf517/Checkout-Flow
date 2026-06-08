// import { apiClient } from "@/lib/api-client"
// import type { AddressData, CheckoutResponse, PaymentMethodData, PersonalInfoData } from "@/types"

// export interface SubmitCheckoutPayload {
//   personalInfo: PersonalInfoData
//   billingAddress: AddressData
//   shippingAddress: AddressData
//   paymentMethod: PaymentMethodData
//   cartItems: Array<{ id: string; name: string; quantity: number; price: number; image?: string }>
//   cartTotal: number
// }

// export interface CountryOption {
//   code: string
//   name: string
// }

// export interface StateOption {
//   code: string
//   name: string
// }

// const RETRY_DELAYS_MS = [1000, 2000, 4000]

// function isRetryableError(error: unknown): boolean {
//   if (!(error instanceof Error)) {
//     return false
//   }

//   const message = error.message.toLowerCase()
//   return message.includes("timeout") || message.includes("network") || message.includes("failed")
// }

// async function withRetries<T>(operation: () => Promise<T>): Promise<T> {
//   let lastError: unknown = null

//   for (let index = 0; index <= RETRY_DELAYS_MS.length; index += 1) {
//     try {
//       return await operation()
//     } catch (error) {
//       lastError = error
//       if (!isRetryableError(error) || index === RETRY_DELAYS_MS.length) {
//         break
//       }
//       const delay = RETRY_DELAYS_MS[index]
//       await new Promise((resolve) => setTimeout(resolve, delay))
//     }
//   }

//   throw lastError
// }

// export async function submitCheckout(
//   payload: SubmitCheckoutPayload,
//   idempotencyKey: string
// ): Promise<CheckoutResponse> {
//   return withRetries(() =>
//     apiClient.post<CheckoutResponse>("/api/orders/submit", payload, {
//       headers: {
//         "Idempotency-Key": idempotencyKey,
//       },
//     })
//   )
// }

// export async function validateAddress(address: AddressData): Promise<{ valid: boolean; message?: string }> {
//   return withRetries(() => apiClient.post<{ valid: boolean; message?: string }>("/api/addresses/validate", address))
// }

// export async function getCountries(): Promise<CountryOption[]> {
//   const response = await apiClient.get<{ success: boolean; data: CountryOption[] }>("/api/geo/countries")
//   return response.data
// }

// export async function getStates(countryCode: string): Promise<StateOption[]> {
//   const response = await apiClient.get<{ success: boolean; data: StateOption[] }>(`/api/geo/states/${countryCode}`)
//   return response.data
// }
