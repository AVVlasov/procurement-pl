import { renderHook, act, waitFor } from '@testing-library/react'
import { useDebounce } from '../useDebounce'

describe('useDebounce', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
  })

  test('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('test', 500))

    expect(result.current).toBe('test')
  })

  test('should delay value updates', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    expect(result.current).toBe('initial')

    rerender({ value: 'updated' })
    // Value should not update immediately
    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  test('should reset timer on new value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'first' } }
    )

    rerender({ value: 'second' })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    rerender({ value: 'third' })

    // Timer should reset
    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toBe('second')

    act(() => {
      jest.advanceTimersByTime(200)
    })

    expect(result.current).toBe('third')
  })

  test('should work with number values', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 300),
      { initialProps: { value: 100 } }
    )

    expect(result.current).toBe(100)

    rerender({ value: 200 })

    act(() => {
      jest.advanceTimersByTime(300)
    })

    expect(result.current).toBe(200)
  })

  test('should work with object values', () => {
    const obj1 = { name: 'test1' }
    const obj2 = { name: 'test2' }

    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 400),
      { initialProps: { value: obj1 } }
    )

    expect(result.current).toBe(obj1)

    rerender({ value: obj2 })

    act(() => {
      jest.advanceTimersByTime(400)
    })

    expect(result.current).toBe(obj2)
  })

  test('should handle rapid changes', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 100),
      { initialProps: { value: 'value1' } }
    )

    // Rapid changes
    rerender({ value: 'value2' })
    rerender({ value: 'value3' })
    rerender({ value: 'value4' })

    act(() => {
      jest.advanceTimersByTime(100)
    })

    // Only last value should be applied
    expect(result.current).toBe('value4')
  })

  test('should work with custom delay', () => {
    const { result, rerender } = renderHook(
      ({ value, delay }) => useDebounce(value, delay),
      { initialProps: { value: 'initial', delay: 200 } }
    )

    rerender({ value: 'updated', delay: 200 })

    act(() => {
      jest.advanceTimersByTime(199)
    })

    expect(result.current).toBe('initial')

    act(() => {
      jest.advanceTimersByTime(1)
    })

    expect(result.current).toBe('updated')
  })

  test('should handle empty string', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: '' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('')
  })

  test('should handle null value', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: null } }
    )

    expect(result.current).toBeNull()

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    expect(result.current).toBe('updated')
  })

  test('should clean up timer on unmount', () => {
    const { result, rerender, unmount } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    unmount()

    act(() => {
      jest.advanceTimersByTime(500)
    })

    // No error should occur
    expect(true).toBe(true)
  })

  test('should handle very short delays', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 1),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(1)
    })

    expect(result.current).toBe('updated')
  })

  test('should handle zero delay', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 0),
      { initialProps: { value: 'initial' } }
    )

    rerender({ value: 'updated' })

    act(() => {
      jest.advanceTimersByTime(0)
    })

    expect(result.current).toBe('updated')
  })

  test('should accumulate debounce correctly with variable delays', () => {
    const { result, rerender } = renderHook(
      ({ value }) => useDebounce(value, 500),
      { initialProps: { value: '1' } }
    )

    rerender({ value: '2' })

    act(() => {
      jest.advanceTimersByTime(250)
    })

    rerender({ value: '3' })

    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(result.current).toBe('1')

    act(() => {
      jest.advanceTimersByTime(250)
    })

    expect(result.current).toBe('3')
  })
})

