import { createSystem, defaultConfig } from '@chakra-ui/react'

export const system = createSystem(defaultConfig, {
  globalCss: {
    body: {
      colorPalette: 'blue',
      fontFamily: 'system-ui, -apple-system, sans-serif',
    },
  },
  theme: {
    tokens: {
      fonts: {
        body: { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
        heading: { value: 'system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' },
      },
      colors: {
        // Primary brand colors for B2B platform
        brand: {
          50: { value: '#e3f2fd' },
          100: { value: '#bbdefb' },
          200: { value: '#90caf9' },
          300: { value: '#64b5f6' },
          400: { value: '#42a5f5' },
          500: { value: '#2196f3' },
          600: { value: '#1e88e5' },
          700: { value: '#1976d2' },
          800: { value: '#1565c0' },
          900: { value: '#0d47a1' },
        },
        // Success colors
        success: {
          50: { value: '#e8f5e9' },
          500: { value: '#4caf50' },
          700: { value: '#388e3c' },
        },
        // Warning colors
        warning: {
          50: { value: '#fff3e0' },
          500: { value: '#ff9800' },
          700: { value: '#f57c00' },
        },
        // Error colors
        error: {
          50: { value: '#ffebee' },
          500: { value: '#f44336' },
          700: { value: '#d32f2f' },
        },
        // Neutral grays
        gray: {
          50: { value: '#fafafa' },
          100: { value: '#f5f5f5' },
          200: { value: '#eeeeee' },
          300: { value: '#e0e0e0' },
          400: { value: '#bdbdbd' },
          500: { value: '#9e9e9e' },
          600: { value: '#757575' },
          700: { value: '#616161' },
          800: { value: '#424242' },
          900: { value: '#212121' },
        },
      },
    },
    semanticTokens: {
      colors: {
        // Semantic color tokens for consistent theming
        'bg.canvas': { value: '{colors.gray.50}' },
        'bg.surface': { value: 'white' },
        'bg.muted': { value: '{colors.gray.100}' },
        'bg.subtle': { value: '{colors.gray.200}' },
        
        'fg.default': { value: '{colors.gray.900}' },
        'fg.muted': { value: '{colors.gray.600}' },
        'fg.subtle': { value: '{colors.gray.500}' },
        
        'border.default': { value: '{colors.gray.200}' },
        'border.emphasized': { value: '{colors.gray.300}' },
      },
      radii: {
        l1: { value: '0.375rem' },
        l2: { value: '0.5rem' },
        l3: { value: '0.75rem' },
        l4: { value: '1rem' },
      },
      spacing: {
        section: { value: '2rem' },
        card: { value: '1.5rem' },
      },
    },
    breakpoints: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
      '2xl': '1536px',
    },
  },
})
