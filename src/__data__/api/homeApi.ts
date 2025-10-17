import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

export interface HomeAggregates {
  docsCount: number
  acceptsCount: number
  requestsCount: number
}

export const homeApi = createApi({
  reducerPath: 'homeApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}` }),
  tagTypes: ['HomeAggregates'],
  endpoints: (builder) => ({
    getHomeAggregates: builder.query<HomeAggregates, void>({
      query: () => '/home/aggregates',
      providesTags: ['HomeAggregates'],
    }),
  }),
})

export const { useGetHomeAggregatesQuery } = homeApi


