import React, { useState } from 'react'
import {
  Box,
  Input,
  IconButton,
  VStack,
  Text,
  Button,
  Spinner,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiX } from 'react-icons/fi'
import { colors } from '../../utils/colorMode'

interface SmartSearchBarProps {
  onSearch: (query: string, useAI?: boolean) => void
  isLoading?: boolean
}

export const SmartSearchBar = ({ onSearch, isLoading }: SmartSearchBarProps) => {
  const { t } = useTranslation('search')
  const [query, setQuery] = useState('')

  const handleSearch = () => {
    if (query.trim()) {
      onSearch(query, false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  return (
    <Box position="relative">
      <VStack gap={{ base: 1, md: 2 }} align="stretch">
        <Flex gap={{ base: 1, md: 2 }} flexWrap={{ base: 'wrap', sm: 'nowrap' }} alignItems="stretch">
          <Box flex={1} position="relative" minW="0">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('search_bar.placeholder')}
              size={{ base: 'md', md: 'lg' }}
              bg={bg}
              borderColor={borderColor}
              borderWidth="1px"
              _focus={{
                borderColor: 'brand.300',
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
              display="flex"
              alignItems="center"
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
                  size={{ base: 'xs', md: 'sm' }}
                  variant="ghost"
                  onClick={() => {
                    setQuery('')
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
            colorPalette="brand"
            onClick={handleSearch}
            disabled={!query.trim()}
            loading={isLoading}
            size={{ base: 'sm', md: 'lg' }}
            minW={{ base: '80px', md: 'auto' }}
          >
            {t('common:buttons.search')}
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}