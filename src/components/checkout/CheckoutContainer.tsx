import { useEffect, useMemo } from "react"

import { CheckoutSummary } from "@/components/checkout/CheckoutSummary"
import { StepNavigation } from "@/components/checkout/StepNavigation"
import { useCheckout } from "@/hooks/useCheckout"
import { useFormStepNavigation } from "@/hooks/useFormStepNavigation"
import { CHECKOUT_STEPS } from "@/constants/checkout"

const CHECKOUT_STORAGE_KEY = "checkout-flow-session"
const CHECKOUT_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30

function PlaceholderStep({ title }: { title: string }) {
  return (
    <section className="rounded-2xl border border-dashed border-border bg-card p-6">
      <h2 className="text-xl font-semibold">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground">This step foundation is ready and can now be implemented in detail.</p>
    </section>
  )
}

export function CheckoutContainer() {
  const {
    currentStep,
    cartItems,
    cartTotal,
    orderStatus,
    submitError,
    isLoadingSubmit,
    goToStep,
    submitOrder,
    restoreSession,
  } = useCheckout()

  const { goBack, goNext, canGoBack } = useFormStepNavigation({
    currentStep,
    maxStep: 5,
    onBack: (step) => goToStep(step),
    onNext: (step) => goToStep(step),
  })

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
      },
    }

    sessionStorage.setItem(CHECKOUT_STORAGE_KEY, JSON.stringify(payload))
  }, [cartItems, cartTotal, currentStep])

  const stepLabel = useMemo(() => CHECKOUT_STEPS.find((step) => step.step === currentStep)?.title ?? "Checkout", [currentStep])

  return (
    <main className="min-h-svh bg-[radial-gradient(circle_at_top,hsl(var(--primary)/0.15),transparent_40%),linear-gradient(180deg,hsl(var(--background)),hsl(var(--muted)/0.25))] p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <header className="rounded-2xl border border-border bg-card/90 p-6 backdrop-blur">
          <p className="text-sm font-medium text-primary">Step {currentStep} of 6</p>
          <h1 className="mt-1 text-2xl font-semibold">{stepLabel}</h1>
        </header>

        {currentStep === 1 ? <CheckoutSummary items={cartItems} total={cartTotal} onContinue={goNext} /> : null}
        {currentStep === 2 ? <PlaceholderStep title="Personal Information" /> : null}
        {currentStep === 3 ? <PlaceholderStep title="Address" /> : null}
        {currentStep === 4 ? <PlaceholderStep title="Payment" /> : null}
        {currentStep === 5 ? <PlaceholderStep title="Review Order" /> : null}
        {currentStep === 6 ? (
          <section className="rounded-2xl border border-border bg-card p-6">
            <h2 className="text-xl font-semibold">{orderStatus === "success" ? "Order Confirmed" : "Order Failed"}</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {orderStatus === "success"
                ? "Your order was placed successfully."
                : submitError ?? "We were unable to process this order."}
            </p>
          </section>
        ) : null}

        <StepNavigation
          step={currentStep}
          isSubmitting={isLoadingSubmit}
          onBack={canGoBack ? goBack : undefined}
          onNext={goNext}
          onPlaceOrder={submitOrder}
        />
      </div>
    </main>
  )
}
