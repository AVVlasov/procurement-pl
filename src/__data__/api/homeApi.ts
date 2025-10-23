import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'
import type { RootState } from '../store'

// Base query with authorization
const baseQuery = fetchBaseQuery({
  baseUrl: `${URLs.apiUrl}`,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState | undefined
    const token = state?.auth?.accessToken
    if (token) {
      headers.set('authorization', `Bearer ${token}`)
    }
    return headers
  },
})

export interface HomeAggregates {
  docsCount: number
  acceptsCount: number
  requestsCount: number
}

export const homeApi = createApi({
  reducerPath: 'homeApi',
  baseQuery: baseQuery,
  tagTypes: ['HomeAggregates'],
  endpoints: (builder) => ({
    getHomeAggregates: builder.query<HomeAggregates, void>({
      query: () => '/home/aggregates',
      providesTags: ['HomeAggregates'],
    }),
  }),
})

export const { useGetHomeAggregatesQuery } = homeApi


