import React, { useMemo, useState } from 'react'
import { Box, Text, VStack, HStack, Avatar, Button, Input, Field, Separator } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiMail, FiSend, FiClock } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useGetThreadsQuery, useGetThreadMessagesQuery, useSendMessageMutation } from '../../__data__/api/messagesApi'
import { useAuth } from '../../hooks/useAuth'

const MessagesPage = () => {
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const myCompanyId = company?.id || 'company-123'
  const { data: threads = [] } = useGetThreadsQuery()
  const [activeThreadId, setActiveThreadId] = useState<string | null>(threads[0]?.id || null)
  const { data: messages = [] } = useGetThreadMessagesQuery(activeThreadId || '', { skip: !activeThreadId })
  const [sendMessage, { isLoading }] = useSendMessageMutation()
  const [text, setText] = useState('')

  const activeThread = useMemo(() => threads.find(t => t.id === activeThreadId) || null, [threads, activeThreadId])

  const handleSend = async () => {
    if (!activeThreadId || text.trim() === '') return
    await sendMessage({ threadId: activeThreadId, senderCompanyId: myCompanyId, text }).unwrap()
    setText('')
  }

  return (
    <MainLayout>
      <Box>
        <HStack mb={6} justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.messages')}
          </Text>
          <Button colorPalette="blue" size="sm">
            <FiSend />
            <Text ml={2}>{t('messages.newMessageButton')}</Text>
          </Button>
        </HStack>

        <HStack align="start" gap={4}>
          {/* Threads list */}
          <VStack gap={2} align="stretch" w={{ base: '40%', md: '30%' }}>
            {threads.map((thread) => (
              <Box
                key={thread.id}
                onClick={() => setActiveThreadId(thread.id)}
                cursor="pointer"
                transition="all 0.2s"
                _hover={{ shadow: 'md' }}
                bg={activeThreadId === thread.id ? 'blue.50' : 'white'}
                borderLeft={activeThreadId === thread.id ? '4px solid' : 'none'}
                borderLeftColor="blue.500"
                p={3}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
              >
                <HStack justify="space-between">
                  <Text fontWeight="semibold">{thread.id}</Text>
                  <Text fontSize="xs" color="gray.500">{new Date(thread.lastMessageAt).toLocaleString('ru-RU')}</Text>
                </HStack>
                <Text fontSize="sm" color="gray.600" lineClamp={2}>{thread.lastMessage}</Text>
              </Box>
            ))}
          </VStack>

          {/* Conversation */}
          <VStack gap={3} align="stretch" flex={1}>
            <HStack justify="space-between">
              <Text fontWeight="bold">{activeThread ? activeThread.id : t('labels.no_data')}</Text>
            </HStack>
            <Separator />
            <Box overflowY="auto" maxH="420px" w="100%">
              <VStack gap={2} align="stretch" p={1}>
                {messages.map((m) => (
                  <Box key={m.id} alignSelf={m.senderCompanyId === myCompanyId ? 'flex-end' : 'flex-start'} maxW="80%">
                    <Box bg={m.senderCompanyId === myCompanyId ? 'blue.100' : 'gray.100'} p={3} borderRadius="md">
                      <Text fontSize="sm">{m.text}</Text>
                      <Text fontSize="xs" color="gray.500" mt={1}>{new Date(m.timestamp).toLocaleTimeString('ru-RU')}</Text>
                    </Box>
                  </Box>
                ))}
              </VStack>
            </Box>

            <HStack>
              <Input placeholder={t('messages.placeholder')} value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }} />
              <Button colorPalette="blue" onClick={handleSend} disabled={!text.trim()} loading={isLoading}>
                <FiSend />
                <Text ml={2}>{t('messages.newMessage')}</Text>
              </Button>
            </HStack>
          </VStack>
        </HStack>

        {messages.length === 0 && (
          <VStack gap={4} py={12}>
            <Box as={FiMail} w={16} h={16} color="gray.400" />
            <Text fontSize="lg" color="gray.500">
              {t('messages.no_messages')}
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              {t('messages.no_threads')}
            </Text>
          </VStack>
        )}
      </Box>
    </MainLayout>
  )
}

export { MessagesPage }
