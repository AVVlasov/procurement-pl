import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Text,
  Avatar,
  Badge,
  Button,
  IconButton,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiMapPin, FiUsers, FiStar, FiHeart, FiMail, FiExternalLink } from 'react-icons/fi'
import { colors } from '../../utils/colorMode'
import { useNavigate } from 'react-router-dom'
import type { Company } from '../../__data__/api/companiesApi'

interface CompanyCardProps {
  company: Company
  onContact?: (companyId: string) => void
  onToggleFavorite?: (companyId: string) => void
  isFavorite?: boolean
}

export const CompanyCard = ({
  company,
  onContact,
  onToggleFavorite,
  isFavorite = false,
}: CompanyCardProps) => {
  const { t } = useTranslation('search')
  const navigate = useNavigate()
  const bg = colors.bg.primary
  const borderColor = colors.border.primary

  return (
    <Box
      bg={bg}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={borderColor}
      shadow="sm"
      transition="all 0.3s"
      _hover={{
        shadow: 'lg',
        borderColor: 'brand.500',
        transform: 'translateY(-2px)',
      }}
    >
      <VStack gap={4} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start">
          <Flex gap={4} flex={1} align="start">
            <Avatar.Root
              size="lg"
              name={company.fullName}
              src={company.logo}
              bg="brand.500"
            >
              <Avatar.Fallback>{(company.shortName || company.fullName)[0]}</Avatar.Fallback>
            </Avatar.Root>
            <VStack align="start" gap={1} flex={1}>
              <Flex gap={2} align="center">
                <Text fontSize="xl" fontWeight="bold">
                  {company.shortName || company.fullName}
                </Text>
                {company.verified && (
                  <Badge colorPalette="green" fontSize="xs">
                    ✓ Verified
                  </Badge>
                )}
              </Flex>
              <Text fontSize="sm" color="gray.500">
                {company.industry}
              </Text>
            </VStack>
          </Flex>
          
          <IconButton
            aria-label={isFavorite ? t('results.remove_from_favorites') : t('results.add_to_favorites')}
            variant="ghost"
            colorPalette={isFavorite ? 'red' : 'gray'}
            color={isFavorite ? 'red.500' : undefined}
            onClick={() => onToggleFavorite?.(company.id)}
          >
            <FiHeart />
          </IconButton>
        </Flex>

        {/* Description/Slogan */}
        {company.slogan && (
          <Text fontSize="sm" color="gray.600" fontStyle="italic">
            "{company.slogan}"
          </Text>
        )}

        {/* Company Info */}
        <Flex gap={6} flexWrap="wrap">
          {company.companySize && (
            <Flex gap={2} fontSize="sm" align="center">
              <Box as={FiUsers} color="gray.500" />
              <Text>{company.companySize}</Text>
            </Flex>
          )}
          {company.rating && (
            <Flex gap={2} fontSize="sm" align="center">
              <Box as={FiStar} color="yellow.500" />
              <Text fontWeight="bold">{company.rating.toFixed(1)}</Text>
            </Flex>
          )}
          {company.legalAddress && (
            <Flex gap={2} fontSize="sm" color="gray.600" align="center">
              <Box as={FiMapPin} />
              <Text lineClamp={1}>{company.legalAddress}</Text>
            </Flex>
          )}
        </Flex>

        {/* Tags */}
        <HStack gap={2} flexWrap="wrap">
          <Badge colorPalette="blue">{company.legalForm}</Badge>
          {company.employeeCount && (
            <Badge colorPalette="purple">{company.employeeCount}</Badge>
          )}
        </HStack>

        {/* Actions */}
        <Flex gap={3}>
          <Button
            flex={1}
            colorPalette="brand"
            onClick={() => navigate(`/company/${company.id}`)}
          >
            <Text mr={2}>{t('results.view_details')}</Text>
            <FiExternalLink />
          </Button>
          <Button
            flex={1}
            variant="outline"
            colorPalette="brand"
            onClick={() => onContact?.(company.id)}
          >
            <FiMail />
            <Text ml={2}>{t('results.contact')}</Text>
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}