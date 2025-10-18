import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

export interface BuyDoc {
  id: string
  ownerCompanyId: string
  name: string
  type: 'xlsx' | 'docx'
  size: number
  url: string
  acceptedBy: string[]
  createdAt: string
}

export const buyApi = createApi({
  reducerPath: 'buyApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}` }),
  tagTypes: ['BuyDocs'],
  endpoints: (builder) => ({
    getBuyDocs: builder.query<BuyDoc[], { ownerCompanyId?: string } | void>({
      query: (params) => ({ url: '/buy/docs', params }),
      providesTags: ['BuyDocs'],
    }),
    uploadBuyDoc: builder.mutation<BuyDoc, { ownerCompanyId: string; name: string; type: 'xlsx' | 'docx'; fileData?: string }>({
      query: (data) => ({ url: '/buy/docs', method: 'POST', body: data }),
      invalidatesTags: ['BuyDocs'],
    }),
    acceptBuyDoc: builder.mutation<{ id: string; acceptedBy: string[] }, { id: string; companyId: string }>({
      query: ({ id, companyId }) => ({ url: `/buy/docs/${id}/accept`, method: 'POST', body: { companyId } }),
      invalidatesTags: ['BuyDocs'],
    }),
    deleteBuyDoc: builder.mutation<{ id: string }, { id: string }>({
      query: ({ id }) => ({ url: `/buy/docs/${id}/delete`, method: 'GET' }),
      invalidatesTags: ['BuyDocs'],
    }),
  }),
})

export const { useGetBuyDocsQuery, useUploadBuyDocMutation, useAcceptBuyDocMutation, useDeleteBuyDocMutation } = buyApi


