import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Text,
  NativeSelect,
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
      <Flex 
        justify="space-between" 
        align="center"
        gap={{ base: 2, md: 4, lg: 6 }}
        flexWrap={{ base: 'wrap', md: 'nowrap' }}
      >
        <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="bold" flex={{ base: '1 1 100%', md: 'initial' }}>
          {t('results.found', { count: total })}
        </Text>
        
        <HStack gap={{ base: 2, md: 3, lg: 4 }} flexWrap={{ base: 'nowrap' }} ml="auto">
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" whiteSpace="nowrap">
            {t('sort.label')}:
          </Text>
          <NativeSelect.Root size={{ base: 'sm', md: 'md' }} w={{ base: 'auto', md: '180px', lg: '200px' }} minW="150px">
            <NativeSelect.Field
              value={`${filters.sortBy || 'relevance'}-${filters.sortOrder || 'desc'}`}
              onChange={(e) => handleSortChange(e.target.value)}
              fontSize={{ base: 'sm', md: 'md' }}
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
      </Flex>

      {/* Results Grid */}
      <Box
        display="grid"
        gridTemplateColumns={{
          base: '1fr',
          md: 'repeat(auto-fit, minmax(300px, 1fr))',
          lg: 'repeat(auto-fit, minmax(350px, 1fr))',
        }}
        gap={{ base: 4, md: 5, lg: 6 }}
      >
        {companies.map((company) => (
          <CompanyCard
            key={company.id}
            company={company}
            onContact={onContact}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favoriteIds.includes(company.id)}
          />
        ))}
      </Box>

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