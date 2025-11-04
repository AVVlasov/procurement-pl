import React from 'react'
import { Box, VStack, HStack, Text, Badge, Spinner } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import {
  FiMail,
  FiSend,
  FiInbox,
  FiCheckCircle,
  FiStar,
  FiUser,
  FiShoppingCart,
  FiPackage,
} from 'react-icons/fi'
import { useGetActivitiesQuery, type Activity } from '../../__data__/api/activityApi'
import { colors } from '../../utils/colorMode'

const getActivityIcon = (type: Activity['type']) => {
  switch (type) {
    case 'message_received':
      return FiMail
    case 'message_sent':
      return FiSend
    case 'request_received':
      return FiInbox
    case 'request_sent':
      return FiSend
    case 'request_response':
      return FiCheckCircle
    case 'product_accepted':
      return FiCheckCircle
    case 'review_received':
      return FiStar
    case 'profile_updated':
      return FiUser
    case 'product_added':
      return FiPackage
    case 'buy_product_added':
      return FiShoppingCart
    default:
      return FiInbox
  }
}

const getActivityColor = (type: Activity['type']) => {
  switch (type) {
    case 'message_received':
      return 'blue'
    case 'message_sent':
      return 'green'
    case 'request_received':
      return 'orange'
    case 'request_sent':
      return 'purple'
    case 'request_response':
      return 'green'
    case 'product_accepted':
      return 'green'
    case 'review_received':
      return 'yellow'
    case 'profile_updated':
      return 'blue'
    case 'product_added':
      return 'teal'
    case 'buy_product_added':
      return 'cyan'
    default:
      return 'gray'
  }
}

const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString)
  const now = new Date()
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'только что'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} мин. назад`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} ч. назад`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} д. назад`
  return date.toLocaleDateString('ru-RU')
}

export const RecentActivity = () => {
  const { t } = useTranslation('dashboard')
  const { data, isLoading } = useGetActivitiesQuery({ limit: 5 })

  if (isLoading) {
    return (
      <Box
        bg={colors.bg.primary}
        p={{ base: 4, md: 6 }}
        borderRadius="lg"
        shadow="sm"
        borderWidth="1px"
        borderColor={colors.border.primary}
      >
        <HStack justify="center" py={8}>
          <Spinner size="md" colorPalette="brand" />
          <Text color="gray.500">{t('recent_activity.loading', 'Загрузка...')}</Text>
        </HStack>
      </Box>
    )
  }

  const activities = data?.activities || []

  return (
    <Box
      bg={colors.bg.primary}
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor={colors.border.primary}
    >
      {activities.length === 0 ? (
        <Text
          color="gray.500"
          textAlign="center"
          py={{ base: 6, md: 8 }}
          fontSize={{ base: 'sm', md: 'md' }}
        >
          {t('recent_activity.no_activity', 'Нет активности')}
        </Text>
      ) : (
        <VStack gap={3} align="stretch">
          {activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const color = getActivityColor(activity.type)

            return (
              <Box
                key={activity._id || activity.id}
                p={{ base: 3, md: 4 }}
                borderRadius="md"
                borderWidth="1px"
                borderColor={activity.read ? 'gray.200' : 'brand.200'}
                bg={activity.read ? 'white' : 'brand.50'}
                transition="all 0.2s"
                _hover={{
                  shadow: 'sm',
                  borderColor: 'brand.300',
                }}
              >
                <HStack gap={3} align="start">
                  <Box
                    p={2}
                    borderRadius="full"
                    bg={`${color}.100`}
                    color={`${color}.600`}
                    flexShrink={0}
                  >
                    <Icon size={18} />
                  </Box>

                  <VStack align="start" gap={1} flex={1} minW={0}>
                    <HStack justify="space-between" w="full" flexWrap="wrap" gap={2}>
                      <Text
                        fontWeight={activity.read ? 'normal' : 'semibold'}
                        fontSize={{ base: 'sm', md: 'md' }}
                        color={colors.text.primary}
                      >
                        {activity.title}
                      </Text>
                      <Text
                        fontSize="xs"
                        color="gray.500"
                        flexShrink={0}
                      >
                        {formatTimeAgo(activity.createdAt)}
                      </Text>
                    </HStack>

                    {activity.description && (
                      <Text
                        fontSize="sm"
                        color="gray.600"
                        noOfLines={2}
                      >
                        {activity.description}
                      </Text>
                    )}

                    {activity.relatedCompanyName && (
                      <Badge
                        colorPalette={color}
                        size="sm"
                        fontSize="xs"
                      >
                        {activity.relatedCompanyName}
                      </Badge>
                    )}
                  </VStack>
                </HStack>
              </Box>
            )
          })}
        </VStack>
      )}
    </Box>
  )
}

