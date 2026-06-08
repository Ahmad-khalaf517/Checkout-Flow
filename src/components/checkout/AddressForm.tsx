import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm, useWatch } from "react-hook-form"
import { z } from "zod"

import { FormError } from "@/components/checkout/FormError"
import { Button } from "@/components/ui/button"
import { useCheckout } from "@/hooks/useCheckout"
import { AddressSchema, type AddressSchemaData } from "@/lib/validation"
import { getCountries, getStates, type CountryOption, type StateOption } from "@/services/payment"

const fieldClassName =
  "mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"

interface AddressFormValues {
  billingAddress: AddressSchemaData
  shippingAddress: AddressSchemaData
  useShippingAsBilling: boolean
}

const AddressFormSchema = z
  .object({
    billingAddress: AddressSchema,
    shippingAddress: AddressSchema,
    useShippingAsBilling: z.boolean(),
  })
  .superRefine((value, context) => {
    if (value.useShippingAsBilling) {
      return
    }

    const parsed = AddressSchema.safeParse(value.shippingAddress)
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        context.addIssue({
          code: "custom",
          path: ["shippingAddress", ...issue.path],
          message: issue.message,
        })
      })
    }
  })

const emptyAddress: AddressSchemaData = {
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
}

export function AddressForm() {
  const {
    billingAddress,
    shippingAddress,
    useShippingAsBilling,
    updateBillingAddress,
    updateShippingAddress,
    setUseShippingAsBilling,
    goToStep,
  } = useCheckout()

  const [countries, setCountries] = useState<CountryOption[]>([])
  const [billingStates, setBillingStates] = useState<StateOption[]>([])
  const [shippingStates, setShippingStates] = useState<StateOption[]>([])

  const {
    register,
    handleSubmit,
    formState: { errors },
    control,
    trigger,
  } = useForm<AddressFormValues>({
    resolver: zodResolver(AddressFormSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: {
      billingAddress: billingAddress ?? emptyAddress,
      shippingAddress: shippingAddress ?? emptyAddress,
      useShippingAsBilling,
    },
  })

  const billingCountry = useWatch({ control, name: "billingAddress.country" })
  const shippingCountry = useWatch({ control, name: "shippingAddress.country" })
  const sameAsBilling = useWatch({ control, name: "useShippingAsBilling" })

  useEffect(() => {
    if (!sameAsBilling) {
      void trigger("shippingAddress")
    }
  }, [sameAsBilling, trigger])

  useEffect(() => {
    const loadCountries = async () => {
      const values = await getCountries()
      setCountries(values)
    }

    void loadCountries()
  }, [])

  useEffect(() => {
    const loadStates = async () => {
      const states = await getStates(billingCountry)
      setBillingStates(states)
    }
    void loadStates()
  }, [billingCountry])

  useEffect(() => {
    const loadStates = async () => {
      const states = await getStates(shippingCountry)
      setShippingStates(states)
    }
    void loadStates()
  }, [shippingCountry])

  const onSubmit = (data: AddressFormValues) => {
    updateBillingAddress(data.billingAddress)
    setUseShippingAsBilling(data.useShippingAsBilling)
    if (data.useShippingAsBilling) {
      updateShippingAddress(data.billingAddress)
    } else {
      updateShippingAddress(data.shippingAddress)
    }
    goToStep(4)
  }

  return (
    <section role="region" aria-label="Address details" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Address</h2>
      <p className="mt-1 text-sm text-muted-foreground">Enter billing and shipping details for this order.</p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)} noValidate>
        <fieldset className="space-y-4">
          <legend className="text-sm font-semibold">Billing address</legend>

          <div>
            <label htmlFor="billingStreet" className="text-sm font-medium">
              Street address
            </label>
            <input
              id="billingStreet"
              className={fieldClassName}
              aria-invalid={errors.billingAddress?.streetAddress ? "true" : "false"}
              aria-describedby={errors.billingAddress?.streetAddress ? "billingStreet-error" : undefined}
              {...register("billingAddress.streetAddress")}
            />
            <FormError id="billingStreet-error" message={errors.billingAddress?.streetAddress?.message} />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="billingCity" className="text-sm font-medium">
                City
              </label>
              <input
                id="billingCity"
                className={fieldClassName}
                aria-invalid={errors.billingAddress?.city ? "true" : "false"}
                aria-describedby={errors.billingAddress?.city ? "billingCity-error" : undefined}
                {...register("billingAddress.city")}
              />
              <FormError id="billingCity-error" message={errors.billingAddress?.city?.message} />
            </div>
            <div>
              <label htmlFor="billingState" className="text-sm font-medium">
                State
              </label>
              <select
                id="billingState"
                className={fieldClassName}
                aria-invalid={errors.billingAddress?.state ? "true" : "false"}
                aria-describedby={errors.billingAddress?.state ? "billingState-error" : undefined}
                {...register("billingAddress.state")}
              >
                <option value="">Select state</option>
                {billingStates.map((state) => (
                  <option key={state.code} value={state.code}>
                    {state.name}
                  </option>
                ))}
              </select>
              <FormError id="billingState-error" message={errors.billingAddress?.state?.message} />
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="billingPostal" className="text-sm font-medium">
                Postal code
              </label>
              <input
                id="billingPostal"
                className={fieldClassName}
                aria-invalid={errors.billingAddress?.postalCode ? "true" : "false"}
                aria-describedby={errors.billingAddress?.postalCode ? "billingPostal-error" : undefined}
                {...register("billingAddress.postalCode")}
              />
              <FormError id="billingPostal-error" message={errors.billingAddress?.postalCode?.message} />
            </div>
            <div>
              <label htmlFor="billingCountry" className="text-sm font-medium">
                Country
              </label>
              <select
                id="billingCountry"
                className={fieldClassName}
                aria-invalid={errors.billingAddress?.country ? "true" : "false"}
                aria-describedby={errors.billingAddress?.country ? "billingCountry-error" : undefined}
                {...register("billingAddress.country")}
              >
                {countries.map((country) => (
                  <option key={country.code} value={country.code}>
                    {country.name}
                  </option>
                ))}
              </select>
              <FormError id="billingCountry-error" message={errors.billingAddress?.country?.message} />
            </div>
          </div>
        </fieldset>

        <div className="flex items-center gap-2">
          <input id="sameAsBilling" type="checkbox" className="size-4" {...register("useShippingAsBilling")} />
          <label htmlFor="sameAsBilling" className="text-sm font-medium">
            Shipping address is the same as billing
          </label>
        </div>

        {!sameAsBilling ? (
          <fieldset className="space-y-4" aria-live="polite">
            <legend className="text-sm font-semibold">Shipping address</legend>

            <div>
              <label htmlFor="shippingStreet" className="text-sm font-medium">
                Street address
              </label>
              <input
                id="shippingStreet"
                className={fieldClassName}
                aria-invalid={errors.shippingAddress?.streetAddress ? "true" : "false"}
                aria-describedby={errors.shippingAddress?.streetAddress ? "shippingStreet-error" : undefined}
                {...register("shippingAddress.streetAddress")}
              />
              <FormError id="shippingStreet-error" message={errors.shippingAddress?.streetAddress?.message} />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shippingCity" className="text-sm font-medium">
                  City
                </label>
                <input
                  id="shippingCity"
                  className={fieldClassName}
                  aria-invalid={errors.shippingAddress?.city ? "true" : "false"}
                  aria-describedby={errors.shippingAddress?.city ? "shippingCity-error" : undefined}
                  {...register("shippingAddress.city")}
                />
                <FormError id="shippingCity-error" message={errors.shippingAddress?.city?.message} />
              </div>
              <div>
                <label htmlFor="shippingState" className="text-sm font-medium">
                  State
                </label>
                <select
                  id="shippingState"
                  className={fieldClassName}
                  aria-invalid={errors.shippingAddress?.state ? "true" : "false"}
                  aria-describedby={errors.shippingAddress?.state ? "shippingState-error" : undefined}
                  {...register("shippingAddress.state")}
                >
                  <option value="">Select state</option>
                  {shippingStates.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name}
                    </option>
                  ))}
                </select>
                <FormError id="shippingState-error" message={errors.shippingAddress?.state?.message} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="shippingPostal" className="text-sm font-medium">
                  Postal code
                </label>
                <input
                  id="shippingPostal"
                  className={fieldClassName}
                  aria-invalid={errors.shippingAddress?.postalCode ? "true" : "false"}
                  aria-describedby={errors.shippingAddress?.postalCode ? "shippingPostal-error" : undefined}
                  {...register("shippingAddress.postalCode")}
                />
                <FormError id="shippingPostal-error" message={errors.shippingAddress?.postalCode?.message} />
              </div>
              <div>
                <label htmlFor="shippingCountry" className="text-sm font-medium">
                  Country
                </label>
                <select
                  id="shippingCountry"
                  className={fieldClassName}
                  aria-invalid={errors.shippingAddress?.country ? "true" : "false"}
                  aria-describedby={errors.shippingAddress?.country ? "shippingCountry-error" : undefined}
                  {...register("shippingAddress.country")}
                >
                  {countries.map((country) => (
                    <option key={country.code} value={country.code}>
                      {country.name}
                    </option>
                  ))}
                </select>
                <FormError id="shippingCountry-error" message={errors.shippingAddress?.country?.message} />
              </div>
            </div>
          </fieldset>
        ) : null}

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="min-h-12 w-full sm:w-auto" onClick={() => goToStep(2)}>
            Back
          </Button>
          <Button type="submit" className="min-h-12 w-full sm:w-auto">
            Continue
          </Button>
        </div>
      </form>
    </section>
  )
}
