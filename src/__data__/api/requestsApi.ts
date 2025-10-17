import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

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
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}` }),
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


