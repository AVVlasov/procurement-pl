import React, { useState, useMemo } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Input,
  Container,
  Heading,
  Badge,
  Textarea,
  IconButton,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiSend, FiSearch, FiX } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import {
  useGetThreadsQuery,
  useGetThreadMessagesQuery,
  useSendMessageMutation,
} from '../../__data__/api/messagesApi'
import { useAuth } from '../../hooks/useAuth'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'
import { useGetCompanyQuery } from '../../__data__/api/companiesApi'

// Helper для работы с localStorage потоками
const LOCAL_STORAGE_KEY = 'message_threads'

interface LocalThread {
  threadId: string
  companyId: string
  companyName: string
  lastMessage: string
  lastMessageAt: string
}

const saveThreadToLocalStorage = (threadId: string, companyId: string, companyName: string, lastMessage: string) => {
  try {
    const threads = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
    threads[threadId] = {
      threadId,
      companyId,
      companyName,
      lastMessage,
      lastMessageAt: new Date().toISOString(),
    }
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(threads))
  } catch (e) {
    console.error('Error saving thread:', e)
  }
}

const getThreadsFromLocalStorage = (): LocalThread[] => {
  try {
    const threads = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '{}')
    return Object.values(threads) as LocalThread[]
  } catch (e) {
    return []
  }
}

