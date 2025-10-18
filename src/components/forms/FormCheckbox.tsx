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
        <Checkbox.Root 
          checked={checked}
          onCheckedChange={(details) => {
            // Create a synthetic event to match react-hook-form expectations
            if (onChange) {
              const event = {
                target: {
                  type: 'checkbox',
                  name,
                  value,
                  checked: details.checked,
                }
              } as unknown as React.ChangeEvent<HTMLInputElement>
              onChange(event)
            }
          }}
        >
          <Checkbox.HiddenInput 
            ref={ref} 
            name={name} 
            value={value}
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

