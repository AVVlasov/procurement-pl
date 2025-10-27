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

export interface Request {
  _id?: string
  id?: string
  senderCompanyId: string
  recipientCompanyId: string
  text: string
  files: Array<{ name: string; type: string; size: number }>
  productId?: string
  status: 'pending' | 'accepted' | 'rejected'
  response?: string
  respondedAt?: string
  createdAt: string
  updatedAt?: string
}

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
  tagTypes: ['BulkRequests', 'Requests'],
  endpoints: (builder) => ({
    sendBulkRequest: builder.mutation<BulkRequestResponse, { text: string; recipientCompanyIds: string[]; files: Array<{ name: string; type: string; size: number }> }>(
      {
        query: (data) => ({ url: '/requests', method: 'POST', body: data }),
        invalidatesTags: ['BulkRequests', 'Requests'],
      }
    ),
    getSentRequests: builder.query<Request[], void>({
      query: () => '/requests/sent',
      providesTags: ['Requests'],
      pollingInterval: 5000,
    }),
    getReceivedRequests: builder.query<Request[], void>({
      query: () => '/requests/received',
      providesTags: ['Requests'],
      pollingInterval: 5000,
    }),
    respondToRequest: builder.mutation<Request, { id: string; response: string; status: 'accepted' | 'rejected' }>({
      query: ({ id, response, status }) => ({
        url: `/requests/${id}`,
        method: 'PUT',
        body: { response, status },
      }),
      invalidatesTags: ['Requests'],
    }),
    deleteRequest: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Requests'],
    }),
    getLastReport: builder.query<BulkRequestResponse, void>({
      query: () => '/reports/last',
      providesTags: ['BulkRequests'],
    }),
  }),
})

export const {
  useSendBulkRequestMutation,
  useGetSentRequestsQuery,
  useGetReceivedRequestsQuery,
  useRespondToRequestMutation,
  useDeleteRequestMutation,
  useGetLastReportQuery,
} = requestsApi


