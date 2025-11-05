import React, { useMemo, useState, useEffect } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Button,
  Slider,
  Text,
  Input,
  useDisclosure,
} from '@chakra-ui/react'
import { Checkbox } from '../ui/checkbox'
import { Switch } from '../ui/switch'
import { useTranslation } from 'react-i18next'
import { FiChevronDown, FiChevronUp } from 'react-icons/fi'
import { INDUSTRIES, COMPANY_SIZES, GEOGRAPHY_OPTIONS } from '../../utils/constants'
import type { SearchParams } from '../../__data__/api/searchApi'
import { colors } from '../../utils/colorMode'

interface FiltersPanelProps {
  filters: SearchParams
  onChange: (filters: SearchParams) => void
  onReset: () => void
}

// Вынесен за пределы компонента для предотвращения пересоздания при рендере
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

export const FiltersPanel = ({ filters, onChange, onReset }: FiltersPanelProps) => {
  const { t } = useTranslation('search')
  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  // Локальное состояние для фильтров (не применяются сразу)
  const [localFilters, setLocalFilters] = useState<SearchParams>(filters)

  // Синхронизация с внешними фильтрами при их изменении извне
  useEffect(() => {
    setLocalFilters(filters)
  }, [filters])

  const industryDisclosure = useDisclosure({ defaultIsOpen: true })
  const sizeDisclosure = useDisclosure({ defaultIsOpen: true })
  const geoDisclosure = useDisclosure({ defaultIsOpen: false })
  const ratingDisclosure = useDisclosure({ defaultIsOpen: false })
  const acceptsDisclosure = useDisclosure({ defaultIsOpen: false })

  const hasSelectedFilters = useMemo(() => {
    return Boolean(
      (localFilters.industries && localFilters.industries.length > 0) ||
      (localFilters.companySize && localFilters.companySize.length > 0) ||
      (localFilters.geography && localFilters.geography.length > 0) ||
      (localFilters.minRating && localFilters.minRating > 0) ||
      localFilters.hasReviews ||
      localFilters.hasAcceptedDocs ||
      localFilters.minEmployees ||
      localFilters.maxEmployees
    )
  }, [localFilters])

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

  const handleLocalFilterChange = (newFilters: Partial<SearchParams>) => {
    setLocalFilters({ ...localFilters, ...newFilters })
  }

  const handleApply = () => {
    // Сброс на первую страницу при применении фильтров
    onChange({ ...localFilters, page: 1 })
  }

  const handleReset = () => {
    const resetFilters: SearchParams = {
      page: 1,
      limit: localFilters.limit,
      sortBy: localFilters.sortBy,
      sortOrder: localFilters.sortOrder,
    }
    setLocalFilters(resetFilters)
    onReset()
  }

  return (
    <Box
      bg={bg}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      display="flex"
      flexDirection="column"
    >
      <Box p={4} flex="1" overflowY="auto">
        <VStack gap={4} align="stretch">
          <Heading size="md">{t('filters.title')}</Heading>

          {/* Industry Filter */}
          <FilterSection title={t('filters.industry')} disclosure={industryDisclosure}>
            <VStack gap={2} align="stretch">
              {INDUSTRIES.slice(0, 8).map((industry) => {
                const isChecked = (localFilters.industries || []).includes(industry.value)
                return (
                  <Checkbox
                    key={industry.value} 
                    checked={isChecked}
                    onCheckedChange={(e) => {
                      handleCheckboxChange(
                        localFilters.industries || [],
                        industry.value,
                        (newValues) => handleLocalFilterChange({ industries: newValues })
                      )
                    }}
                    _hover={{ bg: 'gray.50' }}
                    p={1}
                    borderRadius="md"
                    cursor="pointer"
                  >
                    {industry.label}
                  </Checkbox>
                )
              })}
            </VStack>
          </FilterSection>

          {/* Company Size Filter */}
          <FilterSection title={t('filters.company_size')} disclosure={sizeDisclosure}>
            <VStack gap={3} align="stretch">
              {COMPANY_SIZES.map((size) => {
                const isChecked = (localFilters.companySize || []).includes(size.value)
                return (
                  <Checkbox
                    key={size.value} 
                    checked={isChecked}
                    onCheckedChange={(e) => {
                      handleCheckboxChange(
                        localFilters.companySize || [],
                        size.value,
                        (newValues) => handleLocalFilterChange({ companySize: newValues })
                      )
                    }}
                    _hover={{ bg: 'gray.50' }}
                    p={1}
                    borderRadius="md"
                    cursor="pointer"
                  >
                    {size.label}
                  </Checkbox>
                )
              })}
              
              {/* Custom Range */}
              <Box pt={3} borderTopWidth="1px" borderColor={borderColor}>
                <Text fontSize="sm" fontWeight="medium" mb={2}>
                  {t('filters.custom_range')}
                </Text>
                <HStack gap={2}>
                  <Input
                    type="number"
                    placeholder={t('filters.employees_placeholder_from')}
                    value={localFilters.minEmployees ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      handleLocalFilterChange({ minEmployees: value })
                    }}
                    size="sm"
                    min={0}
                  />
                  <Text fontSize="sm">—</Text>
                  <Input
                    type="number"
                    placeholder={t('filters.employees_placeholder_to')}
                    value={localFilters.maxEmployees ?? ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? undefined : parseInt(e.target.value, 10)
                      handleLocalFilterChange({ maxEmployees: value })
                    }}
                    size="sm"
                    min={0}
                  />
                </HStack>
              </Box>
            </VStack>
          </FilterSection>

          {/* Geography Filter */}
          <FilterSection title={t('filters.geography')} disclosure={geoDisclosure}>
            <VStack gap={2} align="stretch">
              {GEOGRAPHY_OPTIONS.slice(0, 8).map((geo) => {
                const isChecked = (localFilters.geography || []).includes(geo.value)
                return (
                  <Checkbox
                    key={geo.value} 
                    checked={isChecked}
                    onCheckedChange={(e) => {
                      handleCheckboxChange(
                        localFilters.geography || [],
                        geo.value,
                        (newValues) => handleLocalFilterChange({ geography: newValues })
                      )
                    }}
                    _hover={{ bg: 'gray.50' }}
                    p={1}
                    borderRadius="md"
                    cursor="pointer"
                  >
                    {geo.label}
                  </Checkbox>
                )
              })}
            </VStack>
          </FilterSection>

          {/* Rating Filter */}
          <FilterSection title={t('filters.rating')} disclosure={ratingDisclosure}>
            <VStack gap={4} align="stretch">
              <Text fontSize="sm" color="gray.600">
                {t('filters.min_rating')}: {localFilters.minRating || 0}
              </Text>
              <Slider.Root
                value={[localFilters.minRating || 0]}
                onValueChange={(details) => handleLocalFilterChange({ minRating: details.value[0] })}
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
                <Switch
                  checked={Boolean(localFilters.hasReviews)}
                  onCheckedChange={(e) => {
                    handleLocalFilterChange({ hasReviews: e.checked })
                  }}
                />
              </HStack>
              <HStack justify="space-between">
                <Text>{t('filters.has_accepted_docs') || 'С акцептами документации'}</Text>
                <Switch
                  checked={Boolean(localFilters.hasAcceptedDocs)}
                  onCheckedChange={(e) => {
                    handleLocalFilterChange({ hasAcceptedDocs: e.checked })
                  }}
                />
              </HStack>
            </VStack>
          </FilterSection>
        </VStack>
      </Box>

      {/* Footer with Apply and Reset buttons */}
      <Box
        p={3}
        borderTopWidth="1px"
        borderColor={borderColor}
        bg={bg}
      >
        <VStack gap={2}>
          <Button
            w="full"
            colorPalette="brand"
            onClick={handleApply}
            size="sm"
          >
            {t('filters.apply')}
          </Button>
          <Button
            w="full"
            variant="outline"
            onClick={handleReset}
            disabled={!hasSelectedFilters}
            size="sm"
          >
            {t('filters.reset')}
          </Button>
        </VStack>
      </Box>
    </Box>
  )
}
