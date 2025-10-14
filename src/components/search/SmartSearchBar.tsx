import React, { useState } from 'react'
import {
  Box,
  Input,
  IconButton,
  Badge,
  VStack,
  Text,
  Button,
  Spinner,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiX, FiZap } from 'react-icons/fi'
import { useDebounce } from '../../hooks/useDebounce'
import { useLazyGetSuggestionsQuery } from '../../__data__/api/searchApi'
import { colors } from '../../utils/colorMode'

interface SmartSearchBarProps {
  onSearch: (query: string, useAI?: boolean) => void
  isLoading?: boolean
}

export const SmartSearchBar = ({ onSearch, isLoading }: SmartSearchBarProps) => {
  const { t } = useTranslation('search')
  const [query, setQuery] = useState('')
  const [aiMode, setAiMode] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const debouncedQuery = useDebounce(query, 300)
  const [getSuggestions, { data: suggestions, isLoading: loadingSuggestions }] =
    useLazyGetSuggestionsQuery()

  React.useEffect(() => {
    if (debouncedQuery && debouncedQuery.length > 2) {
      getSuggestions(debouncedQuery)
      setShowSuggestions(true)
    } else {
      setShowSuggestions(false)
    }
  }, [debouncedQuery, getSuggestions])

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query, aiMode)
      setShowSuggestions(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    } else if (e.key === 'Escape') {
      setShowSuggestions(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    onSearch(suggestion, aiMode)
    setShowSuggestions(false)
  }

  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  return (
    <Box position="relative">
      <VStack gap={2} align="stretch">
        <Flex gap={2}>
          <Box flex={1} position="relative">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search_bar.placeholder')}
              size="lg"
              bg={bg}
              borderColor={aiMode ? 'brand.500' : borderColor}
              borderWidth={aiMode ? '2px' : '1px'}
              _focus={{
                borderColor: aiMode ? 'brand.500' : 'brand.300',
                boxShadow: aiMode ? '0 0 0 1px var(--chakra-colors-brand-500)' : undefined,
              }}
              pr={query ? '60px' : '40px'}
              pl="40px"
            />
            <Box
              position="absolute"
              left="12px"
              top="50%"
              transform="translateY(-50%)"
              color="gray.500"
              pointerEvents="none"
            >
              <FiSearch />
            </Box>
            {query && (
              <Box
                position="absolute"
                right="12px"
                top="50%"
                transform="translateY(-50%)"
              >
                <IconButton
                  aria-label="Clear"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setQuery('')
                    setShowSuggestions(false)
                  }}
                >
                  <FiX />
                </IconButton>
              </Box>
            )}
            {isLoading && (
              <Box
                position="absolute"
                right={query ? '50px' : '12px'}
                top="50%"
                transform="translateY(-50%)"
              >
                <Spinner size="sm" />
              </Box>
            )}
          </Box>
          
          <Button
            colorPalette={aiMode ? 'brand' : 'gray'}
            variant={aiMode ? 'solid' : 'outline'}
            onClick={() => setAiMode(!aiMode)}
            size="lg"
          >
            <FiZap />
            AI
          </Button>
          
          <Button
            colorPalette="brand"
            onClick={handleSearch}
            disabled={!query.trim()}
            loading={isLoading}
            size="lg"
          >
            {t('common:buttons.search')}
          </Button>
        </Flex>

        {aiMode && (
          <Badge colorPalette="brand" fontSize="sm" p={2} borderRadius="md">
            <Flex gap={2} align="center">
              <Box as={FiZap} />
              <Text>{t('search_bar.ai_mode')} активен - опишите что вы ищете естественным языком</Text>
            </Flex>
          </Badge>
        )}
      </VStack>

      {/* Suggestions Dropdown */}
      {showSuggestions && suggestions && suggestions.length > 0 && (
        <Box
          position="absolute"
          top="100%"
          left={0}
          right={0}
          mt={2}
          bg={bg}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          shadow="lg"
          zIndex={10}
          maxH="300px"
          overflowY="auto"
        >
          <VStack gap={0} align="stretch">
            <Box p={2} borderBottomWidth="1px">
              <Text fontSize="xs" fontWeight="bold" color="gray.500">
                {t('search_bar.suggestions')}
              </Text>
            </Box>
            {loadingSuggestions ? (
              <Box p={4} textAlign="center">
                <Spinner size="sm" />
              </Box>
            ) : (
              suggestions.map((suggestion, index) => (
                <Box
                  key={index}
                  p={3}
                  cursor="pointer"
                  transition="all 0.2s"
                  _hover={{ bg: 'brand.50' }}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  <Flex align="center" gap={2}>
                    <Box as={FiSearch} fontSize="14px" />
                    <Text fontSize="sm">{suggestion}</Text>
                  </Flex>
                </Box>
              ))
            )}
          </VStack>
        </Box>
      )}
    </Box>
  )
}