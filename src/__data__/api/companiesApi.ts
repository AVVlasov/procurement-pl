import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
  baseQuery: fetchBaseQuery({ baseUrl: '/api/companies' }),
  tagTypes: ['Company', 'Stats'],
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
  }),
})

export const {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useGetCompanyStatsQuery,
  useUploadLogoMutation,
  useCheckINNQuery,
  useLazyCheckINNQuery,
} = companiesApi

