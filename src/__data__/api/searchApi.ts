import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import type { Company } from './companiesApi'
import { URLs } from '../urls'

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

export const searchApi = createApi({
  reducerPath: 'searchApi',
  baseQuery: fetchBaseQuery({ baseUrl: `${URLs.apiUrl}/search` }),
  tagTypes: ['Search', 'SavedSearch', 'History'],
  endpoints: (builder) => ({
    searchCompanies: builder.query<SearchResult, SearchParams>({
      query: (params) => ({
        url: '',
        params,
      }),
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
    
    getSuggestions: builder.query<string[], string>({
      query: (query) => ({
        url: '/suggestions',
        params: { q: query },
      }),
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
  useGetSuggestionsQuery,
  useLazyGetSuggestionsQuery,
  useSaveSearchMutation,
  useGetSavedSearchesQuery,
  useDeleteSavedSearchMutation,
  useGetSearchHistoryQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
  useGetRecommendationsQuery,
} = searchApi

