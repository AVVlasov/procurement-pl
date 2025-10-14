import React from 'react'
import { ChakraProvider, createSystem, defaultConfig } from '@chakra-ui/react'
import type { PropsWithChildren } from 'react'

const system = createSystem(defaultConfig)

export function Provider(props: PropsWithChildren) {
  return (
    <ChakraProvider value={system}>
      {props.children}
    </ChakraProvider>
  )
}

