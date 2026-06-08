import type { CheckoutStep } from "@/types"

interface UseFormStepNavigationOptions {
  currentStep: CheckoutStep
  minStep?: CheckoutStep
  maxStep?: CheckoutStep
  onBack?: (nextStep: CheckoutStep) => void
  onNext?: (nextStep: CheckoutStep) => void
}

export function useFormStepNavigation({
  currentStep,
  minStep = 1,
  maxStep = 6,
  onBack,
  onNext,
}: UseFormStepNavigationOptions) {
  const canGoBack = currentStep > minStep
  const canGoNext = currentStep < maxStep

  const goBack = () => {
    if (!canGoBack) {
      return
    }
    onBack?.((currentStep - 1) as CheckoutStep)
  }

  const goNext = () => {
    if (!canGoNext) {
      return
    }
    onNext?.((currentStep + 1) as CheckoutStep)
  }

  return {
    canGoBack,
    canGoNext,
    goBack,
    goNext,
  }
}
