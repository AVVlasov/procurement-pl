import { createApi } from '@reduxjs/toolkit/query/react'
import type { RootState } from '../store'
import { URLs } from '../urls'
import { fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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

export interface BuyProduct {
  _id: string
  companyId: string
  name: string
  description: string
  quantity: string
  unit: string
  files: Array<{
    id: string
    name: string
    url: string
    type: string
    size: number
  }>
  status: 'draft' | 'published'
  createdAt: string
  updatedAt: string
}

export interface CreateBuyProductPayload {
  name: string
  description: string
  quantity: string
  unit?: string
  status?: 'draft' | 'published'
}

export interface UpdateBuyProductPayload extends Partial<CreateBuyProductPayload> {
  id: string
}

export const buyProductsApi = createApi({
  reducerPath: 'buyProductsApi',
  baseQuery: baseQuery,
  tagTypes: ['BuyProducts'],
  endpoints: (builder) => ({
    getCompanyBuyProducts: builder.query<BuyProduct[], string | undefined>({
      query: (companyId) => {
        if (!companyId) {
          return { url: '/buy-products/company/empty', method: 'GET' }
        }
        return `/buy-products/company/${companyId}`
      },
      providesTags: ['BuyProducts'],
    }),
    createBuyProduct: builder.mutation<BuyProduct, CreateBuyProductPayload>({
      query: (payload) => ({
        url: `/buy-products`,
        method: 'POST',
        body: payload,
      }),
      invalidatesTags: ['BuyProducts'],
    }),
    updateBuyProduct: builder.mutation<BuyProduct, UpdateBuyProductPayload>({
      query: ({ id, ...patch }) => ({
        url: `/buy-products/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['BuyProducts'],
    }),
    deleteBuyProduct: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/buy-products/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyProducts'],
    }),
  }),
})

export const {
  useGetCompanyBuyProductsQuery,
  useCreateBuyProductMutation,
  useUpdateBuyProductMutation,
  useDeleteBuyProductMutation,
} = buyProductsApi
