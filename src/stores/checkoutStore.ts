import { create } from "zustand"

import { AddressSchema, CheckoutSchema, PaymentMethodSchema, PersonalInfoSchema } from "@/lib/validation"
import { submitCheckout } from "@/services/payment"
import type { AddressData, CartItem, CheckoutSession, CheckoutStep, PaymentMethodData, PersonalInfoData } from "@/types"

const initialCartItems: CartItem[] = [
  {
    id: "SKU-001",
    name: "Water Filter Bundle",
    quantity: 1,
    price: 7999,
    image: "https://images.unsplash.com/photo-1563306406-e66174fa3787?auto=format&fit=crop&w=400&q=80",
  },
]

const initialSession = (): CheckoutSession => ({
  currentStep: 1,
  personalInfo: null,
  billingAddress: null,
  shippingAddress: null,
  useShippingAsBilling: true,
  paymentMethod: null,
  isLoadingSubmit: false,
  submitError: null,
  orderId: null,
  orderStatus: "idle",
  cartItems: initialCartItems,
  cartTotal: initialCartItems.reduce((total, item) => total + item.price * item.quantity, 0),
  sessionId: crypto.randomUUID(),
})

function canMoveForward(state: CheckoutSession, targetStep: CheckoutStep): boolean {
  if (targetStep <= state.currentStep) {
    return true
  }

  switch (state.currentStep) {
    case 1:
      return true
    case 2:
      return state.personalInfo ? PersonalInfoSchema.safeParse(state.personalInfo).success : false
    case 3: {
      const billingValid = state.billingAddress ? AddressSchema.safeParse(state.billingAddress).success : false
      const shippingAddress = state.useShippingAsBilling ? state.billingAddress : state.shippingAddress
      const shippingValid = shippingAddress ? AddressSchema.safeParse(shippingAddress).success : false
      return billingValid && shippingValid
    }
    case 4:
      return state.paymentMethod
        ? PaymentMethodSchema.safeParse({
            cardholderName: state.paymentMethod.cardholderName,
            cardNumber: state.paymentMethod.cardNumber ?? "",
            expiryDate: state.paymentMethod.expiryDate,
            cvv: state.paymentMethod.cvv ?? "",
          }).success
        : false
    case 5:
      return true
    case 6:
      return false
    default:
      return false
  }
}

export interface CheckoutStore extends CheckoutSession {
  goToStep: (step: CheckoutStep) => void
  updatePersonalInfo: (value: PersonalInfoData) => void
  updateBillingAddress: (value: AddressData) => void
  updateShippingAddress: (value: AddressData) => void
  setUseShippingAsBilling: (value: boolean) => void
  updatePaymentMethod: (value: PaymentMethodData) => void
  submitOrder: () => Promise<void>
  resetCheckout: () => void
  setError: (message: string) => void
  clearError: () => void
  restoreSession: (value: Partial<CheckoutSession>) => void
}

export const useCheckoutStore = create<CheckoutStore>((set, get) => ({
  ...initialSession(),
  goToStep: (step) => {
    const state = get()

    if (step > state.currentStep && !canMoveForward(state, step)) {
      set({ submitError: "Please complete all required fields in this step before continuing." })
      return
    }

    set({ currentStep: step, submitError: null })
  },
  updatePersonalInfo: (value) => set({ personalInfo: value }),
  updateBillingAddress: (value) => set({ billingAddress: value }),
  updateShippingAddress: (value) => set({ shippingAddress: value }),
  setUseShippingAsBilling: (value) => set({ useShippingAsBilling: value }),
  updatePaymentMethod: (value) => set({ paymentMethod: value }),
  setError: (message) => set({ submitError: message }),
  clearError: () => set({ submitError: null }),
  resetCheckout: () => {
    set(initialSession())
  },
  restoreSession: (value) => {
    set((state) => ({
      ...state,
      ...value,
      sessionId: value.sessionId ?? state.sessionId,
      cartItems: value.cartItems ?? state.cartItems,
      cartTotal: value.cartTotal ?? state.cartTotal,
    }))
  },
  submitOrder: async () => {
    const state = get()
    if (!state.personalInfo || !state.billingAddress || !state.paymentMethod) {
      set({ submitError: "Complete all required steps before placing your order." })
      return
    }

    const shippingAddress = state.useShippingAsBilling
      ? state.billingAddress
      : state.shippingAddress ?? state.billingAddress

    const validation = CheckoutSchema.safeParse({
      personalInfo: state.personalInfo,
      billingAddress: state.billingAddress,
      shippingAddress,
      paymentMethod: {
        ...state.paymentMethod,
        cardNumber: state.paymentMethod.cardNumber ?? "4242424242424242",
        cvv: state.paymentMethod.cvv ?? "123",
      },
      cartItems: state.cartItems,
      cartTotal: state.cartTotal,
    })

    if (!validation.success) {
      set({ submitError: validation.error.issues[0]?.message ?? "Validation failed." })
      return
    }

    set({ isLoadingSubmit: true, orderStatus: "processing", submitError: null })

    try {
      const response = await submitCheckout(
        {
          personalInfo: state.personalInfo,
          billingAddress: state.billingAddress,
          shippingAddress,
          paymentMethod: state.paymentMethod,
          cartItems: state.cartItems,
          cartTotal: state.cartTotal,
        },
        state.sessionId
      )

      if (!response.success || !response.order) {
        throw new Error(response.error?.message ?? "Unable to submit order")
      }

      set({
        isLoadingSubmit: false,
        orderId: response.order.orderId,
        orderStatus: "success",
        currentStep: 6,
      })
    } catch (error) {
      set({
        isLoadingSubmit: false,
        orderStatus: "failed",
        submitError: error instanceof Error ? error.message : "Unable to submit order",
        currentStep: 6,
      })
    }
  },
}))
