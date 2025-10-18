import React, { forwardRef } from 'react'
import { Checkbox, Field } from '@chakra-ui/react'

interface FormCheckboxProps {
  label: React.ReactNode
  error?: string
  checked?: boolean
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void
  name?: string
  value?: string | boolean
}

export const FormCheckbox = forwardRef<HTMLInputElement, FormCheckboxProps>(
  ({ label, error, checked, onChange, name, value }, ref) => {
    const handleCheckedChange = (details: { checked: boolean | "indeterminate" }) => {
      if (onChange) {
        // Create a synthetic event that properly indicates the checked state
        const isChecked = details.checked === true || details.checked === 'indeterminate'
        const syntheticEvent = {
          target: {
            type: 'checkbox',
            name,
            value: isChecked ? 'on' : 'off',
            checked: isChecked,
          },
        } as unknown as React.ChangeEvent<HTMLInputElement>
        onChange(syntheticEvent)
      }
    }

    return (
      <Field.Root invalid={!!error}>
        <Checkbox.Root 
          checked={checked}
          onCheckedChange={handleCheckedChange}
        >
          <Checkbox.HiddenInput 
            ref={ref} 
            name={name}
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

