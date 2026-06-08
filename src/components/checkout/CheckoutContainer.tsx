import { useEffect, useMemo } from "react"

import { AddressForm } from "@/components/checkout/AddressForm"
import { CheckoutError } from "@/components/checkout/CheckoutError"
import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { CheckoutSuccess } from "@/components/checkout/CheckoutSuccess"
import { PaymentForm } from "@/components/checkout/PaymentForm"
import { PersonalInfoForm } from "@/components/checkout/PersonalInfoForm"
import { ReviewOrder } from "@/components/checkout/ReviewOrder"
import { useCheckout } from "@/hooks/useCheckout"
import { CHECKOUT_STEPS } from "@/constants/checkout"

const CHECKOUT_STORAGE_KEY = "checkout-flow-session"
const CHECKOUT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

export function CheckoutContainer() {
  const {
    currentStep,
    cartItems,
    cartTotal,
    orderStatus,
    personalInfo,
    billingAddress,
    shippingAddress,
    paymentMethod,
    useShippingAsBilling,
    restoreSession,
    goToStep,
  } = useCheckout()

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(CHECKOUT_STORAGE_KEY)
      if (!raw) {
        return
      }

      const parsed = JSON.parse(raw) as { updatedAt: number; state: unknown }
      if (!parsed?.updatedAt || !parsed?.state) {
        return
      }

      if (Date.now() - parsed.updatedAt > CHECKOUT_SESSION_TTL_MS) {
        sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
        return
      }

      restoreSession(parsed.state as Record<string, unknown>)
    } catch {
      sessionStorage.removeItem(CHECKOUT_STORAGE_KEY)
    }
  }, [restoreSession])

  useEffect(() => {
    const payload = {
      updatedAt: Date.now(),
      state: {
        currentStep,
        cartItems,
        cartTotal,
        personalInfo,
        billingAddress,
        shippingAddress,
        paymentMethod,
        useShippingAsBilling,
      },
    }

    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload))
  }, [
    billingAddress,
    cartItems,
    cartTotal,
    currentStep,
    paymentMethod,
    personalInfo,
    shippingAddress,
    useShippingAsBilling,
  ])

  const stepLabel = useMemo(() => CHECKOUT_STEPS.find((step) => step.step === currentStep)?.title ?? "Checkout", [currentStep])

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.15),transparent_40%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25))] p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded-2xl border border-border bg-card/90 p-6 backdrop-blur">
          <p className="text-sm font-medium text-primary">Step {currentStep} of 6</p>
          <h1 className="mt-1 text-2xl font-semibold">{stepLabel}</h1>
        </header>

        {currentStep === 1 ? <CheckoutSummary items={cartItems} total={cartTotal} onContinue={() => goToStep(2)} /> : null}
        {currentStep === 2 ? <PersonalInfoForm /> : null}
        {currentStep === 3 ? <AddressForm /> : null}
        {currentStep === 4 ? <PaymentForm /> : null}
        {currentStep === 5 ? <ReviewOrder /> : null}
        {currentStep === 6 ? (orderStatus === "success" ? <CheckoutSuccess /> : <CheckoutError />) : null}
      </div>
    </main>
  )
}
