import { useEffect, useMemo, useRef, useState } from "react"
import { CheckCircle2, X } from "lucide-react"

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
    orderId,
    submitError,
    personalInfo,
    billingAddress,
    shippingAddress,
    paymentMethod,
    useShippingAsBilling,
    restoreSession,
    goToStep,
  } = useCheckout()
  const [successToast, setSuccessToast] = useState<string | null>(null)
  const previousOrderStatus = useRef(orderStatus)

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

  useEffect(() => {
    if (previousOrderStatus.current !== "success" && orderStatus === "success" && orderId) {
      setSuccessToast(`Order ${orderId} placed successfully.`)
    }

    previousOrderStatus.current = orderStatus
  }, [orderId, orderStatus])

  useEffect(() => {
    if (!successToast) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      setSuccessToast(null)
    }, 5000)

    return () => window.clearTimeout(timeoutId)
  }, [successToast])

  const stepLabel = useMemo(() => CHECKOUT_STEPS.find((step) => step.step === currentStep)?.title ?? "Checkout", [currentStep])

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.15),transparent_40%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25))] p-4 sm:p-8">
      {successToast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed right-4 top-4 z-50 flex w-[min(92vw,24rem)] items-start gap-3 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-emerald-950 shadow-lg animate-checkout-toast-in dark:border-emerald-900/60 dark:bg-emerald-950 dark:text-emerald-50"
        >
          <CheckCircle2 className="mt-0.5 size-5 shrink-0" />
          <div className="min-w-0 flex-1 text-sm font-medium">{successToast}</div>
          <button
            type="button"
            className="rounded-full p-1 transition hover:bg-emerald-100/80 dark:hover:bg-emerald-900/60"
            aria-label="Dismiss success notification"
            onClick={() => setSuccessToast(null)}
          >
            <X className="size-4" />
          </button>
        </div>
      ) : null}

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
        {currentStep === 6 ? (orderStatus === "success" ? <CheckoutSuccess /> : <CheckoutError key={submitError ?? orderId ?? "checkout-error"} />) : null}
      </div>
    </main>
  )
}
