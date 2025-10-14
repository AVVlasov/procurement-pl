import { useState, useEffect } from 'react'

/**
 * Hook that debounces a value
 * @param value - Value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns Debounced value
 */
export const useDebounce = <T>(value: T, delay: number = 500): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    // Set up the timeout
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    // Clear timeout if value changes or component unmounts
    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}

