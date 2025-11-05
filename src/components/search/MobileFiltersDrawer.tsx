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
import { Drawer } from '../ui/drawer'
import { Checkbox } from '../ui/checkbox'
import { Switch } from '../ui/switch'
import { useTranslation } from 'react-i18next'
import { FiChevronDown, FiChevronUp, FiX } from 'react-icons/fi'
import { INDUSTRIES, COMPANY_SIZES, GEOGRAPHY_OPTIONS } from '../../utils/constants'
import type { SearchParams } from '../../__data__/api/searchApi'
import { colors } from '../../utils/colorMode'

interface MobileFiltersDrawerProps {
  open: boolean
  onClose: () => void
  filters: SearchParams
  onChange: (filters: SearchParams) => void
  onReset: () => void
}

// Вынесен за пределы компонента для предотвращения пересоздания при рендере
const MobileFilterSection = ({
  title,
  disclosure,
  children,
  borderColor,
}: {
  title: string
  disclosure: ReturnType<typeof useDisclosure>
  children: React.ReactNode
  borderColor: string
}) => (
  <Box borderBottomWidth="1px" borderColor={borderColor}>
    <Button
      w="full"
      justifyContent="space-between"
      onClick={disclosure.onToggle}
      variant="ghost"
      fontWeight="bold"
      py={4}
      px={4}
      borderRadius="none"
    >
      {title}
      {disclosure.open ? <FiChevronUp /> : <FiChevronDown />}
    </Button>
    {disclosure.open && (
      <Box px={4} pb={4}>
        {children}
      </Box>
    )}
  </Box>
)

export const MobileFiltersDrawer = ({
  open,
  onClose,
  filters,
  onChange,
  onReset,
}: MobileFiltersDrawerProps) => {
  const { t } = useTranslation('search')
  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  // Локальное состояние для фильтров (не применяются сразу)
  const [localFilters, setLocalFilters] = useState<SearchParams>(filters)

  // Синхронизация с внешними фильтрами при открытии drawer
  useEffect(() => {
    if (open) {
      setLocalFilters(filters)
    }
  }, [open, filters])

  const industryDisclosure = useDisclosure({ defaultIsOpen: true })
  const sizeDisclosure = useDisclosure({ defaultIsOpen: false })
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
    // Применяем локальные фильтры
    onChange({ ...localFilters, page: 1 })
    onClose()
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

  // Применяем фильтры при закрытии drawer
  const handleClose = () => {
    onChange({ ...localFilters, page: 1 })
    onClose()
  }

  return (
    <Drawer.Root
      open={open}
      onOpenChange={(e) => {
        if (!e.open) {
          handleClose()
        }
      }}
      placement="bottom"
      size="full"
    >
      <Drawer.Backdrop />
      <Drawer.Content>
        {/* Header */}
        <Drawer.Header
          borderBottomWidth="1px"
          borderColor={borderColor}
          bg={bg}
          position="sticky"
          top={0}
          zIndex={10}
        >
          <HStack justify="space-between" w="full">
            <Drawer.Title fontSize="xl" fontWeight="bold">
              {t('filters.title')}
            </Drawer.Title>
            <Drawer.CloseTrigger asChild>
              <Button variant="ghost" size="sm" onClick={handleClose}>
                <FiX size={24} />
              </Button>
            </Drawer.CloseTrigger>
          </HStack>
        </Drawer.Header>

        {/* Body */}
        <Drawer.Body p={0} overflowY="auto">
          <VStack gap={0} align="stretch">
            {/* Industry Filter */}
            <MobileFilterSection title={t('filters.industry')} disclosure={industryDisclosure} borderColor={borderColor}>
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
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                    >
                      {industry.label}
                    </Checkbox>
                  )
                })}
              </VStack>
            </MobileFilterSection>

          {/* Company Size Filter */}
          <MobileFilterSection title={t('filters.company_size')} disclosure={sizeDisclosure} borderColor={borderColor}>
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
                    p={2}
                    borderRadius="md"
                    cursor="pointer"
                  >
                    {size.label}
                  </Checkbox>
                )
              })}

              {/* Custom Range */}
              <Box pt={3} borderTopWidth="1px" borderColor={borderColor}>
                <Text fontSize="sm" fontWeight="medium" mb={3}>
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
                    size="md"
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
                    size="md"
                    min={0}
                  />
                </HStack>
              </Box>
            </VStack>
          </MobileFilterSection>

            {/* Geography Filter */}
            <MobileFilterSection title={t('filters.geography')} disclosure={geoDisclosure} borderColor={borderColor}>
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
                      p={2}
                      borderRadius="md"
                      cursor="pointer"
                    >
                      {geo.label}
                    </Checkbox>
                  )
                })}
              </VStack>
            </MobileFilterSection>

            {/* Rating Filter */}
            <MobileFilterSection title={t('filters.rating')} disclosure={ratingDisclosure} borderColor={borderColor}>
              <VStack gap={4} align="stretch">
                <Text fontSize="sm" color="gray.600">
                  {t('filters.min_rating')}: {localFilters.minRating || 0}
                </Text>
                <Slider.Root
                  value={[localFilters.minRating || 0]}
                  onValueChange={(details) =>
                    handleLocalFilterChange({ minRating: details.value[0] })
                  }
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
            </MobileFilterSection>

            {/* Advanced Filters */}
            <MobileFilterSection
              title={t('filters.advanced') || 'Дополнительно'}
              disclosure={acceptsDisclosure}
              borderColor={borderColor}
            >
              <VStack gap={3} align="stretch">
                <HStack justify="space-between" py={2}>
                  <Text>{t('filters.has_reviews') || 'Есть отзывы'}</Text>
                  <Switch
                    checked={Boolean(localFilters.hasReviews)}
                    onCheckedChange={(e) => {
                      handleLocalFilterChange({ hasReviews: e.checked })
                    }}
                  />
                </HStack>
                <HStack justify="space-between" py={2}>
                  <Text>{t('filters.has_accepted_docs') || 'С акцептами документации'}</Text>
                  <Switch
                    checked={Boolean(localFilters.hasAcceptedDocs)}
                    onCheckedChange={(e) => {
                      handleLocalFilterChange({ hasAcceptedDocs: e.checked })
                    }}
                  />
                </HStack>
              </VStack>
            </MobileFilterSection>
          </VStack>
        </Drawer.Body>

        {/* Footer */}
        <Drawer.Footer
          borderTopWidth="1px"
          borderColor={borderColor}
          bg={bg}
          position="sticky"
          bottom={0}
          zIndex={10}
        >
          <HStack w="full" gap={3}>
            <Button
              flex={1}
              variant="outline"
              onClick={handleReset}
              disabled={!hasSelectedFilters}
              size="lg"
            >
              {t('filters.reset')}
            </Button>
            <Button
              flex={2}
              colorPalette="brand"
              onClick={handleApply}
              size="lg"
            >
              {t('filters.apply')}
            </Button>
          </HStack>
        </Drawer.Footer>
      </Drawer.Content>
    </Drawer.Root>
  )
}

