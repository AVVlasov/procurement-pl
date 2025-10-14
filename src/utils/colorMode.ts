/**
 * Утилита для цветовых значений (замена useColorModeValue для Chakra UI v3)
 * Для демо используем светлую тему
 */

export const colorModeValue = <T>(lightValue: T, _darkValue: T): T => {
  // Для демо возвращаем всегда светлое значение
  return lightValue
}

// Цветовая палитра для приложения
export const colors = {
  bg: {
    primary: 'white',
    secondary: 'gray.50',
    tertiary: 'gray.100',
    hover: 'gray.100',
    active: 'brand.50',
  },
  border: {
    primary: 'gray.200',
    secondary: 'gray.300',
  },
  text: {
    primary: 'gray.900',
    secondary: 'gray.600',
    tertiary: 'gray.500',
    active: 'brand.600',
  },
}

