import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"

import { FormError } from "@/components/checkout/FormError"
import { Button } from "@/components/ui/button"
import { PersonalInfoSchema, type PersonalInfoSchemaData } from "@/lib/validation"
import { useCheckout } from "@/hooks/useCheckout"

const fieldClassName =
  "mt-1 h-12 w-full rounded-xl border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring"

export function PersonalInfoForm() {
  const { personalInfo, updatePersonalInfo, goToStep } = useCheckout()

  const {
    register,
    handleSubmit,
    formState: { errors },
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
    <section role="region" aria-label="Personal information" className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold">Personal Information</h2>
      <p className="mt-1 text-sm text-muted-foreground">Tell us who this order is for.</p>

      <form className="mt-6 space-y-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div>
          <label className="text-sm font-medium" htmlFor="fullName">
            Full name
          </label>
          <input
            id="fullName"
            className={fieldClassName}
            aria-invalid={errors.fullName ? "true" : "false"}
            aria-describedby={errors.fullName ? "fullName-error" : undefined}
            {...register("fullName")}
          />
          <FormError id="fullName-error" message={errors.fullName?.message} />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            className={fieldClassName}
            aria-invalid={errors.email ? "true" : "false"}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
          <FormError id="email-error" message={errors.email?.message} />
        </div>

        <div>
          <label className="text-sm font-medium" htmlFor="phoneNumber">
            Phone number
          </label>
          <input
            id="phoneNumber"
            type="tel"
            className={fieldClassName}
            aria-invalid={errors.phoneNumber ? "true" : "false"}
            aria-describedby={errors.phoneNumber ? "phoneNumber-error" : undefined}
            {...register("phoneNumber")}
          />
          <FormError id="phoneNumber-error" message={errors.phoneNumber?.message} />
        </div>

        <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row sm:justify-between">
          <Button type="button" variant="outline" className="min-h-12 w-full sm:w-auto" onClick={() => goToStep(1)}>
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
