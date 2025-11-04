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
  onContact?: (companyId: string, companyName?: string) => void
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

  const handleContact = () => {
    navigate(`/messages?companyId=${company.id}`)
  }

  return (
    <Box
      bg={bg}
      p={{ base: 4, sm: 5, md: 6 }}
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
      <VStack gap={{ base: 3, md: 4 }} align="stretch">
        {/* Header */}
        <Flex justify="space-between" align="start" gap={2} flexWrap={{ base: 'wrap', sm: 'nowrap' }}>
          <Flex gap={{ base: 3, md: 4 }} flex={1} align="start" minW="0">
            <Avatar.Root
              size={{ base: 'md', md: 'lg' }}
              name={company.fullName}
              src={company.logo}
              bg="brand.500"
              flexShrink={0}
            >
              <Avatar.Fallback>{(company.shortName || company.fullName)[0]}</Avatar.Fallback>
            </Avatar.Root>
            <VStack align="start" gap={1} flex={1} minW="0">
              <Flex gap={2} align="center" flexWrap="wrap">
                <Text fontSize={{ base: 'lg', md: 'xl' }} fontWeight="bold" noOfLines={2}>
                  {company.shortName || company.fullName}
                </Text>
                {company.verified && (
                  <Badge colorPalette="green" fontSize={{ base: 'xs', md: 'xs' }} flexShrink={0}>
                    ✓ Verified
                  </Badge>
                )}
              </Flex>
              <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.500" noOfLines={1}>
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
            size={{ base: 'sm', md: 'md' }}
            flexShrink={0}
          >
            <FiHeart />
          </IconButton>
        </Flex>

        {/* Description/Slogan */}
        {company.slogan && (
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" fontStyle="italic" noOfLines={2}>
            "{company.slogan}"
          </Text>
        )}

        {/* Company Info */}
        <Flex gap={{ base: 3, md: 6 }} flexWrap="wrap">
          {company.companySize && (
            <Flex gap={2} fontSize={{ base: 'xs', md: 'sm' }} align="center">
              <Box as={FiUsers} color="gray.500" flexShrink={0} />
              <Text noOfLines={1}>{company.companySize}</Text>
            </Flex>
          )}
          {company.rating && (
            <Flex gap={2} fontSize={{ base: 'xs', md: 'sm' }} align="center">
              <Box as={FiStar} color="yellow.500" flexShrink={0} />
              <Text fontWeight="bold">{company.rating.toFixed(2)}</Text>
            </Flex>
          )}
          {company.legalAddress && (
            <Flex gap={2} fontSize={{ base: 'xs', md: 'sm' }} color="gray.600" align="center" minW="0">
              <Box as={FiMapPin} flexShrink={0} />
              <Text lineClamp={1}>{company.legalAddress}</Text>
            </Flex>
          )}
        </Flex>

        {/* Tags */}
        <Flex gap={2} flexWrap="wrap">
          <Badge colorPalette="blue" fontSize={{ base: 'xs', md: 'sm' }}>{company.legalForm}</Badge>
          {company.employeeCount && (
            <Badge colorPalette="purple" fontSize={{ base: 'xs', md: 'sm' }}>{company.employeeCount}</Badge>
          )}
        </Flex>

        {/* Actions */}
        <Flex gap={{ base: 2, md: 3 }} direction={{ base: 'column', sm: 'row' }}>
          <Button
            flex={1}
            colorPalette="brand"
            onClick={() => navigate(`/company/${company.id}`)}
            size={{ base: 'sm', md: 'md' }}
          >
            <Text mr={1}>{t('results.view_details')}</Text>
            <FiExternalLink />
          </Button>
          <Button
            flex={1}
            variant="outline"
            colorPalette="brand"
            onClick={handleContact}
            size={{ base: 'sm', md: 'md' }}
          >
            <FiMail />
            <Text ml={1}>{t('results.contact')}</Text>
          </Button>
        </Flex>
      </VStack>
    </Box>
  )
}