import { Input, IconButton } from '@chakra-ui/react'
import { forwardRef, useMemo, useState } from 'react'
import { LuEye, LuEyeOff } from 'react-icons/lu'

export interface PasswordInputProps extends Input.RootProps {
  placeholder?: string
}

export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(
  function PasswordInput(props, ref) {
    const { placeholder, ...rest } = props
    const [open, setOpen] = useState(false)

    const mergedRef = useMemo(() => {
      return (node: HTMLInputElement | null) => {
        if (typeof ref === 'function') ref(node)
        else if (ref) ref.current = node
      }
    }, [ref])

    return (
      <Input.Root {...rest}>
        <Input.Field
          ref={mergedRef}
          type={open ? 'text' : 'password'}
          placeholder={placeholder}
        />
        <Input.ElementEnd>
          <IconButton
            size="xs"
            variant="ghost"
            onClick={() => setOpen(!open)}
            aria-label={open ? 'Hide password' : 'Show password'}
          >
            {open ? <LuEyeOff /> : <LuEye />}
          </IconButton>
        </Input.ElementEnd>
      </Input.Root>
    )
  },
)

