import React from 'react'
import { Box, Text, VStack, HStack, Card, Button, Badge } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiFileText, FiPlus, FiClock, FiCheck, FiX } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'

const RequestsPage = () => {
  const { t } = useTranslation('common')

  const mockRequests = [
    {
      id: 1,
      title: 'Запрос на поставку металлопроката',
      company: 'ООО "СтройМатериалы"',
      status: 'pending',
      date: '15.12.2024',
      description: 'Требуется металлопрокат для строительства объекта'
    },
    {
      id: 2,
      title: 'Предложение по IT-услугам',
      company: 'ИП Петров В.В.',
      status: 'approved',
      date: '14.12.2024',
      description: 'Разработка веб-приложения для управления складом'
    },
    {
      id: 3,
      title: 'Запрос на консультацию',
      company: 'ЗАО "КонсалтингПро"',
      status: 'rejected',
      date: '13.12.2024',
      description: 'Консультация по вопросам налогообложения'
    }
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'yellow'
      case 'approved': return 'green'
      case 'rejected': return 'red'
      default: return 'gray'
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'На рассмотрении'
      case 'approved': return 'Одобрено'
      case 'rejected': return 'Отклонено'
      default: return 'Неизвестно'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return FiClock
      case 'approved': return FiCheck
      case 'rejected': return FiX
      default: return FiFileText
    }
  }

  return (
    <MainLayout>
      <Box>
        <HStack mb={6} justify="space-between">
          <Text fontSize="2xl" fontWeight="bold">
            {t('nav.requests')}
          </Text>
          <Button colorPalette="blue" size="sm">
            <FiPlus />
            <Text ml={2}>Новый запрос</Text>
          </Button>
        </HStack>

        <VStack gap={4} align="stretch">
          {mockRequests.map((request) => {
            const StatusIcon = getStatusIcon(request.status)
            return (
              <Box 
                key={request.id} 
                cursor="pointer" 
                transition="all 0.2s" 
                _hover={{ shadow: 'md' }}
                p={4}
                borderRadius="lg"
                borderWidth="1px"
                borderColor="gray.200"
                bg="white"
              >
                  <VStack align="start" gap={3}>
                    <HStack justify="space-between" w="full">
                      <Text fontWeight="semibold" fontSize="lg">
                        {request.title}
                      </Text>
                      <Badge colorPalette={getStatusColor(request.status)}>
                        <StatusIcon style={{ marginRight: '4px' }} />
                        {getStatusText(request.status)}
                      </Badge>
                    </HStack>
                    
                    <Text fontSize="sm" color="gray.600">
                      <Text as="span" fontWeight="medium">Компания:</Text> {request.company}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      {request.description}
                    </Text>
                    
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="gray.500">
                        Дата: {request.date}
                      </Text>
                      <HStack gap={2}>
                        <Button size="xs" variant="outline" colorPalette="green">
                          <FiCheck />
                        </Button>
                        <Button size="xs" variant="outline" colorPalette="red">
                          <FiX />
                        </Button>
                      </HStack>
                    </HStack>
                  </VStack>
              </Box>
            )
          })}
        </VStack>

        {mockRequests.length === 0 && (
          <VStack gap={4} py={12}>
            <Box as={FiFileText} w={16} h={16} color="gray.400" />
            <Text fontSize="lg" color="gray.500">
              Нет запросов
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              Здесь будут отображаться ваши запросы и предложения
            </Text>
          </VStack>
        )}
      </Box>
    </MainLayout>
  )
}

export { RequestsPage }
