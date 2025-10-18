import React, { useState } from 'react'
import {
  Box,
  Heading,
  SimpleGrid,
  VStack,
  HStack,
  Text,
  Button,
  Dialog,
  Textarea,
  Field,
  Input,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { colors } from '../../utils/colorMode'
import {
  FiEye,
  FiSend,
  FiInbox,
  FiMail,
  FiStar,
  FiSearch,
  FiPlus,
  FiUser,
} from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { StatCard } from '../../components/dashboard/StatCard'
import { AIRecommendations } from '../../components/dashboard/AIRecommendations'
import { useAuth } from '../../hooks/useAuth'
import { useGetCompanyStatsQuery } from '../../__data__/api/companiesApi'
import { useGetHomeAggregatesQuery } from '../../__data__/api/homeApi'
import { useSendBulkRequestMutation } from '../../__data__/api/requestsApi'
import { useToast } from '../../hooks/useToast'

export const DashboardPage = () => {
  const { t } = useTranslation('dashboard')
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: stats, isLoading: _isLoading } = useGetCompanyStatsQuery()
  const { data: aggregates } = useGetHomeAggregatesQuery()
  const [createRequestOpen, setCreateRequestOpen] = useState(false)
  const [requestTitle, setRequestTitle] = useState('')
  const [requestDescription, setRequestDescription] = useState('')
  const [sendBulkRequest, { isLoading: isSendingRequest }] = useSendBulkRequestMutation()
  const { warning, success, error } = useToast()

  const handleCreateRequest = async () => {
    if (!requestTitle.trim() || !requestDescription.trim()) {
      warning(t('common:errors.fill_all_fields'))
      return
    }

    try {
      await sendBulkRequest({
        text: `${requestTitle}\n${requestDescription}`,
        recipientCompanyIds: [],
        files: [],
      }).unwrap()
      
      success(t('common:messages.request_created'))
      setCreateRequestOpen(false)
      setRequestTitle('')
      setRequestDescription('')
    } catch (_error) {
      error(t('common:errors.server_error'))
    }
  }

  const quickActions = [
    {
      icon: FiSearch,
      label: t('quick_actions.search_partners'),
      action: () => navigate('/search'),
      colorPalette: 'brand',
    },
    {
      icon: FiPlus,
      label: t('quick_actions.create_request'),
      action: () => setCreateRequestOpen(true),
      colorPalette: 'green',
    },
    {
      icon: FiUser,
      label: t('quick_actions.update_profile'),
      action: () => navigate('/company/profile'),
      colorPalette: 'blue',
    },
    {
      icon: FiMail,
      label: t('quick_actions.view_messages'),
      action: () => navigate('/messages'),
      colorPalette: 'purple',
    },
  ]

  return (
    <MainLayout>
      <VStack gap={{ base: 4, md: 6 }} align="stretch" px={{ base: 2, md: 0 }}>
        {/* Welcome Header */}
        <Box>
          <Heading size={{ base: 'md', md: 'lg' }} mb={2}>
            {t('welcome', { name: user?.firstName && user?.lastName ? `${user.firstName} ${user.lastName}` : user?.firstName || 'User' })}
          </Heading>
          <Text color="gray.600" fontSize={{ base: 'sm', md: 'md' }}>
            {new Date().toLocaleDateString('ru-RU', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </Text>
        </Box>

        {/* Stats Grid */}
        <SimpleGrid 
          columns={{ base: 1, sm: 2, lg: 4 }} 
          gap={{ base: 4, md: 6 }}
        >
          <StatCard
            title={t('stats.profile_views')}
            value={stats?.profileViews || 0}
            icon={FiEye}
            change={stats?.profileViewsChange}
            changeLabel="за неделю"
            colorPalette="blue"
          />
          <StatCard
            title={t('stats.sent_requests')}
            value={stats?.sentRequests || 0}
            icon={FiSend}
            change={stats?.sentRequestsChange}
            changeLabel="за неделю"
            colorPalette="green"
          />
          <StatCard
            title={t('stats.received_requests')}
            value={stats?.receivedRequests || 0}
            icon={FiInbox}
            change={stats?.receivedRequestsChange}
            changeLabel="за неделю"
            colorPalette="orange"
          />
          <StatCard
            title={t('stats.rating')}
            value={stats?.rating || '0.0'}
            icon={FiStar}
            colorPalette="yellow"
          />
        </SimpleGrid>

        {/* Quick Actions */}
        <Box
          bg={colors.bg.primary}
          p={{ base: 4, md: 6 }}
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor={colors.border.primary}
        >
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
            {t('quick_actions.title')}
          </Heading>
          <SimpleGrid 
            columns={{ base: 2, md: 4 }} 
            gap={{ base: 2, md: 3 }}
            w="full"
          >
            {quickActions.map((action) => (
              <Button
                key={action.label}
                colorPalette={action.colorPalette}
                variant="outline"
                size="sm"
                onClick={action.action}
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                w="full"
                h="auto"
                py={3}
                px={2}
                gap={2}
              >
                <action.icon size={18} />
                <Text 
                  fontSize="xs"
                  whiteSpace="normal"
                  textAlign="center"
                  lineHeight="1.2"
                >
                  {action.label}
                </Text>
              </Button>
            ))}
          </SimpleGrid>
        </Box>

        {/* AI Recommendations */}
        <AIRecommendations />

        {/* Buy/Sell summary */}
        <Box
          bg={colors.bg.primary}
          p={{ base: 4, md: 6 }}
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor={colors.border.primary}
        >
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
            {t('home.summary', 'Я покупаю / Я продаю')}
          </Heading>
          <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <HStack justify="space-between">
                <Heading size="sm">{t('home.buy.title', 'Я покупаю')}</Heading>
                <Button size="sm" onClick={() => navigate('/requests')}>{t('home.view', 'Перейти')}</Button>
              </HStack>
              <HStack mt={3} gap={6}>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="gray.500">{t('home.stats.docs', 'Документы')}</Text>
                  <Heading size="md">{aggregates?.docsCount ?? 0}</Heading>
                </VStack>
                <VStack align="start" gap={0}>
                  <Text fontSize="xs" color="gray.500">{t('home.stats.accepts', 'Акцепты')}</Text>
                  <Heading size="md">{aggregates?.acceptsCount ?? 0}</Heading>
                </VStack>
              </HStack>
            </Box>
            <Box borderWidth="1px" borderRadius="md" p={4}>
              <HStack justify="space-between">
                <Heading size="sm">{t('home.sell.title', 'Я продаю')}</Heading>
                <Button size="sm" onClick={() => navigate('/search')}>{t('home.view', 'Перейти')}</Button>
              </HStack>
              <VStack align="start" gap={0} mt={3}>
                <Text fontSize="xs" color="gray.500">{t('home.stats.requests', 'Исходящие запросы')}</Text>
                <Heading size="md">{aggregates?.requestsCount ?? 0}</Heading>
              </VStack>
            </Box>
          </SimpleGrid>
        </Box>

        {/* Recent Activity */}
        <Box
          bg={colors.bg.primary}
          p={{ base: 4, md: 6 }}
          borderRadius="lg"
          shadow="sm"
          borderWidth="1px"
          borderColor={colors.border.primary}
        >
          <Heading size={{ base: 'sm', md: 'md' }} mb={4}>
            {t('recent_activity.title')}
          </Heading>
          <Text 
            color="gray.500" 
            textAlign="center" 
            py={{ base: 6, md: 8 }}
            fontSize={{ base: 'sm', md: 'md' }}
          >
            {t('recent_activity.no_activity')}
          </Text>
        </Box>
      </VStack>

      {/* Create Request Dialog */}
      <Dialog.Root open={createRequestOpen} onOpenChange={(details) => setCreateRequestOpen(details.open)}>
        <Dialog.Backdrop />
        {/* @ts-ignore */}
        <Dialog.Positioner>
          {/* @ts-ignore */}
          <Dialog.Content>
            {/* @ts-ignore */}
            <Dialog.Header>
              {/* @ts-ignore */}
              <Dialog.Title>{t('quick_actions.create_request')}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4} align="stretch">
                {/* @ts-ignore */}
                <Field.Root required>
                  {/* @ts-ignore */}
                  <Field.Label>{t('common:labels.title')}</Field.Label>
                  <Input 
                    placeholder={t('common:labels.title')}
                    value={requestTitle}
                    onChange={(e) => setRequestTitle(e.target.value)}
                  />
                </Field.Root>
                {/* @ts-ignore */}
                <Field.Root required>
                  {/* @ts-ignore */}
                  <Field.Label>{t('common:labels.description')}</Field.Label>
                  <Textarea 
                    placeholder={t('common:labels.description')}
                    value={requestDescription}
                    onChange={(e) => setRequestDescription(e.target.value)}
                    minH="150px"
                    resize="none"
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            {/* @ts-ignore */}
            <Dialog.Footer>
              <HStack gap={3} justify="flex-end">
                <Button 
                  variant="outline" 
                  onClick={() => setCreateRequestOpen(false)}
                >
                  {t('common:buttons.cancel')}
                </Button>
                <Button
                  colorPalette="green"
                  onClick={handleCreateRequest}
                  loading={isSendingRequest}
                >
                  {t('common:buttons.submit')}
                </Button>
              </HStack>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </MainLayout>
  )
}

