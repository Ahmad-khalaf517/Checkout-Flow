import { Button } from "@/components/ui/button"
import { useCheckout } from "@/hooks/useCheckout"

export function CheckoutError() {
  const { submitError, orderId, goToStep, clearError } = useCheckout()

  return (
    <section className="rounded-2xl border border-destructive/40 bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-destructive">Unable to place order</h2>
      <p className="mt-2 text-sm text-muted-foreground">{submitError ?? "Please review your details and try again."}</p>
      {orderId ? (
        <p className="mt-2 text-sm text-muted-foreground">
          Reference order number: <span className="font-medium">{orderId}</span>
        </p>
      ) : null}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          type="button"
          className="min-h-12 flex-1"
          onClick={() => {
            clearError()
            goToStep(4)
          }}
        >
          Retry Payment
        </Button>
        <Button
          type="button"
          variant="outline"
          className="min-h-12 flex-1"
          onClick={() => {
            clearError()
            goToStep(4)
          }}
        >
          Use Different Card
        </Button>
      </div>
    </section>
  )
}
