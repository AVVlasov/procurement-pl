import React, { forwardRef } from 'react'
import { Checkbox, Field } from '@chakra-ui/react'

interface FormCheckboxProps {
  label: React.ReactNode
  error?: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
  value?: string
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, checked, onChange, name, value }, ref) => {
    return (
      <Field.Root invalid={!!error}>
        <Checkbox.Root checked={checked}>
          <Checkbox.HiddenInput 
            ref={ref} 
            name={name} 
            value={value}
            onChange={onChange}
          />
          <Checkbox.Control />
          <Checkbox.Label>{label}</Checkbox.Label>
        </Checkbox.Root>
        {error && <Field.ErrorText>{error}</Field.ErrorText>}
      </Field.Root>
    )
  },
)

FormCheckbox.displayName = 'FormCheckbox'

