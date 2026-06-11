import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, useWatch } from "react-hook-form"
import { CreditCard, Sparkles } from "lucide-react"
import { FormError } from "@/components/checkout/FormError"
import { Button } from "@/components/ui/button"
import { useCheckout } from "@/hooks/useCheckout"
import {
  PaymentMethodSchema,
  type PaymentMethodSchemaData,
} from "@/lib/validation"
import { TooltipContent, TooltipTrigger, Tooltip } from "../ui/tooltip"
import { generateLuhnId } from "@/lib/utils"

const fieldClassName =
  "mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"

function detectCardType(
  cardNumber: string
): "visa" | "mastercard" | "amex" | "discover" | "unknown" {
  if (/^4/.test(cardNumber)) {
    return "visa"
  }
  if (/^(5[1-5]|2[2-7])/.test(cardNumber)) {
    return "mastercard"
  }
  if (/^3[47]/.test(cardNumber)) {
    return "amex"
  }
  if (/^6(?:011|5)/.test(cardNumber)) {
    return "discover"
  }
  return "unknown"
}

function maskCardNumber(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 19)
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ")
}

function normalizeCardNumber(value: string): string {
  return value.replace(/\s/g, "")
}

function formatExpiry(value: string): string {
  const digits = value.replace(/\D/g, "").slice(0, 4)
  if (digits.length <= 2) {
    return digits
  }
  return `${digits.slice(0, 2)}/${digits.slice(2)}`
}

export function PaymentForm() {
  const { paymentMethod, updatePaymentMethod, goToStep } = useCheckout()

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<PaymentMethodSchemaData>({
    resolver: zodResolver(PaymentMethodSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      cardholderName: paymentMethod?.cardholderName ?? "",
      cardNumber: paymentMethod?.cardNumber ?? "",
      expiryDate: paymentMethod?.expiryDate ?? "",
      cvv: paymentMethod?.cvv ?? "",
    },
  })

  const cardNumberValue = useWatch({ control, name: "cardNumber" })
  const expiryDateValue = useWatch({ control, name: "expiryDate" })

  const onSubmit = (data: PaymentMethodSchemaData) => {
    const normalizedCardNumber = normalizeCardNumber(data.cardNumber)
    const cardType = detectCardType(normalizedCardNumber)

    updatePaymentMethod({
      cardholderName: data.cardholderName,
      cardNumber: normalizedCardNumber,
      expiryDate: data.expiryDate,
      cvv: data.cvv,
      token: `tok_${crypto.randomUUID().replace(/-/g, "")}`,
      cardType,
      last4Digits: normalizedCardNumber.slice(-4),
    })

    goToStep(5)
  }

  return (
    <section
      role="region"
      aria-label="Payment details"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Payment</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter card details to continue to review.
      </p>

      <form
        className="mt-6 space-y-4"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <div>
          <label htmlFor="cardholderName" className="text-sm font-medium">
            Cardholder name
          </label>
          <input
            id="cardholderName"
            className={fieldClassName}
            aria-invalid={errors.cardholderName ? "true" : "false"}
            aria-describedby={
              errors.cardholderName ? "cardholderName-error" : undefined
            }
            {...register("cardholderName")}
          />
          <FormError
            id="cardholderName-error"
            message={errors.cardholderName?.message}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <label htmlFor="cardNumber" className="text-sm font-medium whitespace-nowrap">
            Card number
          </label>
          <input
            id="cardNumber"
            inputMode="numeric"
            className={fieldClassName}
            aria-invalid={errors.cardNumber ? "true" : "false"}
            aria-describedby={
              errors.cardNumber ? "cardNumber-error" : undefined
            }
            value={maskCardNumber(cardNumberValue ?? "")}
            onChange={(event) => {
              setValue("cardNumber", normalizeCardNumber(event.target.value), {
                shouldValidate: true,
              })
            }}
            onBlur={() => {
              setValue(
                "cardNumber",
                normalizeCardNumber(cardNumberValue ?? ""),
                { shouldValidate: true, shouldTouch: true }
              )
            }}
          />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => {
                  const generatedCard = generateLuhnId(16)
                  setValue("cardNumber", generatedCard, { shouldValidate: true, shouldTouch: true })
                }}
                type="button"
                variant="outline"
                className="h-12 px-2 mt-1 bg-amber-400 text-white"
              >
                <CreditCard className="h-4 w-4 text-blue-900" /> Generate 
                <Sparkles className="h-3.5 w-3.5 fill-amber-400 text-blue-900" />

              </Button>
            </TooltipTrigger>
            <TooltipContent>
              Generate a valid card number{" "}
            </TooltipContent>
          </Tooltip>
          <FormError
            id="cardNumber-error"
            message={errors.cardNumber?.message}

          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="expiryDate" className="text-sm font-medium">
              Expiry (MM/YY)
            </label>
            <input
              id="expiryDate"
              className={fieldClassName}
              aria-invalid={errors.expiryDate ? "true" : "false"}
              aria-describedby={
                errors.expiryDate ? "expiryDate-error" : undefined
              }
              value={expiryDateValue ?? ""}
              onChange={(event) => {
                setValue("expiryDate", formatExpiry(event.target.value), {
                  shouldValidate: true,
                })
              }}
              onBlur={() => {
                setValue("expiryDate", formatExpiry(expiryDateValue ?? ""), {
                  shouldValidate: true,
                  shouldTouch: true,
                })
              }}
            />
            <FormError
              id="expiryDate-error"
              message={errors.expiryDate?.message}
            />
          </div>
          <div>
            <label htmlFor="cvv" className="text-sm font-medium">
              CVV
            </label>
            <input
              id="cvv"
              inputMode="numeric"
              className={fieldClassName}
              aria-invalid={errors.cvv ? "true" : "false"}
              aria-describedby={errors.cvv ? "cvv-error" : undefined}
              {...register("cvv")}
            />
            <FormError id="cvv-error" message={errors.cvv?.message} />
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={() => goToStep(3)}
          >
            Back
          </Button>
          <Button type="submit" className="min-h-12 w-full sm:w-auto">
            Review Order
          </Button>
        </div>
      </form>
    </section>
  )
}
