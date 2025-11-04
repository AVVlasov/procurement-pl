import React, { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Heading,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { MainLayout } from '../../components/layout/MainLayout'
import { SmartSearchBar } from '../../components/search/SmartSearchBar'
import { FiltersPanel } from '../../components/search/FiltersPanel'
import { ResultsGrid } from '../../components/search/ResultsGrid'
import { useToast } from '../../hooks/useToast'
import {
  useSearchCompaniesQuery,
  useAddToFavoritesMutation,
  useRemoveFromFavoritesMutation,
} from '../../__data__/api/searchApi'
import type { SearchParams, SearchResult } from '../../__data__/api/searchApi'
import type { Company } from '../../__data__/api/companiesApi'

export const SearchPage = () => {
  const { t } = useTranslation('search')
  const toast = useToast()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchParams>({
    page: 1,
    limit: 50, // Начальная загрузка 50 компаний
    sortBy: 'relevance',
    sortOrder: 'desc',
  })
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  
  // Локальное накопление компаний для дефолтной загрузки
  const [accumulatedCompanies, setAccumulatedCompanies] = useState<Company[]>([])
  const [loadedPages, setLoadedPages] = useState(0) // Количество загруженных страниц

  const hasActiveFilters = useMemo(() => {
    return Boolean(
      (filters.industries && filters.industries.length > 0) ||
      (filters.companySize && filters.companySize.length > 0) ||
      (filters.geography && filters.geography.length > 0) ||
      (filters.minRating && filters.minRating > 0) ||
      filters.hasReviews ||
      filters.hasAcceptedDocs
    )
  }, [filters])

  const hasSearchQuery = Boolean(searchQuery.trim())
  const isDefaultMode = !hasSearchQuery && !hasActiveFilters

  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = useSearchCompaniesQuery(
    { ...filters, query: searchQuery.trim() },
    {
      skip: false, // Всегда загружаем
    }
  )

  // Обработка результатов поиска
  useEffect(() => {
    if (searchResults?.companies) {
      if (isDefaultMode) {
        // В дефолтном режиме накапливаем компании
        setAccumulatedCompanies(prev => {
          // Если это первая загрузка (prev пуст), просто устанавливаем компании
          if (prev.length === 0) {
            setLoadedPages(1)
            return searchResults.companies
          }
          // Дозагрузка - добавляем к существующим
          const existingIds = new Set(prev.map(c => c.id))
          const newCompanies = searchResults.companies.filter(c => !existingIds.has(c.id))
          if (newCompanies.length > 0) {
            setLoadedPages(prevPages => prevPages + 1)
          }
          return [...prev, ...newCompanies]
        })
      } else {
        // При поиске/фильтрах не используем накопленные компании
        setAccumulatedCompanies([])
        setLoadedPages(0)
      }
    }
  }, [searchResults, isDefaultMode])

  // Переводим запрос при изменении фильтров или текста
  useEffect(() => {
    const timer = setTimeout(() => {
      refetch()
    }, 100)
    return () => clearTimeout(timer)
  }, [filters.industries, filters.companySize, filters.geography, filters.minRating, filters.hasReviews, filters.hasAcceptedDocs, filters.page, filters.sortBy, filters.sortOrder, refetch, searchQuery])

  const [addToFavorites] = useAddToFavoritesMutation()
  const [removeFromFavorites] = useRemoveFromFavoritesMutation()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    // При поиске сбрасываем на начало
    setFilters(prev => ({
      ...prev,
      page: 1,
      limit: 50, // При первом запросе загружаем 50
      offset: undefined, // Сбрасываем offset
    }))
    setAccumulatedCompanies([])
    setLoadedPages(0)
  }

  const handleFiltersChange = (newFilters: SearchParams) => {
    console.log('[SearchPage] Filters changed:', newFilters)
    setFilters({
      ...newFilters,
      page: 1,
      limit: 50, // При фильтрации начинаем с 50 компаний
      offset: undefined, // Сбрасываем offset
    })
    setAccumulatedCompanies([])
    setLoadedPages(0)
  }

  const handleResetFilters = () => {
    setSearchQuery('') // Очищаем также поисковый запрос
    setFilters({
      page: 1,
      limit: 50,
      sortBy: 'relevance',
      sortOrder: 'desc',
      offset: undefined,
    })
    setAccumulatedCompanies([])
    setLoadedPages(0)
  }

  const handleLoadMore = useCallback(() => {
    if (isDefaultMode && accumulatedCompanies.length > 0) {
      // В дефолтном режиме подгружаем по 20
      // Используем offset для точной пагинации
      const currentCount = accumulatedCompanies.length
      
      setFilters(prev => ({
        ...prev,
        offset: currentCount, // Загружаем со следующей компании
        limit: 20,
      }))
      
      // Вызываем refetch вручную
      refetch()
    }
  }, [isDefaultMode, accumulatedCompanies.length, refetch])

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
        <VStack gap={{ base: 6, md: 8 }} align="stretch">
          {/* Header */}
          <Box>
            <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 3, md: 4 }}>
              {t('title')}
            </Heading>
            <SmartSearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
                allowEmptySearch={hasActiveFilters}
                onForceSearch={refetch}
            />
          </Box>

          {/* Main Content */}
          <Grid
            templateColumns={{ base: '1fr', md: '220px 1fr', lg: '280px 1fr', xl: '300px 1fr' }}
            gap={{ base: 6, md: 5, lg: 6, xl: 8 }}
            alignItems="start"
          >
            {/* Filters Sidebar */}
            <GridItem display={{ base: 'none', md: 'block' }}>
              <Box position="sticky" top={{ base: 2, md: 4 }}>
                <FiltersPanel
                  filters={filters}
                  onChange={handleFiltersChange}
                  onReset={handleResetFilters}
                />
              </Box>
            </GridItem>

            {/* Results */}
            <GridItem minW="0">
              <ResultsGrid
                companies={isDefaultMode ? accumulatedCompanies : (searchResults?.companies || [])}
                total={searchResults?.total || 0}
                isLoading={isSearching}
                filters={filters}
                onFiltersChange={handleFiltersChange}
                onToggleFavorite={handleToggleFavorite}
                favoriteIds={favoriteIds}
                onLoadMore={handleLoadMore}
                hasMore={isDefaultMode && accumulatedCompanies.length < (searchResults?.total || 0)}
                showLoadMore={isDefaultMode}
              />
            </GridItem>
          </Grid>
        </VStack>
      </Container>
    </MainLayout>
  )
}

