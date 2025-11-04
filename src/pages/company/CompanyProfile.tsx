import React, { useState, useEffect } from 'react'
import {
  Box,
  Container,
  Tabs,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useParams, useSearchParams } from 'react-router-dom'
import { MainLayout } from '../../components/layout/MainLayout'
import { AboutTab } from './tabs/AboutTab'
import { SpecializationTab } from './tabs/SpecializationTab'
import { BuyProductsTab } from './tabs/BuyProductsTab'
import { LegalTab } from './tabs/LegalTab'
import { ReviewsTab } from './tabs/ReviewsTab'
import { ExperienceTab } from './tabs/ExperienceTab'
import { useAuth } from '../../hooks/useAuth'
import { colors } from '../../utils/colorMode'

export const CompanyProfile = () => {
  const { t } = useTranslation('company')
  const { id: companyIdFromUrl } = useParams<{ id: string }>()
  const { company: currentUserCompany } = useAuth()
  const [searchParams] = useSearchParams()
  const tabFromUrl = searchParams.get('tab')
  const [tabValue, setTabValue] = useState(tabFromUrl || 'about')

  useEffect(() => {
    if (tabFromUrl) {
      setTabValue(tabFromUrl)
    }
  }, [tabFromUrl])

  // Determine if viewing own company or other company
  const isOwnCompany = !companyIdFromUrl || currentUserCompany?.id === companyIdFromUrl
  const displayedCompanyId = companyIdFromUrl || currentUserCompany?.id

  return (
    <MainLayout>
      <Container maxW="container.xl" px={{ base: 0, md: 4 }}>
        <Box
          bg={colors.bg.primary}
          borderRadius={{ base: 'none', md: 'lg' }}
          shadow={{ base: 'none', md: 'sm' }}
          borderWidth={{ base: 0, md: '1px' }}
          borderColor={colors.border.primary}
          overflow="hidden"
        >
          <Tabs.Root
            value={tabValue}
            onValueChange={(details) => setTabValue(details.value)}
            colorPalette="brand"
            variant="enclosed"
            orientation="horizontal"
          >
            <Tabs.List 
              flexDirection="row"
              overflowX={{ base: 'auto', md: 'visible' }}
              flexWrap={{ base: 'nowrap', md: 'wrap' }}
              minW="auto"
              maxW="none"
              p={{ base: 2, md: 0 }}
              bg={colors.bg.secondary}
              borderRadius={{ base: 'md', md: 'none' }}
            >
              <Tabs.Trigger 
                value="about"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.about')}
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="specialization"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.specialization')}
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="buy"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.buy')}
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="legal"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.legal')}
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="experience"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.experience')}
              </Tabs.Trigger>
              <Tabs.Trigger 
                value="reviews"
                whiteSpace="nowrap"
                fontSize={{ base: 'sm', md: 'md' }}
                px={{ base: 3, md: 4 }}
                py={{ base: 2, md: 3 }}
                borderRadius={{ base: 'md', md: 'none' }}
                fontWeight="medium"
                transition="all 0.2s"
                _hover={{
                  bg: colors.bg.hover,
                  color: colors.text.primary
                }}
                _selected={{
                  bg: colors.bg.active,
                  color: colors.text.active,
                  fontWeight: 'semibold',
                  borderBottom: '3px solid',
                  borderBottomColor: 'brand.500'
                }}
              >
                {t('tabs.reviews')}
              </Tabs.Trigger>
            </Tabs.List>

            <Box flex="1" p={{ base: 4, md: 6 }}>
              <Tabs.Content value="about">
                <AboutTab companyId={displayedCompanyId} isOwnCompany={isOwnCompany} />
              </Tabs.Content>
              <Tabs.Content value="specialization">
                <SpecializationTab companyId={displayedCompanyId} isOwnCompany={isOwnCompany} />
              </Tabs.Content>
              <Tabs.Content value="buy">
                <BuyProductsTab companyId={displayedCompanyId} isOwnCompany={isOwnCompany} />
              </Tabs.Content>
              <Tabs.Content value="legal">
                <LegalTab companyId={displayedCompanyId} isOwnCompany={isOwnCompany} />
              </Tabs.Content>
              <Tabs.Content value="experience">
                <ExperienceTab companyId={displayedCompanyId} isOwnCompany={isOwnCompany} />
              </Tabs.Content>
              <Tabs.Content value="reviews">
                <ReviewsTab isOwnCompany={isOwnCompany} companyId={displayedCompanyId} />
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </Box>
      </Container>
    </MainLayout>
  )
}

