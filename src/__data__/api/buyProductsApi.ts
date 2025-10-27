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
    uploadedAt?: string
  }>
  acceptedBy: Array<{
    companyId: string | { _id: string; shortName: string; fullName: string }
    acceptedAt: string
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
    addBuyProductFile: builder.mutation<BuyProduct, { id: string; fileName: string; fileUrl: string; fileType: string; fileSize: number }>({
      query: ({ id, fileName, fileUrl, fileType, fileSize }) => ({
        url: `/buy-products/${id}/files`,
        method: 'POST',
        body: { fileName, fileUrl, fileType, fileSize },
      }),
      invalidatesTags: ['BuyProducts'],
    }),
    deleteBuyProductFile: builder.mutation<BuyProduct, { id: string; fileId: string }>({
      query: ({ id, fileId }) => ({
        url: `/buy-products/${id}/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['BuyProducts'],
    }),
    acceptBuyProduct: builder.mutation<BuyProduct, string>({
      query: (id) => ({
        url: `/buy-products/${id}/accept`,
        method: 'POST',
      }),
      invalidatesTags: ['BuyProducts'],
    }),
    getBuyProductAcceptances: builder.query<Array<{ companyId: any; acceptedAt: string }>, string>({
      query: (id) => `/buy-products/${id}/acceptances`,
      providesTags: ['BuyProducts'],
    }),
  }),
})

export const {
  useGetCompanyBuyProductsQuery,
  useCreateBuyProductMutation,
  useUpdateBuyProductMutation,
  useDeleteBuyProductMutation,
  useAddBuyProductFileMutation,
  useDeleteBuyProductFileMutation,
  useAcceptBuyProductMutation,
  useGetBuyProductAcceptancesQuery,
} = buyProductsApi
