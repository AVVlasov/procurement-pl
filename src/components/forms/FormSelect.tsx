import React, { forwardRef } from 'react'
import { Field, NativeSelect } from '@chakra-ui/react'

interface Option {
  value: string
  label: string
}

interface FormSelectProps {
  label: string
  options: Option[]
  error?: string
  helperText?: string
  required?: boolean
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  name?: string
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  (
    {
      label,
      options,
      error,
      helperText,
      required,
      placeholder,
      value,
      onChange,
      name,
      size = 'md',
    },
    ref,
  ) => {
    return (
      <Field.Root invalid={!!error} required={required}>
        <Field.Label fontSize={{ base: 'sm', md: 'md' }}>{label}</Field.Label>
        <NativeSelect.Root size={size}>
          <NativeSelect.Field
            ref={ref}
            name={name}
            value={value || ''}
            onChange={(e) => onChange?.(e.target.value)}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </NativeSelect.Field>
          <NativeSelect.Indicator />
        </NativeSelect.Root>
        {helperText && <Field.HelperText fontSize={{ base: 'xs', md: 'sm' }}>{helperText}</Field.HelperText>}
        {error && <Field.ErrorText fontSize={{ base: 'xs', md: 'sm' }}>{error}</Field.ErrorText>}
      </Field.Root>
    )
  },
)

FormSelect.displayName = 'FormSelect'
