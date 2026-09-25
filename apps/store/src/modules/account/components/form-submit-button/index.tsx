"use client"

import { useFormStatus } from "react-dom"

/**
 * A `.btn.btn-primary` submit button that shows the design's pending state,
 * for forms styled to the account-area redesign (still plain server actions
 * underneath — this only swaps the Tailwind `Button`/`SubmitButton` chrome for
 * the design's classes).
 */
const FormSubmitButton = ({
  children,
  "data-testid": dataTestId,
  className = "btn btn-primary",
}: {
  children: React.ReactNode
  "data-testid"?: string
  className?: string
}) => {
  const { pending } = useFormStatus()

  return (
    <button
      type="submit"
      className={className}
      disabled={pending}
      aria-busy={pending}
      data-testid={dataTestId}
    >
      {pending ? "Saving…" : children}
    </button>
  )
}

export default FormSubmitButton
