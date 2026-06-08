import { Button } from "@/components/ui/button"
import type { CheckoutStep } from "@/types"

interface StepNavigationProps {
  step: CheckoutStep
  isSubmitting?: boolean
  onBack?: () => void
  onNext?: () => void
  onPlaceOrder?: () => void
}

export function StepNavigation({ step, isSubmitting = false, onBack, onNext, onPlaceOrder }: StepNavigationProps) {
  if (step === 6) {
    return null
  }

  const showBack = step >= 2 && step <= 5
  const showContinue = step >= 1 && step <= 4
  const showPlaceOrder = step === 5

  const continueLabel = step === 4 ? "Review Order" : "Continue"

  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <div>
        {showBack ? (
          <Button type="button" variant="outline" className="min-h-12 w-full sm:w-auto" onClick={onBack}>
            Back
          </Button>
        ) : null}
      </div>

      {showPlaceOrder ? (
        <Button type="button" className="min-h-12 w-full sm:w-auto" disabled={isSubmitting} onClick={onPlaceOrder}>
          {isSubmitting ? "Placing order..." : "Place Order"}
        </Button>
      ) : null}

      {showContinue ? (
        <Button type="button" className="min-h-12 w-full sm:w-auto" onClick={onNext}>
          {continueLabel}
        </Button>
      ) : null}
    </div>
  )
}
