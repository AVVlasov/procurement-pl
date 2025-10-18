import { baseApi } from './client'

export interface Experience {
  id: string
  companyId: string
  confirmed: boolean
  customer: string
  subject: string
  volume: string
  contact: string
  comment: string
  createdAt: string
  updatedAt: string
}

export interface CreateExperienceRequest {
  companyId: string
  data: {
    confirmed: boolean
    customer: string
    subject: string
    volume: string
    contact: string
    comment: string
  }
}

export interface UpdateExperienceRequest {
  id: string
  data: Partial<Experience>
}

export const experienceApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getExperience: builder.query<Experience[], { companyId: string }>({
      query: ({ companyId }) => `/experience?companyId=${companyId}`,
      providesTags: ['Experience'],
    }),
    createExperience: builder.mutation<Experience, CreateExperienceRequest>({
      query: (body) => ({
        url: '/experience',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Experience'],
    }),
    updateExperience: builder.mutation<Experience, UpdateExperienceRequest>({
      query: ({ id, data }) => ({
        url: `/experience/${id}`,
        method: 'PUT',
        body: { data },
      }),
      invalidatesTags: ['Experience'],
    }),
    deleteExperience: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/experience/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Experience'],
    }),
  }),
})

export const {
  useGetExperienceQuery,
  useCreateExperienceMutation,
  useUpdateExperienceMutation,
  useDeleteExperienceMutation,
} = experienceApi

