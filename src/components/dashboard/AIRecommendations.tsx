import React from 'react'
import {
  Box,
  Heading,
  VStack,
  HStack,
  Text,
  Button,
  Avatar,
  Badge,
  Spinner,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiArrowRight, FiMail, FiStar } from 'react-icons/fi'
import { useGetRecommendationsQuery } from '../../__data__/api/searchApi'
import { colors } from '../../utils/colorMode'

interface RecommendationCardProps {
  company: {
    id: string
    name: string
    industry: string
    logo?: string
    matchScore: number
    reason: string
  }
  onContact: (id: string) => void
  onViewDetails: (id: string) => void
}

const RecommendationCard = ({
  company,
  onContact,
  onViewDetails,
}: RecommendationCardProps) => {
  const { t } = useTranslation('dashboard')

  return (
    <Box
      bg={colors.bg.primary}
      p={{ base: 3, md: 4 }}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colors.border.primary}
      transition="all 0.2s ease-in-out"
      _hover={{
        shadow: 'md',
        borderColor: 'orange.500',
      }}
    >
      <Flex gap={{ base: 3, md: 4 }} align="start" direction={{ base: 'column', sm: 'row' }}>
        <Avatar.Root size={{ base: 'sm', md: 'md' }} name={company.name} src={company.logo}>
          <Avatar.Fallback>{company.name[0]}</Avatar.Fallback>
        </Avatar.Root>
        <VStack align="start" gap={2} flex={1} minW={0}>
          <Flex justify="space-between" w="full" align="center" flexWrap="wrap" gap={2}>
            <Heading size={{ base: 'xs', md: 'sm' }} lineClamp={1}>
              {company.name}
            </Heading>
            <Badge colorPalette="green" fontSize={{ base: 'xs', md: 'sm' }}>
              <Flex gap={1} align="center">
                <Box as={FiStar} boxSize={{ base: 2, md: 3 }} />
                <Text>{company.matchScore}%</Text>
              </Flex>
            </Badge>
          </Flex>
          <Text fontSize={{ base: '2xs', md: 'xs' }} color="gray.500" lineClamp={1}>
            {company.industry}
          </Text>
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" lineClamp={2}>
            {t('ai_recommendations.reason')} {company.reason}
          </Text>
          <Flex gap={2} pt={2} flexWrap="wrap" w="full">
            <Button
              size={{ base: 'xs', md: 'sm' }}
              variant="outline"
              colorPalette="brand"
              onClick={() => onViewDetails(company.id)}
              flex={{ base: '1', md: '0 0 auto' }}
              minW={{ base: '120px', md: 'auto' }}
            >
              <FiArrowRight />
              <Text ml={1} fontSize={{ base: 'xs', md: 'sm' }}>
                {t('ai_recommendations.view_details')}
              </Text>
            </Button>
            <Button
              size={{ base: 'xs', md: 'sm' }}
              colorPalette="brand"
              onClick={() => onContact(company.id)}
              flex={{ base: '1', md: '0 0 auto' }}
              minW={{ base: '120px', md: 'auto' }}
            >
              <FiMail />
              <Text ml={1} fontSize={{ base: 'xs', md: 'sm' }}>
                {t('ai_recommendations.contact')}
              </Text>
            </Button>
          </Flex>
        </VStack>
      </Flex>
    </Box>
  )
}

export const AIRecommendations = () => {
  const { t } = useTranslation('dashboard')
  const { data: recommendations, isLoading } = useGetRecommendationsQuery()
  const bg = colors.bg.primary

  const handleContact = (id: string) => {
    // TODO: Implement contact logic
    console.log('Contact company:', id)
  }

  const handleViewDetails = (id: string) => {
    // TODO: Navigate to company profile
    console.log('View company:', id)
  }

  return (
    <Box
      bg={bg}
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor={colors.border.primary}
    >
      <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
        {t('ai_recommendations.title')}
      </Heading>

      {isLoading ? (
        <Flex justify="center" align="center" minH={{ base: '150px', md: '200px' }}>
          <Spinner size={{ base: 'lg', md: 'xl' }} color="brand.500" />
          <Text ml={4} fontSize={{ base: 'sm', md: 'md' }}>
            {t('ai_recommendations.loading')}
          </Text>
        </Flex>
      ) : recommendations && recommendations.length > 0 ? (
        <VStack gap={{ base: 3, md: 4 }} align="stretch">
          {recommendations.slice(0, 3).map((company: any) => (
            <RecommendationCard
              key={company.id}
              company={company}
              onContact={handleContact}
              onViewDetails={handleViewDetails}
            />
          ))}
        </VStack>
      ) : (
        <Flex
          direction="column"
          justify="center"
          align="center"
          minH={{ base: '150px', md: '200px' }}
          color="gray.500"
        >
          <Text fontSize={{ base: 'md', md: 'lg' }}>
            {t('ai_recommendations.no_recommendations')}
          </Text>
        </Flex>
      )}
    </Box>
  )
}

