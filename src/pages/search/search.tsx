import React, { useState, useEffect, useMemo } from 'react'
import {
  Box,
  Container,
  Grid,
  GridItem,
  VStack,
  Heading,
  Text,
  Dialog,
  Textarea,
  Button,
  HStack,
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
import { useSendMessageMutation } from '../../__data__/api/messagesApi'
import { useAuth } from '../../hooks/useAuth'

export const SearchPage = () => {
  const { t } = useTranslation('search')
  const toast = useToast()
  const { company } = useAuth()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [filters, setFilters] = useState<SearchParams>({
    page: 1,
    limit: 10,
    sortBy: 'relevance',
    sortOrder: 'desc',
  })
  const [favoriteIds, setFavoriteIds] = useState<string[]>([])
  const [contactDialogOpen, setContactDialogOpen] = useState(false)
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('')
  const [messageText, setMessageText] = useState('')

  const [sendMessage, { isLoading: isSendingMessage }] = useSendMessageMutation()

  const {
    data: searchResults,
    isLoading: isSearching,
    refetch,
  } = useSearchCompaniesQuery(
    { ...filters, query: searchQuery },
    { skip: !searchQuery }
  )

  // Переводим запрос при изменении фильтров
  useEffect(() => {
    if (searchQuery) {
      // Небольшая задержка, чтобы дать RTK Query время обработать новые параметры,
      // затем явно вызываем refetch
      const timer = setTimeout(() => {
        refetch()
      }, 50)
      return () => clearTimeout(timer)
    }
  }, [filters.industries, filters.companySize, filters.geography, filters.minRating, refetch, searchQuery])

  const [addToFavorites] = useAddToFavoritesMutation()
  const [removeFromFavorites] = useRemoveFromFavoritesMutation()

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    // Сохраняем выбранные фильтры, только сбрасываем страницу
    setFilters(prev => ({
      ...prev,
      page: 1,
    }))
  }

  const handleFiltersChange = (newFilters: SearchParams) => {
    console.log('[SearchPage] Filters changed:', newFilters)
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

  const handleContact = (companyId: string, companyName?: string) => {
    setSelectedCompanyId(companyId)
    setSelectedCompanyName(companyName || companyId)
    setContactDialogOpen(true)
    setMessageText('')
  }

  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCompanyId) return
    
    try {
      const currentCompanyId = company?.id
      
      if (!currentCompanyId) {
        toast.error(t('common:errors.server_error'))
        return
      }
      
      // Создаем thread ID на основе обеих компаний (в отсортированном порядке для консистентности)
      const companyIds = [currentCompanyId, selectedCompanyId].sort()
      const threadId = `thread-${companyIds[0]}-${companyIds[1]}`
      
      await sendMessage({
        threadId,
        text: messageText,
        senderCompanyId: currentCompanyId,
      }).unwrap()
      
      toast.success(t('common:messages.sent_successfully'))
      setContactDialogOpen(false)
      setMessageText('')
      setSelectedCompanyId(null)
      setSelectedCompanyName('')
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
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
        <VStack gap={{ base: 6, md: 8 }} align="stretch">
          {/* Header */}
          <Box>
            <Heading size={{ base: 'lg', md: 'xl' }} mb={{ base: 3, md: 4 }}>
              {t('title')}
            </Heading>
            <SmartSearchBar
              onSearch={handleSearch}
              isLoading={isSearching}
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
                companies={searchResults?.companies || []}
                total={searchResults?.total || 0}
                isLoading={isSearching}
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

      {/* Contact Dialog */}
      <Dialog.Root open={contactDialogOpen} onOpenChange={(details) => setContactDialogOpen(details.open)}>
        <Dialog.Backdrop />
        <Dialog.Content>
          <Dialog.Header>
            <Dialog.Title>{t('common:messages.contact_company')}</Dialog.Title>
          </Dialog.Header>
          <Dialog.Body>
            <VStack gap={4} align="stretch">
              <Box>
                <Text fontSize="sm" color="gray.600">{t('common:labels.company')}</Text>
                <Text fontWeight="semibold">{selectedCompanyName}</Text>
              </Box>
              <Textarea
                placeholder={t('common:messages.message_placeholder')}
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                minH="150px"
                resize="none"
              />
            </VStack>
          </Dialog.Body>
          <Dialog.Footer>
            <HStack gap={3} justify="flex-end">
              <Button 
                variant="outline" 
                onClick={() => setContactDialogOpen(false)}
              >
                {t('common:buttons.cancel')}
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSendMessage}
                loading={isSendingMessage}
                disabled={!messageText.trim()}
              >
                {t('common:buttons.submit')}
              </Button>
            </HStack>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Root>
    </MainLayout>
  )
}

