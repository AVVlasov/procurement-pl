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

export interface BulkRequestResultItem {
  companyId: string
  success: boolean
  message: string
}

export interface BulkRequestResponse {
  id: string
  text: string
  files: Array<{ name: string; type: string; size: number }>
  result: BulkRequestResultItem[]
  createdAt: string
}

export const requestsApi = createApi({
  reducerPath: 'requestsApi',
  baseQuery: baseQuery,
  tagTypes: ['BulkRequests'],
  endpoints: (builder) => ({
    sendBulkRequest: builder.mutation<BulkRequestResponse, { text: string; recipientCompanyIds: string[]; files: Array<{ name: string; type: string; size: number }> }>(
      {
        query: (data) => ({ url: '/requests/bulk', method: 'POST', body: data }),
        invalidatesTags: ['BulkRequests'],
      }
    ),
    getLastReport: builder.query<BulkRequestResponse, void>({
      query: () => '/reports/last',
      providesTags: ['BulkRequests'],
    }),
  }),
})

export const { useSendBulkRequestMutation, useGetLastReportQuery } = requestsApi


