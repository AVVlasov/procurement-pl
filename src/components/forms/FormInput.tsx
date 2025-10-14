import React, { forwardRef } from 'react'
import { Field, Input } from '@chakra-ui/react'

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string
  error?: string
  helperText?: string
  required?: boolean
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, helperText, required, size = 'md', ...props }, ref) => {
    return (
      <Field.Root invalid={!!error} required={required}>
        <Field.Label fontSize={{ base: 'sm', md: 'md' }}>{label}</Field.Label>
        <Input ref={ref} size={size} {...props} />
        {helperText && !error && (
          <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>{helperText}</Field.HelperText>
        )}
        {error && <Field.ErrorText fontSize={{ base: 'xs', md: 'sm' }}>{error}</Field.ErrorText>}
      </Field.Root>
    )
  },
)

FormInput.displayName = 'FormInput'

