import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  NativeSelect,
  SimpleGrid,
  Spinner,
  Flex,
  Button,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSearch } from 'react-icons/fi'
import { CompanyCard } from './CompanyCard'
import type { Company } from '../../__data__/api/companiesApi'
import type { SearchParams } from '../../__data__/api/searchApi'

interface ResultsGridProps {
  companies: Company[]
  total: number
  isLoading: boolean
  filters: SearchParams
  onFiltersChange: (filters: SearchParams) => void
  onContact: (companyId: string, companyName?: string) => void
  onToggleFavorite: (companyId: string) => void
  favoriteIds?: string[]
}

export const ResultsGrid = ({
  companies,
  total,
  isLoading,
  filters,
  onFiltersChange,
  onContact,
  onToggleFavorite,
  favoriteIds = [],
}: ResultsGridProps) => {
  const { t } = useTranslation('search')

  const handleSortChange = (value: string) => {
    const [sortBy, sortOrder] = value.split('-')
    onFiltersChange({
      ...filters,
      sortBy: sortBy as SearchParams['sortBy'],
      sortOrder: sortOrder as SearchParams['sortOrder'],
    })
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <VStack gap={4}>
          <Spinner size="xl" color="brand.500" borderWidth="4px" />
          <Text fontSize="lg" color="gray.600">
            {t('results.loading')}
          </Text>
        </VStack>
      </Flex>
    )
  }

  if (!companies || companies.length === 0) {
    return (
      <Flex
        justify="center"
        align="center"
        minH="400px"
        direction="column"
        color="gray.500"
      >
        <Box as={FiSearch} boxSize={16} mb={4} />
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          {t('results.no_results')}
        </Text>
        <Text>Попробуйте изменить параметры поиска</Text>
      </Flex>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap">
        <Text fontSize="lg" fontWeight="bold">
          {t('results.found', { count: total })}
        </Text>
        
        <HStack gap={4}>
          <Text fontSize="sm" color="gray.600">
            {t('sort.label')}:
          </Text>
          <NativeSelect.Root size="sm" w="200px">
            <NativeSelect.Field
              value={`${filters.sortBy || 'relevance'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="relevance-desc">{t('sort.relevance')}</option>
              <option value="rating-desc">{t('sort.rating')} ({t('sort.desc')})</option>
              <option value="rating-asc">{t('sort.rating')} ({t('sort.asc')})</option>
              <option value="name-asc">{t('sort.name')} ({t('sort.asc')})</option>
              <option value="name-desc">{t('sort.name')} ({t('sort.desc')})</option>
            </NativeSelect.Field>
            <NativeSelect.Indicator />
          </NativeSelect.Root>
        </HStack>
      </HStack>

      {/* Results Grid */}
      <SimpleGrid columns={{ base: 1, lg: 2 }} gap={6}>
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onContact={onContact}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favoriteIds.includes(company.id)}
          />
        ))}
      </SimpleGrid>

      {/* Pagination placeholder */}
      {total > (filters.limit || 10) && (
        <HStack justify="center" gap={2}>
          <Button size="sm" variant="outline">
            Previous
          </Button>
          <Text fontSize="sm">
            Page {filters.page || 1} of {Math.ceil(total / (filters.limit || 10))}
          </Text>
          <Button size="sm" variant="outline">
            Next
          </Button>
        </HStack>
      )}
    </VStack>
  )
}