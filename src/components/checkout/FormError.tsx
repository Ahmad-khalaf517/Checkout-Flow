interface FormErrorProps {
  id: string
  message?: string
}

export function FormError({ id, message }: FormErrorProps) {
  if (!message) {
    return null
  }

  return (
    <p id={id} role="alert" className="mt-1 text-sm text-destructive" aria-live="polite">
      {message}
    </p>
  )
}
