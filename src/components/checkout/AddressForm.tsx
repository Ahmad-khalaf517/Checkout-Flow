import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { z } from "zod"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { useCheckout } from "@/hooks/useCheckout"
import { AddressSchema, type AddressSchemaData } from "@/lib/validation"

import {
  getCountries,
  getStates,
  type CountryOption,
  type StateOption,
} from "@/services/payment"

interface AddressFormValues {
  billingAddress: AddressSchemaData
  shippingAddress?: AddressSchemaData
  useShippingAsBilling: boolean
}

const emptyAddress: AddressSchemaData = {
  streetAddress: "",
  city: "",
  state: "",
  postalCode: "",
  country: "US",
}

const AddressFormSchema = z
  .object({
    billingAddress: AddressSchema,
    shippingAddress: AddressSchema.optional(),
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

  const { handleSubmit, control, watch } =
    useForm<AddressFormValues>({
      resolver: zodResolver(AddressFormSchema),
      mode: "onSubmit",
      reValidateMode: "onChange",
      shouldUnregister: true,
      defaultValues: {
        billingAddress: billingAddress ?? emptyAddress,
        shippingAddress: shippingAddress || undefined,
        useShippingAsBilling,
      },
    })

  const billingCountry = useWatch({ control, name: "billingAddress.country" })
  const shippingCountry =
    useWatch({ control, name: "shippingAddress.country" }) || ""
  // eslint-disable-next-line react-hooks/incompatible-library
  const sameAsBilling = watch("useShippingAsBilling")

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
      updateShippingAddress(data.shippingAddress ?? emptyAddress)
    }
    goToStep(4)
  }

  const shippingAddressClasses = sameAsBilling ? "hidden" : ""

  return (
    <section
      role="region"
      aria-label="Address details"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold">Address</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter billing and shipping details for this order.
      </p>

      <form className="mt-6 space-y-6" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          {/* Billing Address */}
          <FieldSet>
            <FieldLegend>Billing address</FieldLegend>
            <FieldDescription>Enter billing address details.</FieldDescription>

            <FieldGroup>
              <div className="flex justify-between gap-4">
                {/* Country and Postal Code */}
                <Controller
                  control={control}
                  name="billingAddress.country"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="billing-country">Country</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="billing-country"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="Country" />
                        </SelectTrigger>

                        <SelectContent>
                          {countries.map((country) => (
                            <SelectItem key={country.code} value={country.code}>
                              {country.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError
                          id="billing-country-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* Postal Code */}
                <Controller
                  control={control}
                  name="billingAddress.postalCode"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="billing-postal">
                        Postal Code
                      </FieldLabel>
                      <Input
                        {...field}
                        id="billing-postal"
                        aria-invalid={fieldState.invalid}
                        placeholder="Postal Code"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="billing-postal-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* State & City */}
              <div className="flex justify-between gap-5">
                {/* State*/}
                <Controller
                  control={control}
                  name="billingAddress.state"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="billing-state">State</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger
                          id="billing-state"
                          aria-invalid={fieldState.invalid}
                        >
                          <SelectValue placeholder="State" />
                        </SelectTrigger>

                        <SelectContent>
                          {billingStates.map((state) => (
                            <SelectItem key={state.code} value={state.code}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldState.error && (
                        <FieldError
                          id="billing-state-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
                {/* City */}
                <Controller
                  control={control}
                  name="billingAddress.city"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="billing-city">City</FieldLabel>
                      <Input
                        {...field}
                        id="billing-city"
                        aria-invalid={fieldState.invalid}
                        placeholder="City"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="billing-city-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </div>

              {/* Street Address */}
              <Controller
                control={control}
                name="billingAddress.streetAddress"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="billing-street-address">
                      Street address
                    </FieldLabel>
                    <Input
                      {...field}
                      id="billing-street-address"
                      aria-invalid={fieldState.invalid}
                      placeholder="123 Main St"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="billing-street-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
          <FieldSeparator />

          {/* Shipping Address */}
          <FieldSet>
            <FieldLegend>Shipping address</FieldLegend>
            <FieldDescription>
              The shipping address associated with your order
            </FieldDescription>
            <FieldGroup>
              <Controller
                control={control}
                name="useShippingAsBilling"
                render={({ field, fieldState }) => (
                  <Field
                    data-invalid={fieldState.invalid}
                    orientation="horizontal"
                  >
                    <Checkbox
                      id="same-as-shipping"
                      aria-invalid={fieldState.invalid}
                      name={field.name}
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                    <FieldLabel
                      htmlFor="same-as-shipping"
                      className="font-normal"
                    >
                      Same as shipping address
                    </FieldLabel>
                  </Field>
                )}
              />
            </FieldGroup>

            {!sameAsBilling && (
              <FieldGroup className={shippingAddressClasses}>
                <div className="flex justify-between gap-4">
                  {/* Country and Postal Code */}
                  <Controller
                    control={control}
                    name="shippingAddress.country"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="shipping-country">
                          Country
                        </FieldLabel>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="shipping-country"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="Country" />
                          </SelectTrigger>

                          <SelectContent>
                            {countries.map((country) => (
                              <SelectItem
                                key={country.code}
                                value={country.code}
                              >
                                {country.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <FieldError
                            id="shipping-country-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                  {/* Postal Code */}
                  <Controller
                    control={control}
                    name="shippingAddress.postalCode"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="shipping-postal">
                          Postal Code
                        </FieldLabel>
                        <Input
                          {...field}
                          id="shipping-postal"
                          aria-invalid={fieldState.invalid}
                          placeholder="Postal Code"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="shipping-postal-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>

                {/* State & City */}
                <div className="flex justify-between gap-5">
                  {/* State*/}
                  <Controller
                    control={control}
                    name="shippingAddress.state"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="shipping-state">State</FieldLabel>
                        <Select
                          name={field.name}
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger
                            id="shipping-state"
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue placeholder="State" />
                          </SelectTrigger>

                          <SelectContent>
                            {shippingStates.map((state) => (
                              <SelectItem key={state.code} value={state.code}>
                                {state.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {fieldState.error && (
                          <FieldError
                            id="shipping-state-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                  {/* City */}
                  <Controller
                    control={control}
                    name="shippingAddress.city"
                    render={({ field, fieldState }) => (
                      <Field data-invalid={fieldState.invalid}>
                        <FieldLabel htmlFor="shipping-city">City</FieldLabel>
                        <Input
                          {...field}
                          id="shipping-city"
                          aria-invalid={fieldState.invalid}
                          placeholder="City"
                        />
                        {fieldState.error && (
                          <FieldError
                            id="shipping-city-error"
                            errors={[fieldState.error]}
                          />
                        )}
                      </Field>
                    )}
                  />
                </div>

                {/* Street Address */}
                <Controller
                  control={control}
                  name="shippingAddress.streetAddress"
                  render={({ field, fieldState }) => (
                    <Field data-invalid={fieldState.invalid}>
                      <FieldLabel htmlFor="shipping-street-address">
                        Street address
                      </FieldLabel>
                      <Input
                        {...field}
                        id="shipping-street-address"
                        aria-invalid={fieldState.invalid}
                        placeholder="123 Main St"
                      />
                      {fieldState.error && (
                        <FieldError
                          id="shipping-street-error"
                          errors={[fieldState.error]}
                        />
                      )}
                    </Field>
                  )}
                />
              </FieldGroup>
            )}
          </FieldSet>

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
            <Button
              type="button"
              variant="outline"
              className="min-h-12 w-full sm:w-auto"
              onClick={() => goToStep(2)}
            >
              Back
            </Button>
            <Button type="submit" className="min-h-12 w-full sm:w-auto">
              Continue
            </Button>
          </div>
        </FieldGroup>
      </form>
    </section>
  )
}
