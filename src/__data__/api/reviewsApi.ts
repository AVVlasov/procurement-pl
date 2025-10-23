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

export interface Review {
  _id: string
  companyId: string
  authorCompanyId: string
  authorName: string
  authorCompany: string
  rating: number
  comment: string
  date: string
  verified: boolean
  createdAt: string
  updatedAt: string
}

export interface CreateReviewPayload {
  companyId: string
  rating: number
  comment: string
}

export const reviewsApi = createApi({
  reducerPath: 'reviewsApi',
  baseQuery: baseQuery,
  tagTypes: ['Reviews'],
  endpoints: (builder) => ({
    getCompanyReviews: builder.query<Review[], string | undefined>({
      query: (companyId) => {
        if (!companyId) {
          return { url: '/reviews/company/empty', method: 'GET' }
        }
        return `/reviews/company/${companyId}`
      },
      providesTags: (result, error, companyId) => 
        companyId ? [{ type: 'Reviews', id: companyId }] : [],
    }),
    createReview: builder.mutation<Review, CreateReviewPayload>({
      query: (payload) => ({
        url: `/reviews`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: (result, error, payload) => [{ type: 'Reviews', id: payload.companyId }],
    }),
  }),
})

export const { useGetCompanyReviewsQuery, useCreateReviewMutation } = reviewsApi

