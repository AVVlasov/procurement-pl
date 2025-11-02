import React from 'react'
import { Input, IconButton, Box } from '@chakra-ui/react'
import { forwardRef, useState } from 'react'
import { LuEye, LuEyeOff } from 'react-icons/lu'

export interface PasswordInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  ({ placeholder, ...rest }, ref) => {
    const [open, setOpen] = useState(false)

    return (
      <Box position="relative" display="inline-block" width="100%">
        <Input
          ref={ref}
          type={open ? 'text' : 'password'}
          placeholder={placeholder}
          paddingRight="2.5rem"
          {...rest}
        />
        <IconButton
          position="absolute"
          right="0.5rem"
          top="50%"
          transform="translateY(-50%)"
          size="xs"
          variant="ghost"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Hide password' : 'Show password'}
        >
          {open ? <LuEyeOff /> : <LuEye />}
        </IconButton>
      </Box>
    )
  }
)

PasswordInput.displayName = 'PasswordInput'

