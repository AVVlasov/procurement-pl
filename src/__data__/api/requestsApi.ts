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

export interface RequestFile {
  id: string
  name: string
  url: string
  type: string
  size: number
  uploadedAt?: string
}

export interface Request {
  _id?: string
  id?: string
  senderCompanyId: string
  recipientCompanyId: string
  subject?: string
  text: string
  files: RequestFile[]
  responseFiles?: RequestFile[]
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
  subject?: string
  productId?: string
  files: RequestFile[]
  result: BulkRequestResultItem[]
  createdAt: string
}

export interface SendBulkRequestPayload {
  text: string
  subject: string
  recipientCompanyIds: string[]
  productId?: string
  files?: File[]
}

export interface RespondToRequestPayload {
  id: string
  response: string
  status: 'accepted' | 'rejected'
  files?: File[]
}

export const requestsApi = createApi({
  reducerPath: 'requestsApi',
  baseQuery: baseQuery,
  tagTypes: ['Requests', 'Stats'],
  endpoints: (builder) => ({
    sendBulkRequest: builder.mutation<BulkRequestResponse, SendBulkRequestPayload>({
      query: ({ text, subject, recipientCompanyIds, productId, files }) => {
        const body = new FormData()
        body.append('text', text)
        body.append('subject', subject)
        if (productId) {
          body.append('productId', productId)
        }
        recipientCompanyIds.forEach((id) => body.append('recipientCompanyIds', id))
        files?.forEach((file) => body.append('files', file))

        return {
          url: '/requests',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Requests', 'Stats'],
    }),
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
    respondToRequest: builder.mutation<Request, RespondToRequestPayload>({
      query: ({ id, response, status, files }) => {
        const body = new FormData()
        body.append('response', response)
        body.append('status', status)
        files?.forEach((file) => body.append('responseFiles', file))

        return {
          url: `/requests/${id}`,
          method: 'PUT',
          body,
        }
      },
      invalidatesTags: ['Requests', 'Stats'],
    }),
    deleteRequest: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/requests/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Requests', 'Stats'],
    }),
  }),
})

export const {
  useSendBulkRequestMutation,
  useGetSentRequestsQuery,
  useGetReceivedRequestsQuery,
  useRespondToRequestMutation,
  useDeleteRequestMutation,
} = requestsApi


