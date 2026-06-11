import { zodResolver } from "@hookform/resolvers/zod"
import { Controller, useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  PersonalInfoSchema,
  type PersonalInfoSchemaData,
} from "@/lib/validation"
import { useCheckout } from "@/hooks/useCheckout"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "../ui/field"
import { Input } from "../ui/input"

export function PersonalInfoForm() {
  const { personalInfo, updatePersonalInfo, goToStep } = useCheckout()

  const {
    handleSubmit,
    control,
  } = useForm<PersonalInfoSchemaData>({
    resolver: zodResolver(PersonalInfoSchema),
    mode: "onBlur",
    reValidateMode: "onChange",
    defaultValues: personalInfo ?? {
      fullName: "",
      email: "",
      phoneNumber: "",
    },
  })

  const onSubmit = (data: PersonalInfoSchemaData) => {
    updatePersonalInfo(data)
    goToStep(3)
  }

  return (
    <section
      role="region"
      aria-label="Personal information"
      className="rounded-2xl border border-border bg-card p-6 shadow-sm"
    >

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)}>
        <FieldGroup>
          <FieldSet>
            <FieldLegend>Personal Information</FieldLegend>
            <FieldDescription>Tell us who this order is for.</FieldDescription>
            <FieldGroup>
              {/* Full name */}
              <Controller
                control={control}
                name="fullName"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="fullName">Full name</FieldLabel>
                    <Input
                      {...field}
                      id="fullName"
                      aria-invalid={fieldState.invalid}
                      placeholder="Full name"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="fullName-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="email">Email</FieldLabel>
                    <Input
                      {...field}
                      id="email"
                      type="email"
                      aria-invalid={fieldState.invalid}
                      placeholder="Email"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="email-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />

              <Controller
                control={control}
                name="phoneNumber"
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor="phoneNumber">Phone Number</FieldLabel>
                    <Input
                      {...field}
                      id="phoneNumber"
                      type="tel"
                      aria-invalid={fieldState.invalid}
                      placeholder="Phone Number"
                    />
                    {fieldState.error && (
                      <FieldError
                        id="phoneNumber-error"
                        errors={[fieldState.error]}
                      />
                    )}
                  </Field>
                )}
              />
            </FieldGroup>
          </FieldSet>
        </FieldGroup>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button
            type="button"
            variant="outline"
            className="min-h-12 w-full sm:w-auto"
            onClick={() => goToStep(1)}
          >
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
