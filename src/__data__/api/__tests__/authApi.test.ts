import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from '../authApi'
import authReducer from '../../slices/authSlice'

describe('authApi', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [authApi.reducerPath]: authApi.reducer,
        auth: authReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(authApi.middleware),
    })
    setupListeners(store.dispatch)
  })

  test('should create authApi reducer path', () => {
    expect(authApi.reducerPath).toBeDefined()
    expect(typeof authApi.reducerPath).toBe('string')
  })

  test('should have auth hooks', () => {
    expect(authApi.useLoginMutation).toBeDefined()
    expect(authApi.useRegisterMutation).toBeDefined()
  })

  test('should have reducer', () => {
    expect(authApi.reducer).toBeDefined()
  })

  test('should have middleware', () => {
    expect(authApi.middleware).toBeDefined()
  })

  test('should store initial state', () => {
    const state = store.getState()
    expect(state[authApi.reducerPath]).toBeDefined()
  })

  test('should provide hooks for mutations', () => {
    const hooks = {
      useLoginMutation: authApi.useLoginMutation,
      useRegisterMutation: authApi.useRegisterMutation,
      useLogoutMutation: authApi.useLogoutMutation,
      useRefreshTokenMutation: authApi.useRefreshTokenMutation,
    }

    Object.values(hooks).forEach((hook) => {
      expect(typeof hook).toBe('function')
    })
  })

  test('should provide hooks for queries', () => {
    const queryHooks = {
      useGetCurrentUserQuery: authApi.useGetCurrentUserQuery,
    }

    Object.values(queryHooks).forEach((hook) => {
      expect(typeof hook).toBe('function')
    })
  })

  test('should have endpoints defined', () => {
    expect(authApi.endpoints).toBeDefined()
    expect(authApi.endpoints.login).toBeDefined()
    expect(authApi.endpoints.register).toBeDefined()
  })

  test('should handle RTK Query caching', () => {
    expect(authApi.util).toBeDefined()
    expect(typeof authApi.util.invalidateTags).toBe('function')
  })

  test('should support tag-based invalidation', () => {
    const { tags } = authApi.endpoints.getCurrentUser
    expect(tags).toBeDefined()
  })
})
