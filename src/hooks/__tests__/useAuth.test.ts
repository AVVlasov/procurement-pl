import { renderHook, act } from '@testing-library/react'
import { Provider } from 'react-redux'
import { store } from '../../__data__/store'
import { useAuth } from '../useAuth'

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
)

describe('useAuth', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  test('should return user auth hook', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current).toBeDefined()
    expect(typeof result.current.login).toBe('function')
    expect(typeof result.current.logout).toBe('function')
  })

  test('should provide login function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.login).toBeDefined()
    expect(typeof result.current.login).toBe('function')
  })

  test('should provide logout function', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.logout).toBeDefined()
    expect(typeof result.current.logout).toBe('function')
  })

  test('should handle login with user data', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    const userData = {
      id: '123',
      email: 'test@example.com',
      token: 'mock-token',
    }

    act(() => {
      result.current.login(userData)
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  test('should handle logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    // First login
    act(() => {
      result.current.login({
        id: '123',
        email: 'test@example.com',
        token: 'mock-token',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)

    // Then logout
    act(() => {
      result.current.logout()
    })

    expect(result.current.isAuthenticated).toBe(false)
  })

  test('should provide user information', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    const userData = {
      id: '123',
      email: 'test@example.com',
      token: 'mock-token',
    }

    act(() => {
      result.current.login(userData)
    })

    expect(result.current.user).toBeDefined()
    expect(result.current.user?.email).toBe('test@example.com')
  })

  test('should manage loading state', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(typeof result.current.isLoading).toBe('boolean')
  })

  test('should persist auth state across hook instances', () => {
    const { result: result1 } = renderHook(() => useAuth(), { wrapper })
    const { result: result2 } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result1.current.login({
        id: '123',
        email: 'test@example.com',
        token: 'mock-token',
      })
    })

    expect(result2.current.isAuthenticated).toBe(true)
  })

  test('should handle authentication errors', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    expect(result.current.isAuthenticated).toBe(false)
  })

  test('should clear user data on logout', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login({
        id: '123',
        email: 'test@example.com',
        token: 'mock-token',
      })
    })

    act(() => {
      result.current.logout()
    })

    expect(result.current.user).toBeNull()
    expect(result.current.isAuthenticated).toBe(false)
  })

  test('should provide auth state updates', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    let stateUpdated = false

    const { result: result2 } = renderHook(
      () => {
        const auth = useAuth()
        if (auth.isAuthenticated) {
          stateUpdated = true
        }
        return auth
      },
      { wrapper }
    )

    act(() => {
      result.current.login({
        id: '123',
        email: 'test@example.com',
        token: 'mock-token',
      })
    })

    expect(result.current.isAuthenticated).toBe(true)
  })

  test('should handle multiple login calls', () => {
    const { result } = renderHook(() => useAuth(), { wrapper })

    act(() => {
      result.current.login({
        id: '123',
        email: 'test1@example.com',
        token: 'token1',
      })
    })

    expect(result.current.user?.email).toBe('test1@example.com')

    act(() => {
      result.current.login({
        id: '456',
        email: 'test2@example.com',
        token: 'token2',
      })
    })

    expect(result.current.user?.email).toBe('test2@example.com')
  })
})

