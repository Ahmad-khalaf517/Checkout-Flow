import { useCheckoutStore } from "@/stores/checkoutStore"

export function useCheckout() {
  return useCheckoutStore()
}