export default function MessagesPage() {
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const myCompanyId = company?.id

  const { data: apiThreads = [], refetch: refetchThreads } = useGetThreadsQuery()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null)
  const { data: messages = [] } = useGetThreadMessagesQuery(activeThreadId || '', { skip: !activeThreadId })
  const [sendMessage, { isLoading: isSending }] = useSendMessageMutation()
  const [messageText, setMessageText] = useState('')
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 100 })
  const [searchQuery, setSearchQuery] = useState('')
  
  // Состояние для localStorage потоков
  const [localThreads, setLocalThreads] = useState<LocalThread[]>(() => getThreadsFromLocalStorage())

  // Загружаем threads при монтировании компонента
  React.useEffect(() => {
    refetchThreads()
    setLocalThreads(getThreadsFromLocalStorage())
  }, [])

  // Объединяем API потоки и localStorage потоки
  const allThreads = useMemo(() => {
    const threadMap = new Map<string, any>()
    
    // Добавляем API потоки
    apiThreads.forEach(thread => {
      threadMap.set(thread.threadId, thread)
    })
    
    // Добавляем localStorage потоки (они приоритетные)
    localThreads.forEach(thread => {
      if (!threadMap.has(thread.threadId)) {
        threadMap.set(thread.threadId, {
          threadId: thread.threadId,
          lastMessage: thread.lastMessage,
          lastMessageAt: thread.lastMessageAt,
          companyName: thread.companyName,
        })
      }
    })
    
    return Array.from(threadMap.values()).sort((a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    )
  }, [apiThreads, localThreads])

  // Определяем activeCompanyId ДО использования в других useMemo
  const activeCompanyId = activeThreadId
    ? activeThreadId.replace('thread-', '').split('-').find((id: string) => id !== myCompanyId)
    : null

  // Получить информацию о компании собеседника
  const { data: activeCompanyInfo } = useGetCompanyQuery(activeCompanyId || '', { skip: !activeCompanyId })

  // Группируем threads по otherCompanyId
  const groupedThreads = useMemo(() => {
    const grouped: Record<string, any> = {}
    allThreads.forEach((thread: any) => {
      const threadId = thread.threadId || thread.id || thread._id
      if (!threadId) return // Skip if no threadId
      
      const ids = threadId.split('-').filter((id: string) => id && id !== 'thread')
      const otherCompanyId = ids.find((id: string) => id !== myCompanyId) || 'Unknown'

      if (!grouped[otherCompanyId]) {
        grouped[otherCompanyId] = thread
      }
    })
    return grouped
  }, [allThreads, myCompanyId])

  // История компаний с которыми переписывались
  const conversationHistory = useMemo(() => {
    // Создаём Map всех потоков (API + localStorage)
    const allThreadsMap = new Map<string, any>()
    
    // Добавляем из API
    apiThreads.forEach((thread: any) => {
      const threadId = thread.threadId
      if (!threadId) return
      const ids = threadId.split('-').filter((id: string) => id && id !== 'thread')
      const otherCompanyId = ids.find((id: string) => id !== myCompanyId)
      if (otherCompanyId) {
        allThreadsMap.set(otherCompanyId, {
          companyId: otherCompanyId,
          thread,
          companyName: thread.companyName || otherCompanyId,
        })
      }
    })
    
    // Добавляем из localStorage (они приоритетные и имеют имя компании)
    localThreads.forEach((localThread: LocalThread) => {
      const otherCompanyId = localThread.companyId
      allThreadsMap.set(otherCompanyId, {
        companyId: otherCompanyId,
        thread: {
          threadId: localThread.threadId,
          lastMessage: localThread.lastMessage,
          lastMessageAt: localThread.lastMessageAt,
        },
        companyName: localThread.companyName,
      })
    })

    // Преобразуем в массив и сортируем по дате
    const history = Array.from(allThreadsMap.values())
      .sort((a, b) => {
        const dateA = new Date(a.thread.lastMessageAt || 0).getTime()
        const dateB = new Date(b.thread.lastMessageAt || 0).getTime()
        return dateB - dateA
      })

    return history
  }, [apiThreads, localThreads, myCompanyId])

  // Фильтруем компании по поиску
  const filteredCompanies = useMemo(() => {
    if (!searchQuery) return []
    return (
      companyOptions?.companies?.filter((c: any) =>
        (c.shortName + c.fullName).toLowerCase().includes(searchQuery.toLowerCase())
      ) || []
    )
  }, [searchQuery, companyOptions])

  const handleSelectCompany = (companyId: string) => {
    if (!myCompanyId) return
    const threadId = `thread-${[myCompanyId, companyId].sort().join('-')}`
    setActiveThreadId(threadId)
    setSearchQuery('')
  }

  const handleSend = async () => {
    if (!messageText.trim() || !activeThreadId) return

    try {
      await sendMessage({
        threadId: activeThreadId,
        text: messageText,
        senderCompanyId: myCompanyId,
      }).unwrap()

      // Сохраняем поток в localStorage
      if (activeCompanyId && activeCompanyInfo) {
        saveThreadToLocalStorage(
          activeThreadId,
          activeCompanyId,
          activeCompanyInfo.shortName || activeCompanyInfo.fullName || activeCompanyId,
          messageText
        )
        // Обновляем локальное состояние потоков
        setLocalThreads(getThreadsFromLocalStorage())
      }

      setMessageText('')
      
      // Явный рефреш threads после отправки сообщения
      setTimeout(() => {
        refetchThreads()
      }, 500)
    } catch (error) {
      console.error('Error sending message:', error)
    }
  }

  return (
    <MainLayout>
      <Container maxW="container.2xl" h="calc(100vh - 100px)">
        <HStack gap={0} align="stretch" h="full">
          {/* LEFT PANEL - Conversation List */}
          <VStack
            w={{ base: '100%', md: '320px' }}
            gap={4}
            p={4}
            borderRightWidth={{ base: 0, md: '1px' }}
            borderColor="gray.200"
            bg="gray.50"
            overflowY="auto"
            display={{ base: activeThreadId ? 'none' : 'flex', md: 'flex' }}
          >
            <HStack justify="space-between" align="center">
              <Heading size="lg">{t('nav.messages') || 'Сообщения'}</Heading>
              <Badge colorPalette="blue" fontSize="sm">
                {conversationHistory.length}
              </Badge>
            </HStack>

            <HStack gap={2} p={2} w="full" bg="white" borderRadius="lg" borderWidth="1px">
              <FiSearch />
              <Input
                placeholder="Поиск"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                border="none"
                focusBorderColor="transparent"
                _focus={{ boxShadow: 'none' }}
              />
            </HStack>

            {/* Search Results */}
            {searchQuery && filteredCompanies.length > 0 && (
              <VStack gap={2} align="stretch" w="full">
                {filteredCompanies.map((c: any) => (
                  <Box
                    key={c.id}
                    p={3}
                    borderRadius="lg"
                    cursor="pointer"
                    bg="white"
                    borderWidth="1px"
                    borderColor="gray.200"
                    onClick={() => handleSelectCompany(c.id)}
                    _hover={{ bg: 'brand.50', borderColor: 'brand.200' }}
                    transition="all 0.2s"
                  >
                    <Text fontSize="sm" fontWeight="medium" color="gray.900">
                      {c.shortName || c.fullName}
                    </Text>
                  </Box>
                ))}
              </VStack>
            )}

            {/* Conversation History */}
            {!searchQuery && (
              <VStack align="stretch" w="full" gap={2} flex={1} overflowY="auto">
                <Text fontSize="xs" fontWeight="bold" color="gray.500" textTransform="uppercase">
                  История переписок
                </Text>
                {conversationHistory.length === 0 ? (
                  <Text fontSize="sm" color="gray.500" py={4} textAlign="center">
                    Нет диалогов
                  </Text>
                ) : (
                  conversationHistory.map(({ companyId, companyName, thread }) => (
                    <Box
                      key={companyId}
                      p={3}
                      borderRadius="lg"
                      cursor="pointer"
                      bg={activeCompanyId === companyId ? '#3182ce' : 'white'}
                      borderWidth="2px"
                      borderColor={activeCompanyId === companyId ? '#2c5aa0' : 'gray.200'}
                      onClick={() => handleSelectCompany(companyId)}
                      _hover={{ bg: activeCompanyId === companyId ? '#3182ce' : 'gray.50' }}
                      transition="all 0.2s"
                      boxShadow={activeCompanyId === companyId ? '0 4px 12px rgba(49, 130, 206, 0.4)' : 'none'}
                    >
                      <HStack justify="space-between" gap={3} align="flex-start">
                        <VStack align="start" gap={1} flex={1} minW={0}>
                          <Text
                            fontWeight="700"
                            fontSize="sm"
                            noOfLines={1}
                            color={activeCompanyId === companyId ? 'white' : 'gray.900'}
                          >
                            {companyName || companyId}
                          </Text>
                          <Text
                            fontSize="xs"
                            noOfLines={2}
                            color={activeCompanyId === companyId ? 'white' : 'gray.700'}
                          >
                            {thread.lastMessage}
                          </Text>
                        </VStack>
                        <Text
                          fontSize="xs"
                          color={activeCompanyId === companyId ? 'white' : 'gray.600'}
                          whiteSpace="nowrap"
                        >
                          {new Date(thread.lastMessageAt).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </Text>
                      </HStack>
                    </Box>
                  ))
                )}
              </VStack>
            )}
          </VStack>

          {/* RIGHT PANEL - Chat */}
          <VStack
            flex={1}
            gap={0}
            align="stretch"
            h="full"
            display={{ base: activeThreadId ? 'flex' : 'none', md: 'flex' }}
          >
            {activeThreadId ? (
              <>
                <HStack justify="space-between" borderBottomWidth="1px" p={4} bg="white">
                  <VStack align="start" gap={1}>
                    <Heading size="md">
                      {activeCompanyInfo?.shortName || activeCompanyInfo?.fullName || activeCompanyId}
                    </Heading>
                  </VStack>
                  <IconButton
                    aria-label="Close"
                    icon={<FiX />}
                    variant="ghost"
                    onClick={() => setActiveThreadId(null)}
                    display={{ base: 'flex', md: 'none' }}
                  />
                </HStack>

                <VStack
                  flex={1}
                  gap={3}
                  p={4}
                  overflowY="auto"
                  align="stretch"
                  bg="gray.50"
                  justifyContent="flex-end"
                >
                  {messages.map((m: any) => (
                    <Box
                      key={m.id || m._id}
                      alignSelf={m.senderCompanyId === myCompanyId ? 'flex-end' : 'flex-start'}
                      maxW="85%"
                    >
                      <Box
                        bg={m.senderCompanyId === myCompanyId ? '#4299e1' : 'gray.100'}
                        color={m.senderCompanyId === myCompanyId ? 'white' : 'gray.900'}
                        p={3}
                        borderRadius="md"
                        shadow="sm"
                      >
                        <Text fontSize="sm">{m.text}</Text>
                        <Text fontSize="xs" opacity={0.7} mt={1}>
                          {new Date(m.timestamp).toLocaleTimeString('ru-RU', {
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit',
                          })}
                        </Text>
                      </Box>
                    </Box>
                  ))}
                </VStack>

                <HStack gap={2} p={4} borderTopWidth="1px" borderColor="gray.200" bg="white">
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
                    size="sm"
                    resize="none"
                    minH="40px"
                    maxH="100px"
                  />
                  <Button
                    colorPalette="brand"
                    onClick={handleSend}
                    disabled={!messageText.trim()}
                    loading={isSending}
                    size="md"
                  >
                    <FiSend />
                  </Button>
                </HStack>
              </>
            ) : (
              <VStack flex={1} justify="center" align="center" gap={4}>
                <Text fontSize="lg" color="gray.500">
                  Выберите компанию для начала диалога
                </Text>
              </VStack>
            )}
          </VStack>
        </HStack>
      </Container>
    </MainLayout>
  )
}
