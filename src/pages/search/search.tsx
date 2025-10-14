import React, { useState } from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '../../components/layout/MainLayout'
import { SmartSearchBar } from '../../components/search/SmartSearchBar'
import { FiltersPanel } from '../../components/search/FiltersPanel'
import { ResultsGrid } from '../../components/search/ResultsGrid'
import { useToast } from '../../hooks/useToast'
import {
  useSearchCompaniesQuery,
  useAiSearchMutation,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
} from '../../__data__/api/searchApi'
import type { SearchParams, SearchResult } from '../../__data__/api/searchApi'

export const SearchPage = () => {
  const { t } = useTranslation('search')
  const toast = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [useAI, setUseAI] = useState(false)
  const [aiSearchResults, setAiSearchResults] = useState<SearchResult | null>(null)
  const [filters, setFilters] = useState<SearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'relevance',
    sortOrder: 'desc',
  })
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])

  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = useSearchCompaniesQuery(
    { ...filters, query: searchQuery },
    { skip: !searchQuery || useAI }
  )

  const [aiSearch, { isLoading: isAISearching }] = useAiSearchMutation()
  const [addToFavorites] = useAddToFavoritesMutation()
  const [removeFromFavorites] = useRemoveFromFavoritesMutation()

  const handleSearch = async (query: string, aiMode = false) => {
    setSearchQuery(query)
    setUseAI(aiMode)

    if (aiMode) {
      try {
        const result = await aiSearch({ query }).unwrap()
        setAiSearchResults(result)
        console.log('AI Search result:', result)
      } catch (error) {
        console.error('AI Search error:', error)
        toast.error(t('common:errors.server_error'))
      }
    } else {
      setAiSearchResults(null)
      refetch()
    }
  }

  const handleFiltersChange = (newFilters: SearchParams) => {
    setFilters(newFilters)
  }

  const handleResetFilters = () => {
    setFilters({
      page: 1,
      limit: 10,
      sortBy: 'relevance',
      sortOrder: 'desc',
    })
  }

  const handleContact = (companyId: string) => {
    // TODO: Open contact modal or navigate to messages
    toast.info('Связаться с компанией', 'Функция в разработке')
  }

  const handleToggleFavorite = async (companyId: string) => {
    try {
      if (favoriteIds.includes(companyId)) {
        await removeFromFavorites(companyId).unwrap()
        setFavoriteIds(favoriteIds.filter((id) => id !== companyId))
        toast.success(t('results.remove_from_favorites'))
      } else {
        await addToFavorites(companyId).unwrap()
        setFavoriteIds([...favoriteIds, companyId])
        toast.success(t('results.add_to_favorites'))
      }
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
  }

  return (
    <MainLayout>
      <Container maxW="container.xl">
        <VStack gap={8} align="stretch">
          {/* Header */}
          <Box>
            <Heading size="xl" mb={4}>
              {t('title')}
            </Heading>
            <SmartSearchBar
              onSearch={handleSearch}
              isLoading={isSearching || isAISearching}
            />
          </Box>

          {/* Main Content */}
          <Grid
            templateColumns={{ base: '1fr', lg: '300px 1fr' }}
            gap={8}
            alignItems="start"
          >
            {/* Filters Sidebar */}
            <GridItem>
              <Box position="sticky" top={4}>
                <FiltersPanel
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleResetFilters}
                />
              </Box>
            </GridItem>

            {/* Results */}
            <GridItem>
              {useAI && aiSearchResults?.aiSuggestion && (
                <Box
                  bg="brand.50"
                  borderWidth="1px"
                  borderColor="brand.200"
                  borderRadius="lg"
                  p={4}
                  mb={6}
                >
                  <Text fontSize="sm" color="brand.700" fontWeight="medium">
                    🤖 AI Анализ: {aiSearchResults.aiSuggestion}
                  </Text>
                </Box>
              )}
              <ResultsGrid
                companies={useAI ? (aiSearchResults?.companies || []) : (searchResults?.companies || [])}
                total={useAI ? (aiSearchResults?.total || 0) : (searchResults?.total || 0)}
                isLoading={isSearching || isAISearching}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onContact={handleContact}
                onToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
              />
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </MainLayout>
  )
}

