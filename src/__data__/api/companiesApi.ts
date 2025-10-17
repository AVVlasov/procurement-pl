import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { URLs } from '../urls'

export interface Company {
  id: string;
  inn: string;
  ogrn: string;
  fullName: string;
  shortName?: string;
  legalForm: string;
  industry: string;
  companySize: string;
  website: string;
  logo?: string;
  slogan?: string;
  foundedYear?: number;
  employeeCount?: string;
  revenue?: string;
  phone?: string;
  email?: string;
  legalAddress?: string;
  actualAddress?: string;
  bankDetails?: string;
  rating?: number;
  verified: boolean;
}

export interface CompanyStats {
  profileViews: number;
  profileViewsChange?: number;
  sentRequests: number;
  sentRequestsChange?: number;
  receivedRequests: number;
  receivedRequestsChange?: number;
  newMessages: number;
  rating: number;
}

export const companiesApi = createApi({
  reducerPath: 'companiesApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}/companies` }),
  tagTypes: ['Company', 'Stats', 'CompanyExperience', 'CompanyReviews'],
  endpoints: (builder) => ({
    getCompany: builder.query<Company, string>({
      query: (id) => `/${id}`,
      providesTags: (result, error, id) => [{ type: 'Company', id }],
    }),
    
    updateCompany: builder.mutation<Company, { id: string; data: Partial<Company> }>({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Company', id }],
    }),
    
    getCompanyStats: builder.query<CompanyStats, void>({
      query: () => '/my/stats',
      providesTags: ['Stats'],
    }),
    
    uploadLogo: builder.mutation<{ logoUrl: string }, { companyId: string; file: File }>({
      query: ({ companyId, file }) => {
        const formData = new FormData()
        formData.append('logo', file)
        return {
          url: `/${companyId}/logo`,
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: (result, error, { companyId }) => [{ type: 'Company', id: companyId }],
    }),
    
    checkINN: builder.query<{ data: { name: string; ogrn: string; legal_form: string } | null }, string>({
      query: (inn) => `/check-inn/${inn}`,
    }),

    // Company Experience
    getCompanyExperience: builder.query<Array<{
      id: string;
      confirmed: boolean;
      customer: string;
      subject: string;
      volume: string | number;
      contact: string;
      comment: string;
      createdAt: string;
      updatedAt: string;
    }>, string>({
      query: (companyId) => `/${companyId}/experience`,
      providesTags: (result, error, companyId) => [{ type: 'CompanyExperience', id: companyId }],
    }),

    addCompanyExperience: builder.mutation<{
      id: string;
      confirmed: boolean;
      customer: string;
      subject: string;
      volume: string | number;
      contact: string;
      comment: string;
      createdAt: string;
      updatedAt: string;
    }, { companyId: string; data: Omit<any, 'id' | 'createdAt' | 'updatedAt'> }>({
      query: ({ companyId, data }) => ({
        url: `/${companyId}/experience`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: (result, error, { companyId }) => [{ type: 'CompanyExperience', id: companyId }],
    }),

    updateCompanyExperience: builder.mutation<any, { companyId: string; expId: string; data: any }>({
      query: ({ companyId, expId, data }) => ({
        url: `/${companyId}/experience/${expId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { companyId }) => [{ type: 'CompanyExperience', id: companyId }],
    }),

    deleteCompanyExperience: builder.mutation<void, { companyId: string; expId: string }>({
      query: ({ companyId, expId }) => ({
        url: `/${companyId}/experience/${expId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, { companyId }) => [{ type: 'CompanyExperience', id: companyId }],
    }),

    // Company Reviews (read-only)
    getCompanyReviews: builder.query<{ items: Array<{
      id: string;
      author: { name: string; company: string; avatar?: string };
      rating: number;
      comment: string;
      date: string;
      verified: boolean;
    }>; total: number; page: number }, { companyId: string; page?: number; limit?: number; sortBy?: 'date' | 'rating'; sortOrder?: 'asc' | 'desc' }>({
      query: ({ companyId, page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' }) => ({
        url: `/${companyId}/reviews`,
        params: { page, limit, sortBy, sortOrder },
      }),
      providesTags: (result, error, { companyId }) => [{ type: 'CompanyReviews', id: companyId }],
    }),
  }),
})

export const {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanyStatsQuery,
  useUploadLogoMutation,
  useCheckINNQuery,
  useLazyCheckINNQuery,
  useGetCompanyExperienceQuery,
  useAddCompanyExperienceMutation,
  useUpdateCompanyExperienceMutation,
  useDeleteCompanyExperienceMutation,
  useGetCompanyReviewsQuery,
} = companiesApi

