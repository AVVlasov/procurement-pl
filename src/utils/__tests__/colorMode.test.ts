import { colorModeValue, colors } from '../colorMode'

describe('colorMode', () => {
  describe('colorModeValue', () => {
    test('should return light value', () => {
      const result = colorModeValue('light-color', 'dark-color')
      expect(result).toBe('light-color')
    })

    test('should ignore dark value', () => {
      const result = colorModeValue('light', 'dark')
      expect(result).toBe('light')
    })

    test('should work with color codes', () => {
      const result = colorModeValue('#ffffff', '#000000')
      expect(result).toBe('#ffffff')
    })

    test('should work with chakra color tokens', () => {
      const result = colorModeValue('gray.50', 'gray.900')
      expect(result).toBe('gray.50')
    })

    test('should preserve string values', () => {
      const lightValue = 'white'
      const darkValue = 'black'
      const result = colorModeValue(lightValue, darkValue)
      expect(result).toBe(lightValue)
    })

    test('should work with object color values', () => {
      const lightValue = { color: 'white', opacity: 1 }
      const darkValue = { color: 'black', opacity: 0.8 }
      const result = colorModeValue(lightValue, darkValue)
      expect(result).toEqual(lightValue)
    })

    test('should handle null light value', () => {
      const result = colorModeValue(null as any, 'dark-color')
      expect(result).toBeNull()
    })

    test('should handle undefined dark value', () => {
      const result = colorModeValue('light-color', undefined as any)
      expect(result).toBe('light-color')
    })

    test('should handle number values', () => {
      const result = colorModeValue(10, 20)
      expect(result).toBe(10)
    })

    test('should handle boolean values', () => {
      const result = colorModeValue(true, false)
      expect(result).toBe(true)
    })

    test('should work with CSS values', () => {
      const result = colorModeValue('rgb(255, 255, 255)', 'rgb(0, 0, 0)')
      expect(result).toBe('rgb(255, 255, 255)')
    })

    test('should work with HSL values', () => {
      const result = colorModeValue('hsl(0, 0%, 100%)', 'hsl(0, 0%, 0%)')
      expect(result).toBe('hsl(0, 0%, 100%)')
    })

    test('should preserve complex values', () => {
      const lightValue = { x: 1, y: 2, z: { a: 'b' } }
      const darkValue = { x: 3, y: 4 }
      const result = colorModeValue(lightValue, darkValue)
      expect(result).toEqual(lightValue)
    })
  })

  describe('colors object', () => {
    test('should have bg colors', () => {
      expect(colors.bg).toBeDefined()
    })

    test('should have border colors', () => {
      expect(colors.border).toBeDefined()
    })

    test('should have text colors', () => {
      expect(colors.text).toBeDefined()
    })

    test('should have all bg color properties', () => {
      expect(colors.bg.primary).toBe('white')
      expect(colors.bg.secondary).toBe('gray.50')
      expect(colors.bg.tertiary).toBe('gray.100')
      expect(colors.bg.hover).toBe('gray.100')
      expect(colors.bg.active).toBe('brand.50')
    })

    test('should have all border color properties', () => {
      expect(colors.border.primary).toBe('gray.200')
      expect(colors.border.secondary).toBe('gray.300')
    })

    test('should have all text color properties', () => {
      expect(colors.text.primary).toBe('gray.900')
      expect(colors.text.secondary).toBe('gray.600')
      expect(colors.text.tertiary).toBe('gray.500')
      expect(colors.text.active).toBe('brand.600')
    })

    test('should use valid chakra colors', () => {
      const bgPrimary = colors.bg.primary
      expect(typeof bgPrimary).toBe('string')
      expect(bgPrimary).toMatch(/^(white|gray|brand).*/)
    })

    test('should use consistent color scheme', () => {
      // Primary backgrounds should be lighter
      expect(colors.bg.primary).toBe('white')
      expect(colors.bg.secondary).toBe('gray.50')
      expect(colors.bg.tertiary).toBe('gray.100')
    })

    test('should have proper text contrast colors', () => {
      // Text colors should work on backgrounds
      expect(colors.text.primary).toBe('gray.900') // Dark on light
      expect(colors.text.secondary).toBe('gray.600') // Medium on light
    })

    test('should have hover and active states', () => {
      expect(colors.bg.hover).toBeDefined()
      expect(colors.bg.active).toBeDefined()
    })

    test('should use brand color for active states', () => {
      expect(colors.bg.active).toBe('brand.50')
      expect(colors.text.active).toBe('brand.600')
    })

    test('should have all required color categories', () => {
      expect(Object.keys(colors).sort()).toEqual(['bg', 'border', 'text'].sort())
    })

    test('should have consistent nested structure', () => {
      Object.values(colors).forEach((category) => {
        expect(typeof category).toBe('object')
        Object.values(category).forEach((value) => {
          expect(typeof value).toBe('string')
        })
      })
    })

    test('should use valid color token format', () => {
      const validateColorToken = (color: string) => {
        return /^[a-z]+(\.[0-9]+)?$/.test(color) || color === 'white'
      }

      Object.values(colors).forEach((category) => {
        Object.values(category).forEach((value) => {
          expect(validateColorToken(value)).toBe(true)
        })
      })
    })

    test('should provide colors for light theme', () => {
      // All colors should be suitable for light theme
      expect(colors.bg.primary).toBe('white')
      expect(colors.text.primary).toBe('gray.900')
    })
  })

  describe('Color values consistency', () => {
    test('should have matching bg and text colors', () => {
      // Hover state should exist for both
      expect(colors.bg.hover).toBeDefined()
      expect(colors.text.tertiary).toBeDefined()
    })

    test('should use gray scale for borders', () => {
      Object.values(colors.border).forEach((borderColor) => {
        expect(borderColor).toMatch(/^gray\.\d+$/)
      })
    })

    test('should use consistent gray shades', () => {
      expect(colors.bg.secondary).toBe('gray.50')
      expect(colors.bg.tertiary).toBe('gray.100')
      expect(colors.border.primary).toBe('gray.200')
      expect(colors.border.secondary).toBe('gray.300')
      expect(colors.text.tertiary).toBe('gray.500')
      expect(colors.text.secondary).toBe('gray.600')
      expect(colors.text.primary).toBe('gray.900')
    })

    test('should have progressive shade levels', () => {
      const grayShades = [50, 100, 200, 300, 500, 600, 900]
      const shadeSet = new Set(
        grayShades.map((shade) => `gray.${shade}`)
      )

      Object.values(colors).forEach((category) => {
        Object.values(category).forEach((value) => {
          if (value.startsWith('gray.')) {
            expect(shadeSet.has(value)).toBe(true)
          }
        })
      })
    })
  })
})
