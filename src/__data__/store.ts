import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query'
import { authApi } from './api/authApi'
import { companiesApi } from './api/companiesApi'
import { productsApi } from './api/productsApi'
import { searchApi } from './api/searchApi'
import { buyApi } from './api/buyApi'
import { messagesApi } from './api/messagesApi'
import { requestsApi } from './api/requestsApi'
import { homeApi } from './api/homeApi'
import { reviewsApi } from './api/reviewsApi'
import { buyProductsApi } from './api/buyProductsApi'
import { baseApi } from './api/client'
import authReducer from './slices/authSlice'

export const store = configureStore({
  reducer: {
    // RTK Query API reducers
    [authApi.reducerPath]: authApi.reducer,
    [companiesApi.reducerPath]: companiesApi.reducer,
    [productsApi.reducerPath]: productsApi.reducer,
    [searchApi.reducerPath]: searchApi.reducer,
    [buyApi.reducerPath]: buyApi.reducer,
    [messagesApi.reducerPath]: messagesApi.reducer,
    [requestsApi.reducerPath]: requestsApi.reducer,
    [homeApi.reducerPath]: homeApi.reducer,
    [reviewsApi.reducerPath]: reviewsApi.reducer,
    [buyProductsApi.reducerPath]: buyProductsApi.reducer,
    [baseApi.reducerPath]: baseApi.reducer,
    
    // Regular slices
    auth: authReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types for serialization check
        ignoredActions: ['persist/PERSIST'],
      },
    }).concat(
      authApi.middleware,
      companiesApi.middleware,
      productsApi.middleware,
      searchApi.middleware,
      buyApi.middleware,
      messagesApi.middleware,
      requestsApi.middleware,
      homeApi.middleware,
      reviewsApi.middleware,
      buyProductsApi.middleware,
      baseApi.middleware
    ),
})

// Enable refetchOnFocus/refetchOnReconnect behaviors
setupListeners(store.dispatch)

// Infer the `RootState` and `AppDispatch` types from the store itself
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

