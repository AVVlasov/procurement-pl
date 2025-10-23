import React, { useState, useMemo } from 'react'
import { 
  Box, Text, VStack, HStack, Button, Input, Field, Dialog, Textarea, 
  Container, Heading, Badge, Flex
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSearch, FiX } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useGetThreadsQuery, useGetThreadMessagesQuery, useSendMessageMutation } from '../../__data__/api/messagesApi'
import { useAuth } from '../../hooks/useAuth'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'

const MessagesPage = () => {
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const myCompanyId = company?.id
  
  const { data: threads = [] } = useGetThreadsQuery()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const { data: messages = [] } = useGetThreadMessagesQuery(activeThreadId || '', { skip: !activeThreadId })
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [messageText, setMessageText] = useState('')
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 100 })
  const [searchQuery, setSearchQuery] = useState('')

  // Группируем диалоги по компаниям
  const groupedThreads = useMemo(() => {
    const grouped: Record<string, any> = {}
    
    threads.forEach((thread: any) => {
      const threadId = thread.id || thread._id
      const otherCompanyId = thread.participantId || 
        (threadId.includes('thread-') ? 
          threadId.split('-').slice(1).join('-') 
          : 'Unknown')
      
      if (!grouped[otherCompanyId]) {
        grouped[otherCompanyId] = { ...thread, threadId }
      }
    })
    
    return grouped
  }, [threads])

  // Фильтруем компании по поиску
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return []
    
    return (companyOptions?.companies || [])
      .filter((c: any) => {
        const name = (c.shortName || c.fullName || '').toLowerCase()
        return name.includes(searchQuery.toLowerCase())
      })
      .filter((c: any) => c.id !== myCompanyId)
  }, [searchQuery, companyOptions, myCompanyId])

  // История компаний с которыми переписывались
  const conversationHistory = useMemo(() => {
    return Object.entries(groupedThreads).map(([companyId, thread]: any) => {
      const company = companyOptions?.companies?.find((c: any) => c.id === companyId)
      return {
        companyId,
        company: company || { id: companyId, shortName: companyId },
        thread,
        hasUnread: false  // Можно добавить логику для отслеживания непрочитанных
      }
    }).sort((a, b) => {
      const dateA = new Date(a.thread.lastMessageAt || 0).getTime()
      const dateB = new Date(b.thread.lastMessageAt || 0).getTime()
      return dateB - dateA
    })
  }, [groupedThreads, companyOptions])

  const activeCompanyId = activeThreadId 
    ? activeThreadId.split('-').slice(1).join('-')
    : null

  const handleSelectCompany = (companyId: string) => {
    const threadId = `thread-${[myCompanyId, companyId].sort().join('-')}`
    setActiveThreadId(threadId)
    setSearchQuery('')
  }

  const handleSend = async () => {
    if (!activeThreadId || !messageText.trim()) return
    
    try {
      await sendMessage({ 
        threadId: activeThreadId, 
        senderCompanyId: myCompanyId, 
        text: messageText 
      }).unwrap()
      setMessageText('')
    } catch (e) {
      console.error('Error sending message', e)
    }
  }

  return (
    <MainLayout>
      <Container maxW="container.xl">
        <VStack gap={6} align="stretch">
          <Heading size="lg">{t('nav.messages')}</Heading>

          <VStack gap={4} align="stretch" minH="600px">
            {/* Search companies section */}
            <Box borderWidth="1px" borderRadius="lg" p={4} bg="gray.50">
              <VStack gap={3} align="stretch">
                <Text fontSize="sm" fontWeight="semibold" color="gray.600">
                  {t('messages.find_company') || 'Найти компанию'}
                </Text>
                <HStack gap={2} bg="white" p={2} borderRadius="md" borderWidth="1px">
                  <Box as={FiSearch} color="gray.400" />
                  <Input 
                    placeholder={t('common:buttons.search') || 'Поиск'}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    border="none"
                    _focus={{ boxShadow: 'none' }}
                    size="sm"
                  />
                </HStack>

                {/* Search results */}
                {searchQuery && filteredCompanies.length > 0 && (
                  <VStack gap={2} align="stretch" maxH="200px" overflowY="auto">
                    {filteredCompanies.map((c: any) => (
                      <Button
                        key={c.id}
                        variant="ghost"
                        justifyContent="flex-start"
                        onClick={() => handleSelectCompany(c.id)}
                        size="sm"
                      >
                        {c.shortName || c.fullName}
                      </Button>
                    ))}
                  </VStack>
                )}
              </VStack>
            </Box>

            {/* Main chat or empty state */}
            {activeThreadId ? (
              <VStack gap={4} align="stretch" flex={1}>
                {/* Header */}
                <HStack justify="space-between" borderBottomWidth="1px" pb={3}>
                  <Text fontWeight="bold" fontSize="md">
                    {companyOptions?.companies?.find((c: any) => c.id === activeCompanyId)?.shortName || activeCompanyId}
                  </Text>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => setActiveThreadId(null)}
                  >
                    <FiX />
                  </Button>
                </HStack>

                {/* Messages */}
                <Box
                  overflowY="auto"
                  flex={1}
                  w="100%"
                  css={{
                    '&::-webkit-scrollbar': { width: '6px' },
                    '&::-webkit-scrollbar-track': { bg: 'transparent' },
                    '&::-webkit-scrollbar-thumb': { bg: '#cbd5e0', borderRadius: '3px' },
                  }}
                >
                  <VStack gap={3} align="stretch" p={4}>
                    {messages.length > 0 ? (
                      messages.map((m: any) => (
                        <Box
                          key={m.id || m._id}
                          alignSelf={m.senderCompanyId === myCompanyId ? 'flex-end' : 'flex-start'}
                          maxW="85%"
                        >
                          <Box
                            bg={m.senderCompanyId === myCompanyId ? 'brand.500' : 'gray.100'}
                            color={m.senderCompanyId === myCompanyId ? 'white' : 'gray.900'}
                            p={3}
                            borderRadius="md"
                            shadow="sm"
                          >
                            <Text fontSize="sm">{m.text}</Text>
                            <Text fontSize="xs" opacity={0.7} mt={1}>
                              {new Date(m.timestamp).toLocaleTimeString('ru-RU')}
                            </Text>
                          </Box>
                        </Box>
                      ))
                    ) : (
                      <Box textAlign="center" py={8} color="gray.400">
                        <Text fontSize="sm">{t('messages.no_messages')}</Text>
                      </Box>
                    )}
                  </VStack>
                </Box>

                {/* Input */}
                <HStack gap={2}>
                  <Textarea
                    placeholder={t('messages.placeholder') || 'Введите сообщение...'}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend()
                      }
                    }}
                    minH="80px"
                    maxH="120px"
                    resize="none"
                  />
                  <Button
                    colorPalette="brand"
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    loading={isSending}
                    alignSelf="flex-end"
                    minH="80px"
                  >
                    {t('messages.send') || 'Отправить'}
                  </Button>
                </HStack>
              </VStack>
            ) : (
              <Flex
                flex={1}
                justify="center"
                align="center"
                color="gray.400"
                borderWidth="1px"
                borderRadius="lg"
                direction="column"
                gap={3}
              >
                <Text fontSize="lg">{t('messages.select_company') || 'Выберите компанию для начала диалога'}</Text>
              </Flex>
            )}

            {/* Conversation history */}
            <Box borderTopWidth="1px" pt={4}>
              <Text fontSize="sm" fontWeight="semibold" color="gray.600" mb={3}>
                {t('messages.history') || 'История переписок'}
              </Text>
              <VStack gap={2} align="stretch" maxH="200px" overflowY="auto">
                {conversationHistory.length > 0 ? (
                  conversationHistory.map(({ companyId, company, thread, hasUnread }) => (
                    <Box
                      key={companyId}
                      onClick={() => handleSelectCompany(companyId)}
                      cursor="pointer"
                      p={2}
                      borderRadius="md"
                      bg={activeCompanyId === companyId ? 'brand.50' : 'white'}
                      borderWidth="1px"
                      borderColor={activeCompanyId === companyId ? 'brand.200' : 'gray.200'}
                      transition="all 0.2s"
                      _hover={{ shadow: 'md', borderColor: 'brand.200' }}
                    >
                      <HStack justify="space-between" gap={2}>
                        <VStack align="start" gap={0} flex={1} minW={0}>
                          <HStack gap={2}>
                            <Text fontWeight="medium" fontSize="sm" noOfLines={1}>
                              {company?.shortName || companyId}
                            </Text>
                            {hasUnread && (
                              <Badge colorPalette="red" variant="solid" fontSize="xs">
                                •
                              </Badge>
                            )}
                          </HStack>
                          <Text fontSize="xs" color="gray.500" noOfLines={1}>
                            {thread.lastMessage || 'Нет сообщений'}
                          </Text>
                        </VStack>
                        <Text fontSize="xs" color="gray.400" whiteSpace="nowrap">
                          {thread.lastMessageAt 
                            ? new Date(thread.lastMessageAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                            : ''}
                        </Text>
                      </HStack>
                    </Box>
                  ))
                ) : (
                  <Box p={3} textAlign="center" color="gray.400">
                    <Text fontSize="sm">{t('messages.no_threads')}</Text>
                  </Box>
                )}
              </VStack>
            </Box>
          </VStack>
        </VStack>
      </Container>
    </MainLayout>
  )
}

export { MessagesPage }
