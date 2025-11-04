import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'
import type { RootState } from '../store'

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

export interface Activity {
  _id: string
  id?: string
  companyId: string
  userId: string
  type: 
    | 'message_received'
    | 'message_sent'
    | 'request_received'
    | 'request_sent'
    | 'request_response'
    | 'product_accepted'
    | 'review_received'
    | 'profile_updated'
    | 'product_added'
    | 'buy_product_added'
  title: string
  description?: string
  relatedCompanyId?: string
  relatedCompanyName?: string
  metadata?: any
  read: boolean
  createdAt: string
}

export const activityApi = createApi({
  reducerPath: 'activityApi',
  baseQuery: baseQuery,
  tagTypes: ['Activities'],
  endpoints: (builder) => ({
    getActivities: builder.query<{ activities: Activity[] }, { limit?: number } | void>({
      query: (params) => ({
        url: '/activity',
        params: params || {},
      }),
      providesTags: ['Activities'],
    }),
    markActivityAsRead: builder.mutation<{ success: boolean; activity: Activity }, string>({
      query: (id) => ({
        url: `/activity/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Activities'],
    }),
    markAllAsRead: builder.mutation<{ success: boolean }, void>({
      query: () => ({
        url: '/activity/mark-all-read',
        method: 'POST',
      }),
      invalidatesTags: ['Activities'],
    }),
  }),
})

export const {
  useGetActivitiesQuery,
  useMarkActivityAsReadMutation,
  useMarkAllAsReadMutation,
} = activityApi

