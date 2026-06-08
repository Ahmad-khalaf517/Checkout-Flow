import { useMemo } from "react"

import { Button } from "@/components/ui/button"
import type { CartItem } from "@/types"

interface CheckoutSummaryProps {
  items: CartItem[]
  total: number
  onContinue: () => void
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(cents / 100)
}

export function CheckoutSummary({ items, total, onContinue }: CheckoutSummaryProps) {
  const itemCount = useMemo(() => items.reduce((acc, item) => acc + item.quantity, 0), [items])

  return (
    <section aria-label="Order summary" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Checkout Summary</h2>
      <p className="mt-2 text-sm text-muted-foreground">Review your items before continuing to personal details.</p>

      <ul className="mt-6 space-y-4">
        {items.map((item) => (
          <li key={item.id} className="flex items-center gap-4 rounded-xl bg-muted/40 p-3">
            {item.image ? (
              <img
                src={item.image}
                alt={item.name}
                className="h-16 w-16 rounded-lg object-cover"
                loading="lazy"
                width={64}
                height={64}
              />
            ) : (
              <div className="h-16 w-16 rounded-lg bg-muted" aria-hidden="true" />
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{item.name}</p>
              <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
            </div>

            <p className="font-medium">{formatCurrency(item.price * item.quantity)}</p>
          </li>
        ))}
      </ul>

      <div className="mt-6 rounded-xl bg-background p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Items ({itemCount})</span>
          <span className="font-medium">{formatCurrency(total)}</span>
        </div>
        <div className="mt-2 flex items-center justify-between text-base font-semibold">
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>

      <Button type="button" className="mt-6 min-h-12 w-full" onClick={onContinue}>
        Continue to Personal Info
      </Button>
    </section>
  )
}
