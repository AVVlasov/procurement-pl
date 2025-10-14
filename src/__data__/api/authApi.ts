import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  // Step 1: Company Info
  inn: string;
  ogrn: string;
  fullName: string;
  shortName?: string;
  legalForm: string;
  industry: string;
  companySize: string;
  website: string;
  
  // Step 2: Contact Person
  firstName: string;
  lastName: string;
  middleName?: string;
  position: string;
  phone: string;
  email: string;
  password: string;
  
  // Step 3: Needs
  platformGoals: string[];
  productsOffered: string;
  productsNeeded: string;
  partnerIndustries?: string[];
  partnerGeography?: string[];
  
  // Step 4: Marketing
  source?: string;
  agreeToTerms: boolean;
  agreeToMarketing?: boolean;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    position: string;
    companyId: string;
    name?: string;
  };
  company: {
    id: string;
    name: string;
    inn: string;
  };
  tokens: {
    accessToken: string;
    refreshToken: string;
  };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: fetchBaseQuery({ baseUrl: '/api/auth' }),
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/login',
        method: 'POST',
        body: credentials,
      }),
      invalidatesTags: ['Auth'],
    }),
    
    register: builder.mutation<AuthResponse, RegisterRequest>({
      query: (data) => ({
        url: '/register',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Auth'],
    }),
    
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/logout',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
    
    verifyEmail: builder.mutation<{ message: string }, { token: string }>({
      query: ({ token }) => ({
        url: `/verify-email/${token}`,
        method: 'GET',
      }),
    }),
    
    requestPasswordReset: builder.mutation<{ message: string }, { email: string }>({
      query: ({ email }) => ({
        url: '/request-password-reset',
        method: 'POST',
        body: { email },
      }),
    }),
    
    resetPassword: builder.mutation<{ message: string }, { token: string; newPassword: string }>({
      query: ({ token, newPassword }) => ({
        url: '/reset-password',
        method: 'POST',
        body: { token, newPassword },
      }),
    }),
    
    refreshToken: builder.mutation<{ accessToken: string; refreshToken: string }, { refreshToken: string }>({
      query: ({ refreshToken }) => ({
        url: '/refresh',
        method: 'POST',
        body: { refreshToken },
      }),
    }),
  }),
})

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useVerifyEmailMutation,
  useRequestPasswordResetMutation,
  useResetPasswordMutation,
  useRefreshTokenMutation,
} = authApi

