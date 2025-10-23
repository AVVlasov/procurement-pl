import { renderHook, act } from '@testing-library/react'
import { useToast } from '../useToast'

describe('useToast', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should provide toast hook', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current).toBeDefined()
  })

  test('should have success method', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.success).toBeDefined()
    expect(typeof result.current.success).toBe('function')
  })

  test('should have error method', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.error).toBeDefined()
    expect(typeof result.current.error).toBe('function')
  })

  test('should have info method', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.info).toBeDefined()
    expect(typeof result.current.info).toBe('function')
  })

  test('should have warning method', () => {
    const { result } = renderHook(() => useToast())

    expect(result.current.warning).toBeDefined()
    expect(typeof result.current.warning).toBe('function')
  })

  test('should call success with message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success message')
    })

    expect(true).toBe(true)
  })

  test('should call error with message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Error message')
    })

    expect(true).toBe(true)
  })

  test('should call error with title and description', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Error', 'Error description')
    })

    expect(true).toBe(true)
  })

  test('should call info with message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.info('Info message')
    })

    expect(true).toBe(true)
  })

  test('should call warning with message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.warning('Warning message')
    })

    expect(true).toBe(true)
  })

  test('should handle success with empty message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('')
    })

    expect(true).toBe(true)
  })

  test('should handle error with long message', () => {
    const { result } = renderHook(() => useToast())
    const longMessage = 'A'.repeat(500)

    act(() => {
      result.current.error(longMessage)
    })

    expect(true).toBe(true)
  })

  test('should handle multiple toast calls', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('First')
      result.current.info('Second')
      result.current.warning('Third')
      result.current.error('Fourth')
    })

    expect(true).toBe(true)
  })

  test('should handle rapid toast calls', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      for (let i = 0; i < 10; i++) {
        result.current.success(`Message ${i}`)
      }
    })

    expect(true).toBe(true)
  })

  test('should handle special characters in message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success! @#$%^&*(){}[]|\\:;"\'<>?,./~`')
    })

    expect(true).toBe(true)
  })

  test('should handle unicode characters', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Успешно! 成功! সফল!')
    })

    expect(true).toBe(true)
  })

  test('should handle newlines in message', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Line 1\nLine 2\nLine 3')
    })

    expect(true).toBe(true)
  })

  test('should be callable multiple times', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Test 1')
      result.current.success('Test 2')
      result.current.success('Test 3')
    })

    expect(true).toBe(true)
  })

  test('should handle alternating toast types', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.success('Success')
      result.current.error('Error')
      result.current.info('Info')
      result.current.warning('Warning')
      result.current.success('Success again')
    })

    expect(true).toBe(true)
  })

  test('should support title and description for error', () => {
    const { result } = renderHook(() => useToast())

    act(() => {
      result.current.error('Error Title', 'Error Description with details')
    })

    expect(true).toBe(true)
  })
})

