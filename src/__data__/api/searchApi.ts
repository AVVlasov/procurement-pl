import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Company } from './companiesApi'
import { URLs } from '../urls'
import type { RootState } from '../store'

export interface SearchParams {
  query?: string;
  industries?: string[];
  companySize?: string[];
  geography?: string[];
  minRating?: number;
  hasReviews?: boolean;
  hasAcceptedDocs?: boolean;
  type?: 'sell' | 'buy';
  page?: number;
  limit?: number;
  offset?: number; // Точный offset для пагинации со смешанными размерами страниц
  sortBy?: 'relevance' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface SearchResult {
  companies: Company[];
  total: number;
  page: number;
  totalPages: number;
  aiSuggestion?: string;
}

export interface SavedSearch {
  id: string;
  name: string;
  params: SearchParams;
  createdAt: string;
}

export interface AISearchRequest {
  query: string;
  context?: {
    companyId?: string;
    type?: 'sell' | 'buy';
  };
}

// Helper function to build query string with proper array handling
const buildQueryString = (params: Record<string, any>): string => {
  const searchParams = new URLSearchParams()
  
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null) {
      continue
    }
    
    if (Array.isArray(value)) {
      // For arrays, add multiple parameters with same name
      value.forEach(v => {
        if (v !== undefined && v !== null) {
          searchParams.append(key, String(v))
        }
      })
    } else if (typeof value === 'boolean') {
      // For booleans, always include them
      searchParams.set(key, value ? 'true' : 'false')
    } else {
      // For other types, just convert to string
      searchParams.set(key, String(value))
    }
  }
  
  return searchParams.toString()
}

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fetchBaseQuery({ 
    baseUrl: `${URLs.apiUrl}/search`,
    prepareHeaders: (headers, { getState }) => {
      const state = getState() as RootState | undefined
      const token = state?.auth?.accessToken
      if (token) {
        headers.set('authorization', `Bearer ${token}`)
      }
      return headers
    }
  }),
  tagTypes: ['Search', 'SavedSearch', 'History'],
  endpoints: (builder) => ({
    searchCompanies: builder.query<SearchResult, SearchParams>({
      query: (params) => {
        console.log('[searchApi] searchCompanies params:', params)
        const queryString = buildQueryString(params)
        console.log('[searchApi] Query string:', queryString)
        return {
          url: queryString ? `?${queryString}` : '',
        }
      },
      providesTags: ['Search'],
    }),
    
    aiSearch: builder.mutation<SearchResult, AISearchRequest>({
      query: (data) => ({
        url: '/ai',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Search'],
    }),
    
    saveSearch: builder.mutation<SavedSearch, { name: string; params: SearchParams }>({
      query: (data) => ({
        url: '/saved',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SavedSearch'],
    }),
    
    getSavedSearches: builder.query<SavedSearch[], void>({
      query: () => '/saved',
      providesTags: ['SavedSearch'],
    }),
    
    deleteSavedSearch: builder.mutation<void, string>({
      query: (id) => ({
        url: `/saved/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SavedSearch'],
    }),
    
    getSearchHistory: builder.query<Array<{ query: string; timestamp: string }>, void>({
      query: () => '/history',
      providesTags: ['History'],
    }),
    
    addToFavorites: builder.mutation<void, string>({
      query: (companyId) => ({
        url: `/favorites/${companyId}`,
        method: 'POST',
      }),
    }),
    
    removeFromFavorites: builder.mutation<void, string>({
      query: (companyId) => ({
        url: `/favorites/${companyId}`,
        method: 'DELETE',
      }),
    }),
    
    getRecommendations: builder.query<Array<{
      id: string;
      name: string;
      industry: string;
      logo?: string;
      matchScore: number;
      reason: string;
    }>, void>({
      query: () => '/recommendations',
    }),
  }),
})

export const {
  useSearchCompaniesQuery,
  useLazySearchCompaniesQuery,
  useAiSearchMutation,
  useSaveSearchMutation,
  useGetSavedSearchesQuery,
  useDeleteSavedSearchMutation,
  useGetSearchHistoryQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetRecommendationsQuery,
} = searchApi

