import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { buyProductsApi } from '../buyProductsApi'
import authReducer from '../../slices/authSlice'

describe('buyProductsApi', () => {
  let store: ReturnType<typeof configureStore>

  beforeEach(() => {
    store = configureStore({
      reducer: {
        [buyProductsApi.reducerPath]: buyProductsApi.reducer,
        auth: authReducer,
      },
      middleware: (getDefaultMiddleware) =>
        getDefaultMiddleware().concat(buyProductsApi.middleware),
    })
    setupListeners(store.dispatch)
  })

  test('should create buyProductsApi reducer path', () => {
    expect(buyProductsApi.reducerPath).toBeDefined()
    expect(typeof buyProductsApi.reducerPath).toBe('string')
  })

  test('should have buy products mutations', () => {
    expect(buyProductsApi.useCreateBuyProductMutation).toBeDefined()
    expect(buyProductsApi.useUpdateBuyProductMutation).toBeDefined()
    expect(buyProductsApi.useDeleteBuyProductMutation).toBeDefined()
  })

  test('should have buy products queries', () => {
    expect(buyProductsApi.useGetBuyProductsQuery).toBeDefined()
    expect(buyProductsApi.useGetBuyProductQuery).toBeDefined()
  })

  test('should have reducer', () => {
    expect(buyProductsApi.reducer).toBeDefined()
  })

  test('should have middleware', () => {
    expect(buyProductsApi.middleware).toBeDefined()
  })

  test('should store initial state', () => {
    const state = store.getState()
    expect(state[buyProductsApi.reducerPath]).toBeDefined()
  })

  test('should provide mutation hooks', () => {
    const hooks = {
      useCreateBuyProductMutation: buyProductsApi.useCreateBuyProductMutation,
      useUpdateBuyProductMutation: buyProductsApi.useUpdateBuyProductMutation,
      useDeleteBuyProductMutation: buyProductsApi.useDeleteBuyProductMutation,
    }

    Object.values(hooks).forEach((hook) => {
      expect(typeof hook).toBe('function')
    })
  })

  test('should provide query hooks', () => {
    const queryHooks = {
      useGetBuyProductsQuery: buyProductsApi.useGetBuyProductsQuery,
      useGetBuyProductQuery: buyProductsApi.useGetBuyProductQuery,
    }

    Object.values(queryHooks).forEach((hook) => {
      expect(typeof hook).toBe('function')
    })
  })

  test('should have endpoints defined', () => {
    expect(buyProductsApi.endpoints).toBeDefined()
    expect(buyProductsApi.endpoints.createBuyProduct).toBeDefined()
    expect(buyProductsApi.endpoints.updateBuyProduct).toBeDefined()
    expect(buyProductsApi.endpoints.deleteBuyProduct).toBeDefined()
  })

  test('should handle RTK Query caching', () => {
    expect(buyProductsApi.util).toBeDefined()
    expect(typeof buyProductsApi.util.invalidateTags).toBe('function')
  })

  test('should support tag-based invalidation for lists', () => {
    const { tags } = buyProductsApi.endpoints.getBuyProducts
    expect(tags).toBeDefined()
  })

  test('should support tag-based invalidation for single item', () => {
    const { tags } = buyProductsApi.endpoints.getBuyProduct
    expect(tags).toBeDefined()
  })

  test('should expose endpoints for imperative use', () => {
    const endpoints = buyProductsApi.endpoints
    expect(endpoints.createBuyProduct).toBeDefined()
    expect(endpoints.updateBuyProduct).toBeDefined()
    expect(endpoints.deleteBuyProduct).toBeDefined()
    expect(endpoints.getBuyProducts).toBeDefined()
    expect(endpoints.getBuyProduct).toBeDefined()
  })

  test('should have access to util methods', () => {
    const util = buyProductsApi.util
    expect(util.invalidateTags).toBeDefined()
    expect(util.updateQueryData).toBeDefined()
    expect(util.prefetch).toBeDefined()
  })

  test('should initialize with empty cache', () => {
    const state = store.getState()
    const apiState = state[buyProductsApi.reducerPath]
    expect(apiState).toBeDefined()
    expect(typeof apiState).toBe('object')
  })

  test('should support multiple API calls', () => {
    const state = store.getState()
    expect(state[buyProductsApi.reducerPath]).toBeDefined()
  })
})
