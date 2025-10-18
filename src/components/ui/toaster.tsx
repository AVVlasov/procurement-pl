import React from 'react'
import { Toaster as ChakraToaster, createToaster } from '@chakra-ui/react'

export const toaster = createToaster({
  placement: 'top-end',
  pauseOnPageIdle: true,
})

export function Toaster() {
  return <ChakraToaster toaster={toaster} />
}

