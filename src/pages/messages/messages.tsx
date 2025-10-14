import React from 'react'
import { Box, Text, VStack, HStack, Avatar, Card, Button } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiMail, FiSend, FiClock } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'

const MessagesPage = () => {
  const { t } = useTranslation('common')

  const mockMessages = [
    {
      id: 1,
      sender: 'ООО "ТехноПартнер"',
      avatar: 'TP',
      lastMessage: 'Добрый день! Интересует ваше предложение по поставке оборудования',
      time: '10:30',
      unread: true
    },
    {
      id: 2,
      sender: 'ИП Иванов А.А.',
      avatar: 'ИА',
      lastMessage: 'Спасибо за быстрый ответ. Отправляю коммерческое предложение',
      time: '09:15',
      unread: false
    },
    {
      id: 3,
      sender: 'ЗАО "ПромСнаб"',
      avatar: 'ПС',
      lastMessage: 'Когда можем встретиться для обсуждения деталей?',
      time: 'Вчера',
      unread: true
    }
  ]

  return (
    <MainLayout>
      <Box>
        <HStack mb={6} justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.messages')}
          </Text>
          <Button colorPalette="blue" size="sm">
            <FiSend />
            <Text ml={2}>Новое сообщение</Text>
          </Button>
        </HStack>

        <VStack gap={4} align="stretch">
          {mockMessages.map((message) => (
            <Box
              key={message.id}
              cursor="pointer"
              transition="all 0.2s"
              _hover={{ shadow: 'md' }}
              bg={message.unread ? 'blue.50' : 'white'}
              borderLeft={message.unread ? '4px solid' : 'none'}
              borderLeftColor="blue.500"
              p={4}
              borderRadius="lg"
              borderWidth="1px"
              borderColor="gray.200"
            >
              <HStack gap={4}>
                  <Avatar.Root size="md" name={message.sender}>
                    <Avatar.Fallback>{message.avatar}</Avatar.Fallback>
                  </Avatar.Root>
                  
                  <VStack align="start" flex={1} gap={1}>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="semibold" fontSize="md">
                        {message.sender}
                      </Text>
                      <HStack gap={2}>
                        <Text fontSize="sm" color="gray.500">
                          <FiClock style={{ display: 'inline', marginRight: '4px' }} />
                          {message.time}
                        </Text>
                        {message.unread && (
                          <Box w={2} h={2} bg="blue.500" borderRadius="full" />
                        )}
                      </HStack>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600" noOfLines={2}>
                      {message.lastMessage}
                    </Text>
                  </VStack>
                </HStack>
            </Box>
          ))}
        </VStack>

        {mockMessages.length === 0 && (
          <VStack gap={4} py={12}>
            <Box as={FiMail} w={16} h={16} color="gray.400" />
            <Text fontSize="lg" color="gray.500">
              Нет сообщений
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Здесь будут отображаться ваши сообщения с партнерами
            </Text>
          </VStack>
        )}
      </Box>
    </MainLayout>
  )
}

export { MessagesPage }
