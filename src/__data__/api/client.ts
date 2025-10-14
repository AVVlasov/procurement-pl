import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'

const baseQuery = fetchBaseQuery({
  baseUrl: '/api',
  prepareHeaders: (headers, { getState }) => {
    // Get token from auth state
    const token = (getState() as RootState).auth.accessToken
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    
    return headers
  },
})

// Base query with re-authorization
const baseQueryWithReauth = async (args: any, api: any, extraOptions: any) => {
  let result = await baseQuery(args, api, extraOptions)
  
  if (result.error && result.error.status === 401) {
    // Try to get a new token
    const refreshToken = (api.getState() as RootState).auth.refreshToken
    
    if (refreshToken) {
      const refreshResult = await baseQuery(
        {
          url: '/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      )
      
      if (refreshResult.data) {
        // Store the new tokens
        const { accessToken, refreshToken: newRefreshToken } = refreshResult.data as any
        
        api.dispatch({
          type: 'auth/setTokens',
          payload: { accessToken, refreshToken: newRefreshToken },
        })
        
        // Retry the initial query
        result = await baseQuery(args, api, extraOptions)
      } else {
        // Refresh failed - logout user
        api.dispatch({ type: 'auth/logout' })
      }
    }
  }
  
  return result
}

// Base API with common configuration
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Auth', 'Company', 'Product', 'Search', 'User'],
  endpoints: () => ({}),
})

