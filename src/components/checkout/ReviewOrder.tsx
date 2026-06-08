import { Button } from "@/components/ui/button"
import { useCheckout } from "@/hooks/useCheckout"

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

export function ReviewOrder() {
  const {
    personalInfo,
    billingAddress,
    shippingAddress,
    useShippingAsBilling,
    paymentMethod,
    cartItems,
    cartTotal,
    isLoadingSubmit,
    goToStep,
    submitOrder,
  } = useCheckout()

  const safeShipping = useShippingAsBilling ? billingAddress : shippingAddress

  return (
    <section aria-live="polite" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Review Order</h2>
      <p className="mt-1 text-sm text-muted-foreground">Confirm your details before placing the order.</p>

      <div className="mt-6 space-y-5">
        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Personal info</h3>
            <Button variant="link" size="sm" type="button" onClick={() => goToStep(2)}>
              Edit
            </Button>
          </div>
          <p className="text-sm">{personalInfo?.fullName}</p>
          <p className="text-sm text-muted-foreground">{personalInfo?.email}</p>
          <p className="text-sm text-muted-foreground">{personalInfo?.phoneNumber}</p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Billing address</h3>
            <Button variant="link" size="sm" type="button" onClick={() => goToStep(3)}>
              Edit
            </Button>
          </div>
          <p className="text-sm">{billingAddress?.streetAddress}</p>
          <p className="text-sm text-muted-foreground">
            {billingAddress?.city}, {billingAddress?.state} {billingAddress?.postalCode}
          </p>
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Shipping address</h3>
            <Button variant="link" size="sm" type="button" onClick={() => goToStep(3)}>
              Edit
            </Button>
          </div>
          {useShippingAsBilling ? (
            <p className="text-sm text-muted-foreground">Same as billing address</p>
          ) : (
            <>
              <p className="text-sm">{safeShipping?.streetAddress}</p>
              <p className="text-sm text-muted-foreground">
                {safeShipping?.city}, {safeShipping?.state} {safeShipping?.postalCode}
              </p>
            </>
          )}
        </div>

        <div className="rounded-xl bg-muted/30 p-4">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Payment</h3>
            <Button variant="link" size="sm" type="button" onClick={() => goToStep(4)}>
              Edit
            </Button>
          </div>
          <p className="text-sm">{paymentMethod?.cardType?.toUpperCase() ?? "CARD"} ending in {paymentMethod?.last4Digits}</p>
          <p className="text-sm text-muted-foreground">Expires {paymentMethod?.expiryDate}</p>
        </div>

        <div className="rounded-xl bg-background p-4">
          <h3 className="font-semibold">Items</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {cartItems.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>
                  {item.name} x {item.quantity}
                </span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 border-t border-border pt-3 text-sm">
            <div className="flex items-center justify-between">
              <span>Subtotal</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Shipping</span>
              <span>{formatCurrency(0)}</span>
            </div>
            <div className="flex items-center justify-between font-semibold">
              <span>Total</span>
              <span>{formatCurrency(cartTotal)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
        <Button type="button" variant="outline" className="min-h-12 w-full sm:w-auto" onClick={() => goToStep(4)}>
          Back
        </Button>
        <Button type="button" className="min-h-12 w-full sm:w-auto" disabled={isLoadingSubmit} onClick={() => void submitOrder()}>
          {isLoadingSubmit ? "Placing order..." : "Place Order"}
        </Button>
      </div>
    </section>
  )
}
