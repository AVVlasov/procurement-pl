import React, { createContext, useContext, useEffect, useState } from 'react'
import type { PropsWithChildren } from 'react'
import { IconButton } from '@chakra-ui/react'
import { LuMoon, LuSun } from 'react-icons/lu'

type ColorMode = 'light' | 'dark'

interface ColorModeContextType {
  colorMode: ColorMode
  setColorMode: (mode: ColorMode) => void
  toggleColorMode: () => void
}

const ColorModeContext = createContext<ColorModeContextType | undefined>(
  undefined
)

export function ColorModeProvider(props: PropsWithChildren) {
  const [colorMode, setColorModeState] = useState<ColorMode>('light')

  useEffect(() => {
    const stored = localStorage.getItem('chakra-ui-color-mode') as ColorMode
    if (stored) {
      setColorModeState(stored)
      document.documentElement.classList.toggle('dark', stored === 'dark')
    }
  }, [])

  const setColorMode = (mode: ColorMode) => {
    setColorModeState(mode)
    localStorage.setItem('chakra-ui-color-mode', mode)
    document.documentElement.classList.toggle('dark', mode === 'dark')
  }

  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light')
  }

  return (
    <ColorModeContext.Provider
      value={{ colorMode, setColorMode, toggleColorMode }}
    >
      {props.children}
    </ColorModeContext.Provider>
  )
}

export function useColorMode() {
  const context = useContext(ColorModeContext)
  if (!context) {
    throw new Error('useColorMode must be used within ColorModeProvider')
  }
  return context
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode()
  return colorMode === 'light' ? light : dark
}

export function ColorModeIcon() {
  const { colorMode } = useColorMode()
  return colorMode === 'light' ? <LuSun /> : <LuMoon />
}

interface ColorModeButtonProps {
  [key: string]: any
}

export const ColorModeButton = React.forwardRef<
  HTMLButtonElement,
  ColorModeButtonProps
>(function ColorModeButton(props, ref) {
  const { toggleColorMode } = useColorMode()
  return (
    <IconButton
      onClick={toggleColorMode}
      variant="ghost"
      aria-label="Toggle color mode"
      size="sm"
      ref={ref}
      {...props}
    >
      <ColorModeIcon />
    </IconButton>
  )
})

