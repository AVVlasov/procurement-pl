import React, { forwardRef } from 'react'
import { Field, Textarea } from '@chakra-ui/react'

interface FormTextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
}

export const FormTextarea = forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, helperText, required, ...props }, ref) => {
    return (
      <Field.Root invalid={!!error} required={required}>
        <Field.Label>{label}</Field.Label>
        <Textarea ref={ref} {...props} />
        {helperText && !error && (
          <Field.HelperText>{helperText}</Field.HelperText>
        )}
        {error && <Field.ErrorText>{error}</Field.ErrorText>}
      </Field.Root>
    )
  },
)

FormTextarea.displayName = 'FormTextarea'

