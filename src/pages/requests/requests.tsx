import React, { useState } from 'react'
import { Box, Text, VStack, HStack, Button, Badge, Field, Input, NativeSelect, Table, Container, Tabs, Heading, Textarea, Dialog, Flex } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiFileText, FiSend, FiDownload, FiTrash2, FiCheck, FiX, FiUpload, FiEye } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useSendBulkRequestMutation, useGetSentRequestsQuery, useGetReceivedRequestsQuery, useRespondToRequestMutation, useDeleteRequestMutation, useGetLastReportQuery } from '../../__data__/api/requestsApi'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'
import { useToast } from '../../hooks/useToast'
import * as XLSX from 'xlsx'

const RequestsPage = () => {
  const showToast = useToast()
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const companyId = company?.id
  const [activeTab, setActiveTab] = useState('sent')

  // Queries and Mutations
  const { data: sentRequests = [] } = useGetSentRequestsQuery()
  const { data: receivedRequests = [] } = useGetReceivedRequestsQuery()
  const [sendRequest, { isLoading: isSending }] = useSendBulkRequestMutation()
  const [respondRequest] = useRespondToRequestMutation()
  const [deleteRequest] = useDeleteRequestMutation()
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 100 })
  const { data: lastReport } = useGetLastReportQuery()

  // Form states for sending request
  const [requestText, setRequestText] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Form state for responding
  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseStatus, setResponseStatus] = useState<'accepted' | 'rejected'>('accepted')

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setSelectedFiles(Array.from(e.target.files))
    }
  }

  const handleSendRequest = async () => {
    if (!requestText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20) {
      showToast.warning('Проверьте текст запроса и выбранных получателей (макс 20)')
      return
    }

    try {
      await sendRequest({
        text: requestText.trim(),
        recipientCompanyIds: selectedRecipients,
        files: selectedFiles.map(f => ({
          name: f.name,
          type: f.type,
          size: f.size
        }))
      }).unwrap()

      showToast.success('Запрос отправлен успешно')
      setRequestText('')
      setSelectedRecipients([])
      setSelectedFiles([])
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    } catch (error) {
      showToast.error('Ошибка при отправке запроса')
    }
  }

  const handleRespondToRequest = async (requestId: string) => {
    if (!responseText.trim()) {
      showToast.warning('Введите текст ответа')
      return
    }

    try {
      await respondRequest({
        id: requestId,
        response: responseText.trim(),
        status: responseStatus
      }).unwrap()

      showToast.success('Ответ отправлен')
      setRespondingTo(null)
      setResponseText('')
      setResponseStatus('accepted')
    } catch (error) {
      showToast.error('Ошибка при отправке ответа')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequest(requestId).unwrap()
      showToast.success('Запрос удален')
    } catch (error) {
      showToast.error('Ошибка при удалении')
    }
  }

  const getCompanyName = (companyId: string) => {
    return companyOptions?.companies?.find(c => c.id === companyId)?.shortName || companyId
  }

  return (
    <MainLayout>
      <Container maxW="container.xl">
        <VStack gap={6} align="stretch">
          <Heading size="xl">{t('requests.title') || 'Запросы'}</Heading>

          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
            colorPalette="brand"
            variant="enclosed"
          >
            <Tabs.List>
              <Tabs.Trigger value="sent" whiteSpace="nowrap">
                {t('requests.sentTab') || 'Запросы направленные'}
              </Tabs.Trigger>
              <Tabs.Trigger value="received" whiteSpace="nowrap">
                {t('requests.receivedTab') || 'Запросы полученные'}
              </Tabs.Trigger>
              <Tabs.Trigger value="responses" whiteSpace="nowrap">
                Ответы на запросы
              </Tabs.Trigger>
            </Tabs.List>

            {/* Sent Requests Tab */}
            <Box flex="1" p={6}>
              <Tabs.Content value="sent">
                <VStack gap={6} align="stretch">
                  {/* Send Request Form */}
                  <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text fontWeight="semibold">Отправить новый запрос</Text>

                    <Field.Root required>
                      <Field.Label>Текст запроса</Field.Label>
                      <Textarea
                        value={requestText}
                        onChange={(e) => setRequestText(e.target.value)}
                        placeholder="Введите текст запроса"
                        minH="100px"
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>Добавить файлы</Field.Label>
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        multiple
                        style={{ display: 'block' }}
                      />
                      {selectedFiles.length > 0 && (
                        <VStack gap={2} mt={2} align="start">
                          {selectedFiles.map((f, idx) => (
                            <Text key={idx} fontSize="sm" color="gray.600">
                              📎 {f.name} ({(f.size / 1024).toFixed(1)} KB)
                            </Text>
                          ))}
                        </VStack>
                      )}
                    </Field.Root>

                    <Field.Root required>
                      <Field.Label>Отправить к компаниям</Field.Label>
                      <NativeSelect.Root size="md">
                        <NativeSelect.Field
                          multiple
                          value={selectedRecipients}
                          onChange={(e) => setSelectedRecipients(Array.from((e.target as HTMLSelectElement).selectedOptions).map(o => o.value))}
                        >
                          {(companyOptions?.companies || []).map((c) => (
                            <option key={c.id} value={c.id}>{c.shortName || c.fullName}</option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      <Text fontSize="xs" color="gray.500">
                        Выбрано: {selectedRecipients.length} / 20
                      </Text>
                    </Field.Root>

                    <HStack>
                      <Button
                        colorPalette="green"
                        onClick={handleSendRequest}
                        disabled={!requestText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20}
                        loading={isSending}
                      >
                        <FiSend />
                        <Text ml={2}>Отправить запрос</Text>
                      </Button>
                    </HStack>
                  </VStack>

                  {/* Sent Requests List */}
                  <VStack gap={4} align="stretch">
                    <Text fontWeight="semibold">История отправленных запросов</Text>
                    {sentRequests.length > 0 ? (
                      <Box overflowX="auto">
                        <Table.Root variant="line">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>К компания</Table.ColumnHeader>
                              <Table.ColumnHeader>Текст</Table.ColumnHeader>
                              <Table.ColumnHeader>Статус</Table.ColumnHeader>
                              <Table.ColumnHeader>Ответ</Table.ColumnHeader>
                              <Table.ColumnHeader>Дата</Table.ColumnHeader>
                              <Table.ColumnHeader>Действия</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {sentRequests.map((req: any) => (
                              <Table.Row key={req._id}>
                                <Table.Cell fontWeight="medium">{getCompanyName(req.recipientCompanyId)}</Table.Cell>
                                <Table.Cell fontSize="sm" color="gray.600">
                                  {req.text.substring(0, 40)}...
                                </Table.Cell>
                                <Table.Cell>
                                  <Badge colorPalette={req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'}>
                                    {req.status === 'pending' ? 'Ожидание' : req.status === 'accepted' ? 'Принято' : 'Отклонено'}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell fontSize="sm" color="gray.600">
                                  {req.response?.substring(0, 30) || '-'}
                                </Table.Cell>
                                <Table.Cell fontSize="xs" color="gray.400">
                                  {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                                </Table.Cell>
                                <Table.Cell>
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    colorPalette="red"
                                    onClick={() => handleDeleteRequest(req._id)}
                                  >
                                    <FiTrash2 />
                                  </Button>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>
                    ) : (
                      <Box p={8} textAlign="center" color="gray.500">
                        <Text>Нет отправленных запросов</Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>
              </Tabs.Content>

              {/* Received Requests Tab */}
              <Tabs.Content value="received">
                <VStack gap={6} align="stretch">
                  <Text fontWeight="semibold">Полученные запросы</Text>

                  {receivedRequests.length > 0 ? (
                    <Box overflowX="auto">
                      <Table.Root variant="line">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>От компании</Table.ColumnHeader>
                            <Table.ColumnHeader>Текст</Table.ColumnHeader>
                            <Table.ColumnHeader>Статус</Table.ColumnHeader>
                            <Table.ColumnHeader>Файлы</Table.ColumnHeader>
                            <Table.ColumnHeader>Дата</Table.ColumnHeader>
                            <Table.ColumnHeader>Действия</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {receivedRequests.map((req: any) => (
                            <Table.Row key={req._id}>
                              <Table.Cell fontWeight="medium">{getCompanyName(req.senderCompanyId)}</Table.Cell>
                              <Table.Cell fontSize="sm" color="gray.600">
                                {req.text.substring(0, 40)}...
                              </Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette={req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'}>
                                  {req.status === 'pending' ? 'Ожидание' : req.status === 'accepted' ? 'Принято' : 'Отклонено'}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette="blue">
                                  {req.files?.length || 0}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell fontSize="xs" color="gray.400">
                                {new Date(req.createdAt).toLocaleDateString('ru-RU')}
                              </Table.Cell>
                              <Table.Cell>
                                {req.status === 'pending' ? (
                                  <Button
                                    size="xs"
                                    colorPalette="brand"
                                    onClick={() => setRespondingTo(req._id)}
                                  >
                                    Ответить
                                  </Button>
                                ) : (
                                  <Button
                                    size="xs"
                                    variant="outline"
                                    onClick={() => setRespondingTo(req._id)}
                                  >
                                    <FiEye />
                                  </Button>
                                )}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  ) : (
                    <Box p={8} textAlign="center" color="gray.500">
                      <Text>Нет полученных запросов</Text>
                    </Box>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Responses Tab */}
              <Tabs.Content value="responses">
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between">
                    <Text fontWeight="semibold">Ответы на отправленные запросы</Text>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const responses = sentRequests.filter(r => r.response)
                        const data = responses.map(r => ({
                          'Компания': getCompanyName(r.recipientCompanyId),
                          'Статус': r.status === 'pending' ? 'Ожидание' : r.status === 'accepted' ? 'Принято' : 'Отклонено',
                          'Ответ': r.response || '-',
                          'Дата ответа': r.respondedAt ? new Date(r.respondedAt).toLocaleDateString('ru-RU') : '-'
                        }))
                        const ws = XLSX.utils.json_to_sheet(data)
                        const wb = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(wb, ws, 'Ответы')
                        XLSX.writeFile(wb, 'responses.xlsx')
                      }}
                    >
                      <FiDownload />
                      Экспортировать в XLSX
                    </Button>
                  </HStack>

                  {sentRequests.filter(r => r.response).length > 0 ? (
                    <Box overflowX="auto">
                      <Table.Root variant="line">
                        <Table.Header>
                          <Table.Row>
                            <Table.ColumnHeader>От компании</Table.ColumnHeader>
                            <Table.ColumnHeader>Статус</Table.ColumnHeader>
                            <Table.ColumnHeader>Ответ</Table.ColumnHeader>
                            <Table.ColumnHeader>Дата ответа</Table.ColumnHeader>
                          </Table.Row>
                        </Table.Header>
                        <Table.Body>
                          {sentRequests.filter(r => r.response).map((req: any) => (
                            <Table.Row key={req._id}>
                              <Table.Cell fontWeight="medium">{getCompanyName(req.recipientCompanyId)}</Table.Cell>
                              <Table.Cell>
                                <Badge colorPalette={req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'}>
                                  {req.status === 'pending' ? 'Ожидание' : req.status === 'accepted' ? 'Принято' : 'Отклонено'}
                                </Badge>
                              </Table.Cell>
                              <Table.Cell fontSize="sm" color="gray.600">
                                {req.response?.substring(0, 80)}...
                              </Table.Cell>
                              <Table.Cell fontSize="xs" color="gray.400">
                                {req.respondedAt ? new Date(req.respondedAt).toLocaleDateString('ru-RU') : '-'}
                              </Table.Cell>
                            </Table.Row>
                          ))}
                        </Table.Body>
                      </Table.Root>
                    </Box>
                  ) : (
                    <Box p={8} textAlign="center" color="gray.500">
                      <Text>Нет ответов на запросы</Text>
                    </Box>
                  )}
                </VStack>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </VStack>
      </Container>

      {/* Response Dialog */}
      <Dialog.Root
        open={!!respondingTo}
        onOpenChange={(details) => {
          if (!details.open) {
            setRespondingTo(null)
            setResponseText('')
            setResponseStatus('accepted')
          }
        }}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>Ответить на запрос</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <Field.Root>
                  <Field.Label>Статус</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={responseStatus}
                      onChange={(e) => setResponseStatus(e.target.value as 'accepted' | 'rejected')}
                    >
                      <option value="accepted">Принять</option>
                      <option value="rejected">Отклонить</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>Текст ответа</Field.Label>
                  <Textarea
                    value={responseText}
                    onChange={(e) => setResponseText(e.target.value)}
                    placeholder="Введите ответ на запрос"
                    minH="100px"
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={() => {
                  setRespondingTo(null)
                  setResponseText('')
                  setResponseStatus('accepted')
                }}
              >
                Отмена
              </Button>
              <Button
                colorPalette="brand"
                onClick={() => respondingTo && handleRespondToRequest(respondingTo)}
              >
                Отправить ответ
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </MainLayout>
  )
}

export { RequestsPage }
