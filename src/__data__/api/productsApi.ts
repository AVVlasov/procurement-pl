import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

export interface Product {
  id: string;
  companyId: string;
  name: string;
  category: string;
  description: string;
  type: 'sell' | 'buy'; // Продаю или покупаю
  productUrl?: string;
  files?: Array<{
    id: string;
    name: string;
    url: string;
    type: string; // 'commercial-offer' | 'technical-specs' | 'contract' | 'other'
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateProductRequest {
  name: string;
  category: string;
  description: string;
  type: 'sell' | 'buy';
  productUrl?: string;
}

export interface UploadFileRequest {
  productId: string;
  file: File;
  fileType: string;
}

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}/products` }),
  tagTypes: ['Product', 'ProductFile'],
  endpoints: (builder) => ({
    getProducts: builder.query<Product[], void>({
      query: () => '/my',
      providesTags: (result) =>
        result
          ? [
            ...result.map(({ id }) => ({ type: 'Product' as const, id })),
            { type: 'Product', id: 'LIST' },
          ]
          : [{ type: 'Product', id: 'LIST' }],
    }),
    
    getProduct: builder.query<Product, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    
    createProduct: builder.mutation<Product, CreateProductRequest>({
      query: (data) => ({
        url: '',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: [{ type: 'Product', id: 'LIST' }],
    }),
    
    updateProduct: builder.mutation<Product, { id: string; data: Partial<CreateProductRequest> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Product', id }],
    }),
    
    deleteProduct: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, id) => [{ type: 'Product', id }],
    }),
    
    uploadFile: builder.mutation<{ file: Product['files'][0] }, UploadFileRequest>({
      query: ({ productId, file, fileType }) => {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('fileType', fileType)
        return {
          url: `/${productId}/files`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),
    
    deleteFile: builder.mutation<void, { productId: string; fileId: string }>({
      query: ({ productId, fileId }) => ({
        url: `/${productId}/files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { productId }) => [{ type: 'Product', id: productId }],
    }),
  }),
})

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useUploadFileMutation,
  useDeleteFileMutation,
} = productsApi

