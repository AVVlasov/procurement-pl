import React, { useEffect, useMemo, useState } from 'react'
import {
  Box,
  Text,
  VStack,
  HStack,
  Button,
  Badge,
  Field,
  Input,
  NativeSelect,
  Table,
  Container,
  Tabs,
  Heading,
  Textarea,
  Dialog,
  Checkbox,
  IconButton,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiFileText, FiSend, FiDownload, FiTrash2, FiEye } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import {
  useSendBulkRequestMutation,
  useGetSentRequestsQuery,
  useGetReceivedRequestsQuery,
  useRespondToRequestMutation,
  useDeleteRequestMutation,
  type Request as RequestModel,
  type RequestFile,
} from '../../__data__/api/requestsApi'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'
import {
  useGetCompanyBuyProductsQuery,
  useGetBuyProductAcceptancesQuery,
} from '../../__data__/api/buyProductsApi'
import { useToast } from '../../hooks/useToast'
import * as XLSX from 'xlsx'

type RecipientOption = {
  id: string
  name: string
  source: 'acceptance' | 'ai' | 'all'
  description?: string
}

const MAX_RECIPIENTS = 20

const RequestsPage = () => {
  const showToast = useToast()
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const companyId = company?.id || ''
  const [activeTab, setActiveTab] = useState('sent')

  const { data: sentRequests = [] } = useGetSentRequestsQuery()
  const { data: receivedRequests = [] } = useGetReceivedRequestsQuery()
  const [sendRequest, { isLoading: isSending }] = useSendBulkRequestMutation()
  const [respondRequest, { isLoading: isSendingResponse }] = useRespondToRequestMutation()
  const [deleteRequest] = useDeleteRequestMutation()
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 200 })
  const { data: products = [] } = useGetCompanyBuyProductsQuery(companyId, { skip: !companyId })

  const [requestText, setRequestText] = useState('')
  const [subject, setSubject] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [selectedProductId, setSelectedProductId] = useState<string>('')
  const requestFileInputRef = React.useRef<HTMLInputElement>(null)
  const [recipientSearch, setRecipientSearch] = useState('')

  const { data: productAcceptances = [], isLoading: isLoadingAcceptances } = useGetBuyProductAcceptancesQuery(
    selectedProductId,
    { skip: !selectedProductId },
  )

  const [respondingTo, setRespondingTo] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [responseStatus, setResponseStatus] = useState<'accepted' | 'rejected'>('accepted')
  const [responseFiles, setResponseFiles] = useState<File[]>([])
  const responseFileInputRef = React.useRef<HTMLInputElement>(null)

  const companyDictionary = useMemo(() => {
    if (!companyOptions?.companies) {
      return new Map<string, { name: string }>()
    }

    return new Map(
      companyOptions.companies.map((company: any) => [
        company.id,
        { name: company.shortName || company.fullName || company.id },
      ]),
    )
  }, [companyOptions])

  useEffect(() => {
    if (!selectedProductId) {
      setSubject('')
      return
    }

    const product = products.find((item: any) => item._id === selectedProductId)
    if (product) {
      setSubject(product.name)
    }
  }, [products, selectedProductId])

  const acceptanceOptions = useMemo<RecipientOption[]>(() => {
    if (!Array.isArray(productAcceptances) || productAcceptances.length === 0) {
      return []
    }

    return productAcceptances
      .map((acceptance: any) => {
        if (!acceptance?.companyId) {
          return null
        }

        if (typeof acceptance.companyId === 'string') {
          const dictionaryItem = companyDictionary.get(acceptance.companyId)
          return {
            id: acceptance.companyId,
            name: dictionaryItem?.name || acceptance.companyId,
            source: 'acceptance' as const,
          }
        }

        const companyObject = acceptance.companyId
        const companyIdValue = companyObject._id?.toString()
        if (!companyIdValue) {
          return null
        }

        return {
          id: companyIdValue,
          name: companyObject.shortName || companyObject.fullName || companyIdValue,
          source: 'acceptance' as const,
        }
      })
      .filter(Boolean) as RecipientOption[]
  }, [productAcceptances, companyDictionary])

  const allCompanyOptions = useMemo<RecipientOption[]>(() => {
    if (!companyOptions?.companies) {
      return []
    }

    return companyOptions.companies.map((company: any) => ({
      id: company.id,
      name: company.shortName || company.fullName || company.id,
      source: 'all' as const,
    }))
  }, [companyOptions])

  const combinedRecipients = useMemo(() => {
    const recipientsMap = new Map<string, RecipientOption>()
    acceptanceOptions.forEach((option) => recipientsMap.set(option.id, option))

    if (recipientSearch.trim().length > 0 || recipientsMap.size === 0) {
      allCompanyOptions.forEach((option) => {
        if (!recipientsMap.has(option.id)) {
          recipientsMap.set(option.id, option)
        }
      })
    }

    const query = recipientSearch.trim().toLowerCase()
    const sortOrder: Record<RecipientOption['source'], number> = {
      acceptance: 0,
      ai: 1,
      all: 2,
    }

    return Array.from(recipientsMap.values())
      .filter((option) => {
        if (!query) {
          return true
        }
        return option.name.toLowerCase().includes(query) || option.id.toLowerCase().includes(query)
      })
      .sort((a, b) => {
        const orderDiff = sortOrder[a.source] - sortOrder[b.source]
        if (orderDiff !== 0) {
          return orderDiff
        }
        return a.name.localeCompare(b.name)
      })
      .slice(0, 120)
  }, [acceptanceOptions, allCompanyOptions, recipientSearch])

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }
    setSelectedFiles(Array.from(files))
  }

  const handleRemoveSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index))
    if (requestFileInputRef.current && selectedFiles.length === 1) {
      requestFileInputRef.current.value = ''
    }
  }

  const toggleRecipient = (companyId: string, checked: boolean) => {
    setSelectedRecipients((prev) => {
      if (!checked) {
        return prev.filter((id) => id !== companyId)
      }

      if (prev.includes(companyId)) {
        return prev
      }

      if (prev.length >= MAX_RECIPIENTS) {
        showToast.warning(t('requests.recipientsLimit') || 'Максимум 20 получателей')
        return prev
      }

      return [...prev, companyId]
    })
  }

  const handleSendRequest = async () => {
    if (!subject.trim()) {
      showToast.warning(t('requests.subjectRequired') || 'Укажите предмет закупки')
      return
    }

    if (!requestText.trim()) {
      showToast.warning(t('requests.textRequired') || 'Введите текст запроса')
      return
    }

    if (selectedRecipients.length === 0) {
      showToast.warning(t('requests.recipientsEmpty') || 'Выберите получателей')
      return
    }

    if (selectedRecipients.length > MAX_RECIPIENTS) {
      showToast.warning(t('requests.recipientsLimit') || 'Максимум 20 получателей')
      return
    }

    try {
      await sendRequest({
        text: requestText.trim(),
        subject: subject.trim(),
        recipientCompanyIds: selectedRecipients,
        productId: selectedProductId || undefined,
        files: selectedFiles,
      }).unwrap()

      showToast.success(t('requests.sentSuccess') || 'Запрос отправлен успешно')
      setRequestText('')
      setSubject('')
      setSelectedRecipients([])
      setSelectedFiles([])
      setSelectedProductId('')
      setRecipientSearch('')
      if (requestFileInputRef.current) {
        requestFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('[RequestsPage] sendRequest error:', error)
      showToast.error(t('requests.sendError') || 'Ошибка при отправке запроса')
    }
  }

  const respondingRequest = useMemo(() => {
    if (!respondingTo) {
      return null
    }
    return receivedRequests.find((item: RequestModel) => item._id === respondingTo || item.id === respondingTo) || null
  }, [receivedRequests, respondingTo])

  useEffect(() => {
    if (!respondingTo) {
      setResponseText('')
      setResponseStatus('accepted')
      setResponseFiles([])
      if (responseFileInputRef.current) {
        responseFileInputRef.current.value = ''
      }
      return
    }

    if (respondingRequest?.response) {
      setResponseText(respondingRequest.response)
      setResponseStatus(respondingRequest.status || 'accepted')
    } else {
      setResponseText('')
      setResponseStatus('accepted')
    }
  }, [respondingRequest, respondingTo])

  const handleResponseFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) {
      return
    }
    setResponseFiles(Array.from(files))
  }

  const handleRemoveResponseFile = (index: number) => {
    setResponseFiles((prev) => prev.filter((_, idx) => idx !== index))
    if (responseFileInputRef.current && responseFiles.length === 1) {
      responseFileInputRef.current.value = ''
    }
  }

  const handleRespondToRequest = async (requestId: string) => {
    if (!responseText.trim()) {
      showToast.warning(t('requests.responseTextRequired') || 'Введите текст ответа')
      return
    }

    try {
      await respondRequest({
        id: requestId,
        response: responseText.trim(),
        status: responseStatus,
        files: responseFiles,
      }).unwrap()

      showToast.success(t('requests.responseSent') || 'Ответ отправлен')
      setRespondingTo(null)
      setResponseText('')
      setResponseStatus('accepted')
      setResponseFiles([])
      if (responseFileInputRef.current) {
        responseFileInputRef.current.value = ''
      }
    } catch (error) {
      console.error('[RequestsPage] respondRequest error:', error)
      showToast.error(t('requests.responseError') || 'Ошибка при отправке ответа')
    }
  }

  const handleDeleteRequest = async (requestId: string) => {
    try {
      await deleteRequest(requestId).unwrap()
      showToast.success(t('requests.deleted') || 'Запрос удалён')
    } catch (error) {
      console.error('[RequestsPage] deleteRequest error:', error)
      showToast.error(t('requests.deleteError') || 'Ошибка при удалении')
    }
  }

  const getCompanyName = (companyId: string) => {
    return companyDictionary.get(companyId)?.name || companyId
  }

  const renderFileList = (files?: RequestFile[]) => {
    if (!files || files.length === 0) {
      return (
        <Text fontSize="xs" color="gray.500">
          {t('requests.noFiles') || 'Файлы не приложены'}
        </Text>
      )
    }

    return (
      <VStack align="start" gap={1} maxW="280px">
        {files.map((file) => (
          <Button
            key={file.id}
            as="a"
            href={file.url}
            target="_blank"
            rel="noopener noreferrer"
            size="sm"
            variant="link"
            colorPalette="brand"
            gap={2}
          >
            <FiDownload />
            <Text>{file.name}</Text>
          </Button>
        ))}
      </VStack>
    )
  }

  const groupedSentRequests = useMemo(() => {
    const groups = new Map<string, RequestModel[]>()
    sentRequests.forEach((request: RequestModel) => {
      const subjectKey = request.subject?.trim() || t('requests.subjectFallback') || 'Без предмета'
      if (!groups.has(subjectKey)) {
        groups.set(subjectKey, [])
      }
      groups.get(subjectKey)?.push(request)
    })

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [sentRequests, t])

  const groupedResponses = useMemo(() => {
    const responses = sentRequests.filter((request: RequestModel) => Boolean(request.response))
    const groups = new Map<string, RequestModel[]>()

    responses.forEach((request) => {
      const subjectKey = request.subject?.trim() || t('requests.subjectFallback') || 'Без предмета'
      if (!groups.has(subjectKey)) {
        groups.set(subjectKey, [])
      }
      groups.get(subjectKey)?.push(request)
    })

    return Array.from(groups.entries()).sort(([a], [b]) => a.localeCompare(b))
  }, [sentRequests, t])

  const formatDate = (value?: string) => {
    if (!value) {
      return '-'
    }
    try {
      return new Date(value).toLocaleDateString('ru-RU')
    } catch (error) {
      return value
    }
  }

  return (
    <MainLayout>
      <Container maxW="container.xl" px={{ base: 3, md: 6 }}>
        <VStack gap={6} align="stretch">
          <Heading size={{ base: 'lg', md: 'xl' }}>{t('requests.title') || 'Запросы'}</Heading>

          <Tabs.Root
            value={activeTab}
            onValueChange={(details) => setActiveTab(details.value)}
            colorPalette="brand"
            variant="enclosed"
          >
            <Tabs.List flexWrap="wrap">
              <Tabs.Trigger value="sent" fontSize={{ base: 'xs', md: 'sm' }} px={{ base: 2, md: 4 }}>
                {t('requests.sentTab') || 'Запросы направленные'}
              </Tabs.Trigger>
              <Tabs.Trigger value="received" fontSize={{ base: 'xs', md: 'sm' }} px={{ base: 2, md: 4 }}>
                {t('requests.receivedTab') || 'Запросы полученные'}
              </Tabs.Trigger>
              <Tabs.Trigger value="responses" fontSize={{ base: 'xs', md: 'sm' }} px={{ base: 2, md: 4 }}>
                {t('requests.responsesTab') || 'Ответы на запросы'}
              </Tabs.Trigger>
            </Tabs.List>

            <Tabs.Content value="sent">
              <Box pt={6}>
                <VStack gap={6} align="stretch">
                  <VStack align="stretch" gap={4} borderWidth="1px" borderRadius="lg" bg="white" p={{ base: 3, md: 4 }}>
                    <Text fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }}>{t('requests.newRequest') || 'Отправить новый запрос'}</Text>

                    <Field.Root required>
                      <Field.Label>{t('requests.product') || 'Выберите товар'}</Field.Label>
                      <NativeSelect.Root size="md">
                        <NativeSelect.Field
                          value={selectedProductId}
                          onChange={(event) => {
                            setSelectedProductId(event.target.value)
                            setSelectedRecipients([])
                          }}
                        >
                          <option value="">{t('requests.productPlaceholder') || 'Выберите товар из списка'}</option>
                          {products.map((product: any) => (
                            <option key={product._id} value={product._id}>
                              {product.name}
                            </option>
                          ))}
                        </NativeSelect.Field>
                        <NativeSelect.Indicator />
                      </NativeSelect.Root>
                      {isLoadingAcceptances && (
                        <HStack gap={2} mt={2} color="gray.500" fontSize="xs">
                          <Spinner size="xs" />
                          <Text>{t('requests.acceptancesLoading') || 'Загружаем акцептовавшие компании...'}</Text>
                        </HStack>
                      )}
                    </Field.Root>

                    <Field.Root required>
                      <Field.Label>{t('requests.subject') || 'Предмет закупки'}</Field.Label>
                      <Input
                        value={subject}
                        onChange={(event) => setSubject(event.target.value)}
                        placeholder={t('requests.subjectPlaceholder') || 'Введите предмет закупки'}
                      />
                    </Field.Root>

                    <Field.Root required>
                      <Field.Label>{t('requests.text') || 'Текст запроса'}</Field.Label>
                      <Textarea
                        value={requestText}
                        onChange={(event) => setRequestText(event.target.value)}
                        placeholder={t('requests.textPlaceholder') || 'Введите текст запроса'}
                        minH="100px"
                      />
                    </Field.Root>

                    <Field.Root>
                      <Field.Label>{t('requests.attachments') || 'Добавить файлы'}</Field.Label>
                      <Input
                        ref={requestFileInputRef}
                        type="file"
                        onChange={handleFileSelect}
                        multiple
                        accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                        display="none"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => requestFileInputRef.current?.click()}
                        gap={2}
                      >
                        <FiFileText />
                        <Text>{t('requests.selectFiles') || 'Выбрать файлы'}</Text>
                      </Button>
                      {selectedFiles.length > 0 && (
                        <VStack gap={2} mt={2} align="start">
                          {selectedFiles.map((file, index) => (
                            <HStack key={`${file.name}-${index}`} gap={2} fontSize="sm" color="gray.600">
                              <FiFileText />
                              <Text>{file.name}</Text>
                              <Text color="gray.400">({(file.size / 1024).toFixed(1)} KB)</Text>
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                aria-label={t('requests.removeFile') || 'Удалить файл'}
                                onClick={() => handleRemoveSelectedFile(index)}
                              >
                                <FiTrash2 />
                              </IconButton>
                            </HStack>
                          ))}
                        </VStack>
                      )}
                    </Field.Root>

                    <VStack align="stretch" gap={3} borderWidth="1px" borderRadius="md" p={3} bg="gray.50">
                      <HStack justify="space-between" align="center">
                        <Text fontWeight="semibold" fontSize="sm">
                          {t('requests.recipients') || 'Получатели'}
                        </Text>
                        <Badge colorPalette="purple" fontSize="xs">
                          {t('requests.recipientsCount', { count: selectedRecipients.length })
                            || `Выбрано: ${selectedRecipients.length}`}
                        </Badge>
                      </HStack>

                      <Input
                        value={recipientSearch}
                        onChange={(event) => setRecipientSearch(event.target.value)}
                        placeholder={t('requests.recipientsSearch') || 'Поиск компаний'}
                        size="sm"
                      />

                      {combinedRecipients.length === 0 ? (
                        <Text fontSize="xs" color="gray.500">
                          {t('requests.noRecipients') || 'Компании не найдены. Попробуйте изменить фильтры или запрос.'}
                        </Text>
                      ) : (
                        <VStack align="stretch" gap={2} maxH="240px" overflowY="auto" pr={1}>
                          {combinedRecipients.map((option) => {
                            const isSelected = selectedRecipients.includes(option.id)
                            const badgeColor = option.source === 'acceptance' ? 'green' : option.source === 'ai' ? 'orange' : 'gray'

                            return (
                              <Box key={option.id} borderWidth="1px" borderRadius="md" p={2} bg={isSelected ? 'blue.50' : 'white'}>
                                <Checkbox.Root
                                  checked={isSelected}
                                  onCheckedChange={(details) => toggleRecipient(option.id, details.checked)}
                                >
                                  <Checkbox.HiddenInput />
                                  <Checkbox.Control />
                                  <HStack justify="space-between" gap={3} flexWrap="wrap">
                                    <Checkbox.Label cursor="pointer" fontWeight="medium">
                                      {option.name}
                                    </Checkbox.Label>
                                    <Badge colorPalette={badgeColor} fontSize="10px">
                                      {option.source === 'acceptance'
                                        ? t('requests.recipientAcceptance') || 'Акцепт'
                                        : option.source === 'ai'
                                          ? t('requests.recipientAi') || 'ИИ'
                                          : t('requests.recipientAll') || 'Каталог'}
                                    </Badge>
                                  </HStack>
                                </Checkbox.Root>
                                {option.description && (
                                  <Text fontSize="xs" color="gray.500" mt={1}>
                                    {option.description}
                                  </Text>
                                )}
                              </Box>
                            )
                          })}
                        </VStack>
                      )}
                    </VStack>

                    <HStack>
                      <Button
                        colorPalette="green"
                        onClick={handleSendRequest}
                        disabled={
                          isSending
                          || !requestText.trim()
                          || !subject.trim()
                          || selectedRecipients.length === 0
                          || selectedRecipients.length > MAX_RECIPIENTS
                        }
                        loading={isSending}
                        gap={2}
                        size={{ base: 'sm', md: 'md' }}
                        w={{ base: 'full', md: 'auto' }}
                      >
                        <FiSend />
                        <Text>{t('requests.sendButton') || 'Отправить запрос'}</Text>
                      </Button>
                    </HStack>
                  </VStack>

                  <VStack gap={4} align="stretch">
                    <Text fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }}>{t('requests.sentHistory') || 'История отправленных запросов'}</Text>
                    {groupedSentRequests.length > 0 ? (
                      <VStack align="stretch" gap={4}>
                        {groupedSentRequests.map(([groupSubject, requests]) => (
                          <Box key={groupSubject} borderWidth="1px" borderRadius="lg" p={{ base: 3, md: 4 }} bg="white" overflow="hidden">
                            <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
                              {groupSubject}
                            </Heading>
                            
                            {/* Desktop: Table */}
                            <Box display={{ base: 'none', lg: 'block' }} overflowX="auto" mx={-4} mb={-4}>
                              <Table.Root variant="line">
                                <Table.Header>
                                  <Table.Row>
                                    <Table.ColumnHeader>{t('requests.tableCompany') || 'Компания'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableText') || 'Текст'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableFiles') || 'Файлы'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableStatus') || 'Статус'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableResponse') || 'Ответ'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableDate') || 'Дата'}</Table.ColumnHeader>
                                    <Table.ColumnHeader>{t('requests.tableActions') || 'Действия'}</Table.ColumnHeader>
                                  </Table.Row>
                                </Table.Header>
                                <Table.Body>
                                  {requests.map((req) => (
                                    <Table.Row key={req._id || req.id}>
                                      <Table.Cell fontWeight="medium">{getCompanyName(req.recipientCompanyId)}</Table.Cell>
                                      <Table.Cell fontSize="sm" color="gray.600">
                                        {req.text}
                                      </Table.Cell>
                                      <Table.Cell>{renderFileList(req.files)}</Table.Cell>
                                      <Table.Cell>
                                        <Badge
                                          colorPalette={
                                            req.status === 'accepted'
                                              ? 'green'
                                              : req.status === 'rejected'
                                                ? 'red'
                                                : 'yellow'
                                          }
                                        >
                                          {req.status === 'pending'
                                            ? t('requests.statusPending') || 'Ожидание'
                                            : req.status === 'accepted'
                                              ? t('requests.statusAccepted') || 'Принято'
                                              : t('requests.statusRejected') || 'Отклонено'}
                                        </Badge>
                                      </Table.Cell>
                                      <Table.Cell fontSize="sm" color="gray.600">
                                        {req.response || '-'}
                                      </Table.Cell>
                                      <Table.Cell fontSize="xs" color="gray.400">
                                        {formatDate(req.createdAt)}
                                      </Table.Cell>
                                      <Table.Cell>
                                        <Button
                                          size="xs"
                                          variant="outline"
                                          colorPalette="red"
                                          onClick={() => handleDeleteRequest(req._id || req.id || '')}
                                          gap={2}
                                        >
                                          <FiTrash2 />
                                          <Text>{t('common:buttons.delete') || 'Удалить'}</Text>
                                        </Button>
                                      </Table.Cell>
                                    </Table.Row>
                                  ))}
                                </Table.Body>
                              </Table.Root>
                            </Box>

                            {/* Mobile: Cards */}
                            <VStack display={{ base: 'flex', lg: 'none' }} gap={3} align="stretch">
                              {requests.map((req) => (
                                <Box
                                  key={req._id || req.id}
                                  p={3}
                                  borderWidth="1px"
                                  borderRadius="md"
                                  bg="gray.50"
                                >
                                  <VStack align="stretch" gap={2}>
                                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                      <Text fontWeight="bold" fontSize="sm">
                                        {getCompanyName(req.recipientCompanyId)}
                                      </Text>
                                      <Badge
                                        colorPalette={
                                          req.status === 'accepted'
                                            ? 'green'
                                            : req.status === 'rejected'
                                              ? 'red'
                                              : 'yellow'
                                        }
                                      >
                                        {req.status === 'pending'
                                          ? t('requests.statusPending') || 'Ожидание'
                                          : req.status === 'accepted'
                                            ? t('requests.statusAccepted') || 'Принято'
                                            : t('requests.statusRejected') || 'Отклонено'}
                                      </Badge>
                                    </HStack>

                                    <Box>
                                      <Text fontSize="xs" color="gray.500" mb={1}>
                                        {t('requests.tableText') || 'Текст'}:
                                      </Text>
                                      <Text fontSize="sm" color="gray.700">
                                        {req.text}
                                      </Text>
                                    </Box>

                                    {req.response && (
                                      <Box>
                                        <Text fontSize="xs" color="gray.500" mb={1}>
                                          {t('requests.tableResponse') || 'Ответ'}:
                                        </Text>
                                        <Text fontSize="sm" color="gray.700">
                                          {req.response}
                                        </Text>
                                      </Box>
                                    )}

                                    {req.files && req.files.length > 0 && (
                                      <Box>
                                        <Text fontSize="xs" color="gray.500" mb={1}>
                                          {t('requests.tableFiles') || 'Файлы'}:
                                        </Text>
                                        {renderFileList(req.files)}
                                      </Box>
                                    )}

                                    <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                      <Text fontSize="xs" color="gray.400">
                                        {formatDate(req.createdAt)}
                                      </Text>
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        colorPalette="red"
                                        onClick={() => handleDeleteRequest(req._id || req.id || '')}
                                        gap={1}
                                      >
                                        <FiTrash2 />
                                        <Text>{t('common:buttons.delete') || 'Удалить'}</Text>
                                      </Button>
                                    </HStack>
                                  </VStack>
                                </Box>
                              ))}
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    ) : (
                      <Box p={8} textAlign="center" color="gray.500">
                        <Text>{t('requests.sentEmpty') || 'Нет отправленных запросов'}</Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="received">
              <Box pt={6}>
                <VStack gap={6} align="stretch">
                  <Text fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }}>{t('requests.receivedTitle') || 'Полученные запросы'}</Text>

                  {receivedRequests.length > 0 ? (
                    <>
                      {/* Desktop: Table */}
                      <Box display={{ base: 'none', lg: 'block' }} overflowX="auto">
                        <Table.Root variant="line">
                          <Table.Header>
                            <Table.Row>
                              <Table.ColumnHeader>{t('requests.tableFromCompany') || 'От компании'}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('requests.tableText') || 'Текст'}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('requests.tableFiles') || 'Файлы'}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('requests.tableStatus') || 'Статус'}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('requests.tableDate') || 'Дата'}</Table.ColumnHeader>
                              <Table.ColumnHeader>{t('requests.tableActions') || 'Действия'}</Table.ColumnHeader>
                            </Table.Row>
                          </Table.Header>
                          <Table.Body>
                            {receivedRequests.map((req: RequestModel) => (
                              <Table.Row key={req._id || req.id}>
                                <Table.Cell fontWeight="medium">{getCompanyName(req.senderCompanyId)}</Table.Cell>
                                <Table.Cell fontSize="sm" color="gray.600">
                                  {req.text}
                                </Table.Cell>
                                <Table.Cell>{renderFileList(req.files)}</Table.Cell>
                                <Table.Cell>
                                  <Badge
                                    colorPalette={
                                      req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'
                                    }
                                  >
                                    {req.status === 'pending'
                                      ? t('requests.statusPending') || 'Ожидание'
                                      : req.status === 'accepted'
                                        ? t('requests.statusAccepted') || 'Принято'
                                        : t('requests.statusRejected') || 'Отклонено'}
                                  </Badge>
                                </Table.Cell>
                                <Table.Cell fontSize="xs" color="gray.400">
                                  {formatDate(req.createdAt)}
                                </Table.Cell>
                                <Table.Cell>
                                  <Button
                                    size="xs"
                                    variant={req.status === 'pending' ? 'solid' : 'outline'}
                                    colorPalette="brand"
                                    onClick={() => setRespondingTo(req._id || req.id || '')}
                                    gap={2}
                                  >
                                    {req.status === 'pending' ? (
                                      <>
                                        <FiSend />
                                        <Text>{t('requests.respond') || 'Ответить'}</Text>
                                      </>
                                    ) : (
                                      <>
                                        <FiEye />
                                        <Text>{t('requests.viewResponse') || 'Посмотреть'}</Text>
                                      </>
                                    )}
                                  </Button>
                                </Table.Cell>
                              </Table.Row>
                            ))}
                          </Table.Body>
                        </Table.Root>
                      </Box>

                      {/* Mobile: Cards */}
                      <VStack display={{ base: 'flex', lg: 'none' }} gap={3} align="stretch">
                        {receivedRequests.map((req: RequestModel) => (
                          <Box
                            key={req._id || req.id}
                            p={3}
                            borderWidth="1px"
                            borderRadius="md"
                            bg="white"
                          >
                            <VStack align="stretch" gap={2}>
                              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                <Text fontWeight="bold" fontSize="sm">
                                  {getCompanyName(req.senderCompanyId)}
                                </Text>
                                <Badge
                                  colorPalette={
                                    req.status === 'accepted' ? 'green' : req.status === 'rejected' ? 'red' : 'yellow'
                                  }
                                >
                                  {req.status === 'pending'
                                    ? t('requests.statusPending') || 'Ожидание'
                                    : req.status === 'accepted'
                                      ? t('requests.statusAccepted') || 'Принято'
                                      : t('requests.statusRejected') || 'Отклонено'}
                                </Badge>
                              </HStack>

                              <Box>
                                <Text fontSize="xs" color="gray.500" mb={1}>
                                  {t('requests.tableText') || 'Текст'}:
                                </Text>
                                <Text fontSize="sm" color="gray.700">
                                  {req.text}
                                </Text>
                              </Box>

                              {req.files && req.files.length > 0 && (
                                <Box>
                                  <Text fontSize="xs" color="gray.500" mb={1}>
                                    {t('requests.tableFiles') || 'Файлы'}:
                                  </Text>
                                  {renderFileList(req.files)}
                                </Box>
                              )}

                              <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                <Text fontSize="xs" color="gray.400">
                                  {formatDate(req.createdAt)}
                                </Text>
                                <Button
                                  size="xs"
                                  variant={req.status === 'pending' ? 'solid' : 'outline'}
                                  colorPalette="brand"
                                  onClick={() => setRespondingTo(req._id || req.id || '')}
                                  gap={1}
                                >
                                  {req.status === 'pending' ? (
                                    <>
                                      <FiSend />
                                      <Text>{t('requests.respond') || 'Ответить'}</Text>
                                    </>
                                  ) : (
                                    <>
                                      <FiEye />
                                      <Text>{t('requests.viewResponse') || 'Посмотреть'}</Text>
                                    </>
                                  )}
                                </Button>
                              </HStack>
                            </VStack>
                          </Box>
                        ))}
                      </VStack>
                    </>
                  ) : (
                    <Box p={8} textAlign="center" color="gray.500">
                      <Text>{t('requests.receivedEmpty') || 'Нет полученных запросов'}</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Tabs.Content>

            <Tabs.Content value="responses">
              <Box pt={6}>
                <VStack gap={6} align="stretch">
                  <HStack justify="space-between" align="center" flexWrap="wrap" gap={3}>
                    <Text fontWeight="semibold" fontSize={{ base: 'md', md: 'lg' }}>{t('requests.responsesTitle') || 'Ответы на отправленные запросы'}</Text>
                    <Button
                      size={{ base: 'xs', md: 'sm' }}
                      variant="outline"
                      onClick={() => {
                        const responses = sentRequests.filter((r: RequestModel) => r.response)
                        const data = responses.map((r) => ({
                          [t('requests.tableCompany') || 'Компания']: getCompanyName(r.recipientCompanyId),
                          [t('requests.tableStatus') || 'Статус']:
                            r.status === 'pending'
                              ? t('requests.statusPending') || 'Ожидание'
                              : r.status === 'accepted'
                                ? t('requests.statusAccepted') || 'Принято'
                                : t('requests.statusRejected') || 'Отклонено',
                          [t('requests.tableResponse') || 'Ответ']: r.response || '-',
                          [t('requests.tableResponseDate') || 'Дата ответа']: r.respondedAt
                            ? formatDate(r.respondedAt)
                            : '-',
                        }))
                        const worksheet = XLSX.utils.json_to_sheet(data)
                        const workbook = XLSX.utils.book_new()
                        XLSX.utils.book_append_sheet(workbook, worksheet, 'Ответы')
                        XLSX.writeFile(workbook, 'responses.xlsx')
                      }}
                      gap={2}
                    >
                      <FiDownload />
                      <Text display={{ base: 'none', md: 'block' }}>{t('requests.exportXlsx') || 'Экспортировать в XLSX'}</Text>
                      <Text display={{ base: 'block', md: 'none' }}>XLSX</Text>
                    </Button>
                  </HStack>

                  {groupedResponses.length > 0 ? (
                    <VStack align="stretch" gap={4}>
                      {groupedResponses.map(([groupSubject, requests]) => (
                        <Box key={groupSubject} borderWidth="1px" borderRadius="lg" p={{ base: 3, md: 4 }} bg="white" overflow="hidden">
                          <Heading size={{ base: 'xs', md: 'sm' }} mb={3}>
                            {groupSubject}
                          </Heading>
                          
                          {/* Desktop: Table */}
                          <Box display={{ base: 'none', lg: 'block' }} overflowX="auto" mx={-4} mb={-4}>
                            <Table.Root variant="line">
                              <Table.Header>
                                <Table.Row>
                                  <Table.ColumnHeader>{t('requests.tableCompany') || 'Компания'}</Table.ColumnHeader>
                                  <Table.ColumnHeader>{t('requests.tableStatus') || 'Статус'}</Table.ColumnHeader>
                                  <Table.ColumnHeader>{t('requests.tableResponse') || 'Ответ'}</Table.ColumnHeader>
                                  <Table.ColumnHeader>{t('requests.tableResponseFiles') || 'Файлы ответа'}</Table.ColumnHeader>
                                  <Table.ColumnHeader>{t('requests.tableResponseDate') || 'Дата ответа'}</Table.ColumnHeader>
                                </Table.Row>
                              </Table.Header>
                              <Table.Body>
                                {requests.map((req) => (
                                  <Table.Row key={req._id || req.id}>
                                    <Table.Cell fontWeight="medium">{getCompanyName(req.recipientCompanyId)}</Table.Cell>
                                    <Table.Cell>
                                      <Badge
                                        colorPalette={
                                          req.status === 'accepted'
                                            ? 'green'
                                            : req.status === 'rejected'
                                              ? 'red'
                                              : 'yellow'
                                        }
                                      >
                                        {req.status === 'pending'
                                          ? t('requests.statusPending') || 'Ожидание'
                                          : req.status === 'accepted'
                                            ? t('requests.statusAccepted') || 'Принято'
                                            : t('requests.statusRejected') || 'Отклонено'}
                                      </Badge>
                                    </Table.Cell>
                                    <Table.Cell fontSize="sm" color="gray.600">
                                      {req.response}
                                    </Table.Cell>
                                    <Table.Cell>{renderFileList(req.responseFiles)}</Table.Cell>
                                    <Table.Cell fontSize="xs" color="gray.400">
                                      {formatDate(req.respondedAt)}
                                    </Table.Cell>
                                  </Table.Row>
                                ))}
                              </Table.Body>
                            </Table.Root>
                          </Box>

                          {/* Mobile: Cards */}
                          <VStack display={{ base: 'flex', lg: 'none' }} gap={3} align="stretch">
                            {requests.map((req) => (
                              <Box
                                key={req._id || req.id}
                                p={3}
                                borderWidth="1px"
                                borderRadius="md"
                                bg="gray.50"
                              >
                                <VStack align="stretch" gap={2}>
                                  <HStack justify="space-between" flexWrap="wrap" gap={2}>
                                    <Text fontWeight="bold" fontSize="sm">
                                      {getCompanyName(req.recipientCompanyId)}
                                    </Text>
                                    <Badge
                                      colorPalette={
                                        req.status === 'accepted'
                                          ? 'green'
                                          : req.status === 'rejected'
                                            ? 'red'
                                            : 'yellow'
                                      }
                                    >
                                      {req.status === 'pending'
                                        ? t('requests.statusPending') || 'Ожидание'
                                        : req.status === 'accepted'
                                          ? t('requests.statusAccepted') || 'Принято'
                                          : t('requests.statusRejected') || 'Отклонено'}
                                    </Badge>
                                  </HStack>

                                  <Box>
                                    <Text fontSize="xs" color="gray.500" mb={1}>
                                      {t('requests.tableResponse') || 'Ответ'}:
                                    </Text>
                                    <Text fontSize="sm" color="gray.700">
                                      {req.response}
                                    </Text>
                                  </Box>

                                  {req.responseFiles && req.responseFiles.length > 0 && (
                                    <Box>
                                      <Text fontSize="xs" color="gray.500" mb={1}>
                                        {t('requests.tableResponseFiles') || 'Файлы ответа'}:
                                      </Text>
                                      {renderFileList(req.responseFiles)}
                                    </Box>
                                  )}

                                  <Text fontSize="xs" color="gray.400">
                                    {formatDate(req.respondedAt)}
                                  </Text>
                                </VStack>
                              </Box>
                            ))}
                          </VStack>
                        </Box>
                      ))}
                    </VStack>
                  ) : (
                    <Box p={8} textAlign="center" color="gray.500">
                      <Text>{t('requests.responsesEmpty') || 'Нет ответов на запросы'}</Text>
                    </Box>
                  )}
                </VStack>
              </Box>
            </Tabs.Content>
          </Tabs.Root>
        </VStack>
      </Container>

      <Dialog.Root
        open={!!respondingTo}
        onOpenChange={(details) => {
          if (!details.open) {
            setRespondingTo(null)
            setResponseText('')
            setResponseStatus('accepted')
            setResponseFiles([])
            if (responseFileInputRef.current) {
              responseFileInputRef.current.value = ''
            }
          }
        }}
        size="lg"
      >
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t('requests.respondDialogTitle') || 'Ответить на запрос'}</Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <Field.Root>
                  <Field.Label>{t('requests.statusLabel') || 'Статус'}</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={responseStatus}
                      onChange={(event) => setResponseStatus(event.target.value as 'accepted' | 'rejected')}
                    >
                      <option value="accepted">{t('requests.statusAccepted') || 'Принять'}</option>
                      <option value="rejected">{t('requests.statusRejected') || 'Отклонить'}</option>
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t('requests.responseText') || 'Текст ответа'}</Field.Label>
                  <Textarea
                    value={responseText}
                    onChange={(event) => setResponseText(event.target.value)}
                    placeholder={t('requests.responsePlaceholder') || 'Введите ответ на запрос'}
                    minH="100px"
                  />
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('requests.responseFiles') || 'Вложения к ответу'}</Field.Label>
                  <Input
                    ref={responseFileInputRef}
                    type="file"
                    onChange={handleResponseFileSelect}
                    multiple
                    accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                    display="none"
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => responseFileInputRef.current?.click()}
                    gap={2}
                  >
                    <FiFileText />
                    <Text>{t('requests.selectFiles') || 'Выбрать файлы'}</Text>
                  </Button>
                  {responseFiles.length > 0 && (
                    <VStack gap={2} mt={2} align="start">
                      {responseFiles.map((file, index) => (
                        <HStack key={`${file.name}-${index}`} gap={2} fontSize="sm" color="gray.600">
                          <FiFileText />
                          <Text>{file.name}</Text>
                          <Text color="gray.400">({(file.size / 1024).toFixed(1)} KB)</Text>
                          <IconButton
                            size="xs"
                            variant="ghost"
                            colorPalette="red"
                            aria-label={t('requests.removeFile') || 'Удалить файл'}
                            onClick={() => handleRemoveResponseFile(index)}
                          >
                            <FiTrash2 />
                          </IconButton>
                        </HStack>
                      ))}
                    </VStack>
                  )}

                  {respondingRequest?.responseFiles?.length ? (
                    <Box mt={3}>
                      <Text fontSize="xs" color="gray.500" mb={1}>
                        {t('requests.responseExistingFiles') || 'Полученные ранее файлы:'}
                      </Text>
                      {renderFileList(respondingRequest.responseFiles)}
                    </Box>
                  ) : null}
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
                  setResponseFiles([])
                  if (responseFileInputRef.current) {
                    responseFileInputRef.current.value = ''
                  }
                }}
              >
                {t('common:buttons.cancel') || 'Отмена'}
              </Button>
              <Button
                colorPalette="brand"
                onClick={() => respondingTo && handleRespondToRequest(respondingTo)}
                loading={isSendingResponse}
                gap={2}
              >
                <FiSend />
                <Text>{t('requests.responseSubmit') || 'Отправить ответ'}</Text>
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </MainLayout>
  )
}

export { RequestsPage }

