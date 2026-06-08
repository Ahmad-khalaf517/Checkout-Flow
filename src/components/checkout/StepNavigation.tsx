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

  return (
    <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
      <div>
        {step > 1 ? (
          <Button type="button" variant="outline" className="min-h-12 w-full sm:w-auto" onClick={onBack}>
            Back
          </Button>
        ) : null}
      </div>

      {step === 5 ? (
        <Button type="button" className="min-h-12 w-full sm:w-auto" disabled={isSubmitting} onClick={onPlaceOrder}>
          {isSubmitting ? "Placing order..." : "Place Order"}
        </Button>
      ) : (
        <Button type="button" className="min-h-12 w-full sm:w-auto" onClick={onNext}>
          {step === 1 ? "Continue" : "Continue"}
        </Button>
      )}
    </div>
  )
}
