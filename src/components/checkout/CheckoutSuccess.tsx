import { Button } from "@/components/ui/button"
import { useCheckout } from "@/hooks/useCheckout"

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

export function CheckoutSuccess() {
  const { orderId, cartItems, cartTotal, personalInfo, billingAddress, paymentMethod, resetCheckout } = useCheckout()

  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Order Confirmed</h2>
      <p className="mt-1 text-sm text-muted-foreground">Thank you, your order has been placed successfully.</p>

      <div className="mt-5 rounded-xl bg-muted/30 p-4">
        <p className="text-sm text-muted-foreground">Order number</p>
        <p className="text-lg font-semibold">{orderId}</p>
      </div>

      <div className="mt-5 space-y-3 text-sm">
        <p>
          <span className="font-medium">Customer:</span> {personalInfo?.fullName}
        </p>
        <p>
          <span className="font-medium">Email:</span> {personalInfo?.email}
        </p>
        <p>
          <span className="font-medium">Address:</span> {billingAddress?.streetAddress}, {billingAddress?.city}, {billingAddress?.state}
        </p>
        <p>
          <span className="font-medium">Payment:</span> {paymentMethod?.cardType?.toUpperCase()} ending in {paymentMethod?.last4Digits}
        </p>
      </div>

      <ul className="mt-5 space-y-2 text-sm">
        {cartItems.map((item) => (
          <li key={item.id} className="flex items-center justify-between">
            <span>
              {item.name} x {item.quantity}
            </span>
            <span>{formatCurrency(item.price * item.quantity)}</span>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between border-t border-border pt-4 font-semibold">
        <span>Total</span>
        <span>{formatCurrency(cartTotal)}</span>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button type="button" className="min-h-12 flex-1" onClick={resetCheckout}>
          Continue Shopping
        </Button>
      </div>
    </section>
  )
}
