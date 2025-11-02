import React, { useMemo } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Checkbox,
  Slider,
  Text,
  Switch,
  useDisclosure,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { INDUSTRIES, COMPANY_SIZES, GEOGRAPHY_OPTIONS } from '../../utils/constants'
import type { SearchParams } from '../../__data__/api/searchApi'
import { colors } from '../../utils/colorMode'

interface FiltersPanelProps {
  filters: SearchParams
  onChange: (filters: SearchParams) => void
  onReset: () => void
  onApply?: () => void
}

export const FiltersPanel = ({ filters, onChange, onReset, onApply }: FiltersPanelProps) => {
  const { t } = useTranslation('search')
  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  const industryDisclosure = useDisclosure({ defaultIsOpen: true })
  const sizeDisclosure = useDisclosure({ defaultIsOpen: true })
  const geoDisclosure = useDisclosure({ defaultIsOpen: false })
  const ratingDisclosure = useDisclosure({ defaultIsOpen: false })
  const acceptsDisclosure = useDisclosure({ defaultIsOpen: false })

  const hasSelectedFilters = useMemo(() => {
    return Boolean(
      (filters.industries && filters.industries.length > 0) ||
      (filters.companySize && filters.companySize.length > 0) ||
      (filters.geography && filters.geography.length > 0) ||
      (filters.minRating && filters.minRating > 0) ||
      filters.hasReviews ||
      filters.hasAcceptedDocs
    )
  }, [filters])

  const FilterSection = ({
    title,
    disclosure,
    children,
  }: {
    title: string
    disclosure: ReturnType<typeof useDisclosure>
    children: React.ReactNode
  }) => (
    <Box>
      <Button
        w="full"
        justifyContent="space-between"
        onClick={disclosure.onToggle}
        variant="ghost"
        fontWeight="bold"
      >
        {title}
        {disclosure.open ? <FiChevronUp /> : <FiChevronDown />}
      </Button>
      {disclosure.open && (
        <Box pt={3} pb={4}>
          {children}
        </Box>
      )}
    </Box>
  )

  // Helper function to handle checkbox changes
  const handleCheckboxChange = (
    currentValues: string[],
    value: string,
    callback: (newValues: string[]) => void
  ) => {
    if (currentValues.includes(value)) {
      callback(currentValues.filter((v) => v !== value))
    } else {
      callback([...currentValues, value])
    }
  }

  const handleFilterChange = (newFilters: SearchParams) => {
    // Сброс на первую страницу при изменении фильтров
    onChange({ ...newFilters, page: 1 })
  }

  return (
    <Box
      bg={bg}
      p={4}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
    >
      <VStack gap={4} align="stretch">
        <HStack justify="space-between" align="center">
          <Heading size="md">{t('filters.title')}</Heading>
          <HStack gap={2}>
            <Button
              size="sm"
              variant="ghost"
              colorPalette="brand"
              onClick={onReset}
              disabled={!hasSelectedFilters}
            >
              {t('filters.reset')}
            </Button>
            {onApply && (
              <Button
                size="sm"
                colorPalette="brand"
                variant="solid"
                onClick={onApply}
                disabled={!hasSelectedFilters}
              >
                {t('filters.apply')}
              </Button>
            )}
          </HStack>
        </HStack>

        {/* Industry Filter */}
        <FilterSection title={t('filters.industry')} disclosure={industryDisclosure}>
          <VStack gap={2} align="stretch">
            {INDUSTRIES.slice(0, 8).map((industry) => {
              const isChecked = (filters.industries || []).includes(industry.value)
              return (
                <Checkbox.Root 
                  key={industry.value} 
                  checked={isChecked}
                  onCheckedChange={(details) => {
                    handleCheckboxChange(
                      filters.industries || [],
                      industry.value,
                      (newValues) => handleFilterChange({ ...filters, industries: newValues })
                    )
                  }}
                  _hover={{ bg: 'gray.50' }}
                  p={1}
                  borderRadius="md"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label cursor="pointer">{industry.label}</Checkbox.Label>
                </Checkbox.Root>
              )
            })}
          </VStack>
        </FilterSection>

        {/* Company Size Filter */}
        <FilterSection title={t('filters.company_size')} disclosure={sizeDisclosure}>
          <VStack gap={2} align="stretch">
            {COMPANY_SIZES.map((size) => {
              const isChecked = (filters.companySize || []).includes(size.value)
              return (
                <Checkbox.Root 
                  key={size.value} 
                  checked={isChecked}
                  onCheckedChange={(details) => {
                    handleCheckboxChange(
                      filters.companySize || [],
                      size.value,
                      (newValues) => handleFilterChange({ ...filters, companySize: newValues })
                    )
                  }}
                  _hover={{ bg: 'gray.50' }}
                  p={1}
                  borderRadius="md"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label cursor="pointer">{size.label}</Checkbox.Label>
                </Checkbox.Root>
              )
            })}
          </VStack>
        </FilterSection>

        {/* Geography Filter */}
        <FilterSection title={t('filters.geography')} disclosure={geoDisclosure}>
          <VStack gap={2} align="stretch">
            {GEOGRAPHY_OPTIONS.slice(0, 8).map((geo) => {
              const isChecked = (filters.geography || []).includes(geo.value)
              return (
                <Checkbox.Root 
                  key={geo.value} 
                  checked={isChecked}
                  onCheckedChange={(details) => {
                    handleCheckboxChange(
                      filters.geography || [],
                      geo.value,
                      (newValues) => handleFilterChange({ ...filters, geography: newValues })
                    )
                  }}
                  _hover={{ bg: 'gray.50' }}
                  p={1}
                  borderRadius="md"
                >
                  <Checkbox.HiddenInput />
                  <Checkbox.Control />
                  <Checkbox.Label cursor="pointer">{geo.label}</Checkbox.Label>
                </Checkbox.Root>
              )
            })}
          </VStack>
        </FilterSection>

        {/* Rating Filter */}
        <FilterSection title={t('filters.rating')} disclosure={ratingDisclosure}>
          <VStack gap={4} align="stretch">
            <Text fontSize="sm" color="gray.600">
              {t('filters.min_rating')}: {filters.minRating || 0}
            </Text>
            <Slider.Root
              value={[filters.minRating || 0]}
              onValueChange={(details) => handleFilterChange({ ...filters, minRating: details.value[0] })}
              min={0}
              max={5}
              step={0.5}
              colorPalette="brand"
            >
              <Slider.Control>
                <Slider.Track>
                  <Slider.Range />
                </Slider.Track>
                <Slider.Thumb index={0} />
              </Slider.Control>
            </Slider.Root>
          </VStack>
        </FilterSection>

        {/* Reviews/Accepts Filters */}
        <FilterSection title={t('filters.advanced') || 'Дополнительно'} disclosure={acceptsDisclosure}>
          <VStack gap={3} align="stretch">
            <HStack justify="space-between">
              <Text>{t('filters.has_reviews') || 'Есть отзывы'}</Text>
              <Switch.Root
                checked={Boolean(filters.hasReviews)}
                onCheckedChange={(details) => {
                  handleFilterChange({ ...filters, hasReviews: details.checked })
                }}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </HStack>
            <HStack justify="space-between">
              <Text>{t('filters.has_accepted_docs') || 'С акцептами документации'}</Text>
              <Switch.Root
                checked={Boolean(filters.hasAcceptedDocs)}
                onCheckedChange={(details) => {
                  handleFilterChange({ ...filters, hasAcceptedDocs: details.checked })
                }}
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </HStack>
          </VStack>
        </FilterSection>
        {onApply && (
          <Button
            mt={2}
            size="md"
            colorPalette="brand"
            display={{ base: 'flex', md: 'none' }}
            onClick={onApply}
            disabled={!hasSelectedFilters}
          >
            {t('filters.apply')}
          </Button>
        )}
      </VStack>
    </Box>
  )
}
