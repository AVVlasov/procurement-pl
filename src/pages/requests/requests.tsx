import React, { useState } from 'react'
import { Box, Text, VStack, HStack, Button, Badge, Field, Input, NativeSelect, Table } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiFileText, FiClock, FiCheck, FiX, FiUpload, FiSend } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useGetBuyDocsQuery, useUploadBuyDocMutation, useAcceptBuyDocMutation } from '../../__data__/api/buyApi'
import { useSendBulkRequestMutation, useGetLastReportQuery } from '../../__data__/api/requestsApi'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'
import { toaster } from '../../components/ui/toaster'
import * as XLSX from 'xlsx'

const RequestsPage = () => {
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const companyId = company?.id || 'company-123'
  const { data: docs = [] } = useGetBuyDocsQuery({ ownerCompanyId: companyId })
  const [uploadDoc, { isLoading: isUploading }] = useUploadBuyDocMutation()
  const [acceptDoc] = useAcceptBuyDocMutation()
  const [sendBulk, { isLoading: isSending }] = useSendBulkRequestMutation()
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 50 })
  const { data: lastReport } = useGetLastReportQuery()
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<'xlsx' | 'docx'>('xlsx')
  const [bulkText, setBulkText] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])

  const handleUpload = async () => {
    if (!fileName.trim()) return
    try {
      await uploadDoc({ ownerCompanyId: companyId, name: fileName.trim(), type: fileType }).unwrap()
      toaster.create({ title: t('labels.success'), type: 'success' })
      setFileName('')
    } catch {
      toaster.create({ title: t('labels.error'), type: 'error' })
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await acceptDoc({ id, companyId }).unwrap()
      toaster.create({ title: t('labels.success'), type: 'success' })
    } catch {
      toaster.create({ title: t('labels.error'), type: 'error' })
    }
  }

  const handleSendBulk = async () => {
    if (!bulkText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20) return
    try {
      await sendBulk({ text: bulkText.trim(), recipientCompanyIds: selectedRecipients, files: [] }).unwrap()
      toaster.create({ title: 'Рассылка отправлена', type: 'success' })
      setBulkText('')
      setSelectedRecipients([])
    } catch {
      toaster.create({ title: t('labels.error'), type: 'error' })
    }
  }

  const exportHtml = () => {
    const html = document.getElementById('report-preview')?.innerHTML || ''
    const blob = new Blob([`<html><head><meta charset="utf-8"/></head><body>${html}</body></html>`], { type: 'text/html;charset=utf-8' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'report.html'
    a.click()
  }

  const exportXlsx = () => {
    if (!lastReport) return
    const rows = lastReport.result.map((r) => {
      const companyName = (companyOptions?.companies || []).find(c => c.id === r.companyId)?.shortName || r.companyId
      return { Company: companyName, Status: r.success ? 'Success' : 'Error', Message: r.message }
    })
    const ws = XLSX.utils.json_to_sheet(rows)
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Results')
    XLSX.writeFile(wb, 'report.xlsx')
  }

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
          <Text fontSize="2xl" fontWeight="bold">{t('requests.buyDocsTitle')}</Text>
        </HStack>

        {/* Upload */}
        <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white">
          <Text fontWeight="semibold">{t('requests.uploadDocTitle')}</Text>
          <HStack gap={3}>
            <Field.Root required>
              <Field.Label>{t('requests.fileNameLabel')}</Field.Label>
              <Input value={fileName} onChange={(e) => setFileName(e.target.value)} placeholder="specs.xlsx" />
            </Field.Root>
            <Field.Root>
              <Field.Label>{t('requests.fileTypeLabel')}</Field.Label>
              <NativeSelect.Root size="sm" w="160px">
                <NativeSelect.Field
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value as 'xlsx' | 'docx')}
                >
                  <option value="xlsx">{t('requests.xlsxFileType')}</option>
                  <option value="docx">{t('requests.docxFileType')}</option>
                </NativeSelect.Field>
                <NativeSelect.Indicator />
              </NativeSelect.Root>
            </Field.Root>
            <Button colorPalette="blue" onClick={handleUpload} disabled={!fileName.trim()} loading={isUploading ? true : undefined}>
              <FiUpload />
              <Text ml={2}>{t('buttons.upload')}</Text>
            </Button>
          </HStack>
        </VStack>

        {/* List */}
        <VStack gap={4} align="stretch" mt={6}>
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('requests.nameColumn')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('requests.typeColumn')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('requests.sizeColumn')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('requests.acceptsColumn')}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('requests.actionsColumn')}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {docs.map((d) => (
                <Table.Row key={d.id}>
                  <Table.Cell>{d.name}</Table.Cell>
                  <Table.Cell>{d.type}</Table.Cell>
                  <Table.Cell>{Math.round(d.size / 1024)} КБ</Table.Cell>
                  <Table.Cell>{d.acceptedBy.length}</Table.Cell>
                  <Table.Cell>
                    <HStack>
                      <Button size="xs" variant="outline" onClick={() => handleAccept(d.id)}>
                        <FiCheck />
                        <Text ml={1}>{t('requests.acceptButton')}</Text>
                      </Button>
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>
        </VStack>

        {/* Bulk requests */}
        <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={8}>
          <Text fontWeight="semibold">{t('requests.bulkRequestTitle')}</Text>
          <Field.Root required>
            <Field.Label>{t('requests.bulkTextLabel')}</Field.Label>
            <Input value={bulkText} onChange={(e) => setBulkText(e.target.value)} placeholder="Введите текст запроса" />
          </Field.Root>
          <Field.Root>
            <Field.Label>{t('requests.recipientsLabel')}</Field.Label>
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
            <Text fontSize="xs" color="gray.500">{t('requests.recipientsCount')}: {selectedRecipients.length} / 20</Text>
          </Field.Root>
          <HStack>
            <Button colorPalette="green" onClick={handleSendBulk} disabled={!bulkText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20} loading={isSending ? true : undefined}>
              <FiSend />
              <Text ml={2}>{t('requests.sendBulkButton')}</Text>
            </Button>
          </HStack>
        </VStack>

        {/* Report Preview */}
        {lastReport && (
          <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white" mt={8}>
            <HStack justify="space-between">
              <Text fontWeight="semibold">{t('requests.finalReportTitle')}</Text>
              <HStack>
                <Button variant="outline" onClick={() => exportHtml()}>{t('requests.exportHtmlButton')}</Button>
                <Button variant="outline" onClick={() => exportXlsx()}>{t('requests.exportXlsxButton')}</Button>
              </HStack>
            </HStack>
            <Box id="report-preview">
              <Text fontSize="sm" color="gray.600" mb={2}>{t('requests.bulkTextPreview')}: {lastReport.text}</Text>
              <Table.Root variant="line">
                <Table.Header>
                  <Table.Row>
                    <Table.ColumnHeader>{t('requests.companyColumn')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('requests.statusColumn')}</Table.ColumnHeader>
                    <Table.ColumnHeader>{t('requests.messageColumn')}</Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {lastReport.result.map((r) => {
                    const companyName = (companyOptions?.companies || []).find(c => c.id === r.companyId)?.shortName || r.companyId
                    return (
                      <Table.Row key={r.companyId}>
                        <Table.Cell>{companyName}</Table.Cell>
                        <Table.Cell>{r.success ? t('requests.successStatus') : t('requests.errorStatus')}</Table.Cell>
                        <Table.Cell>{r.message}</Table.Cell>
                      </Table.Row>
                    )
                  })}
                </Table.Body>
              </Table.Root>
            </Box>
          </VStack>
        )}

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
                      <Text as="span" fontWeight="medium">{t('requests.companyLabel')}:</Text> {request.company}
                    </Text>
                    
                    <Text fontSize="sm" color="gray.600">
                      {request.description}
                    </Text>
                    
                    <HStack justify="space-between" w="full">
                      <Text fontSize="xs" color="gray.500">
                        {t('requests.dateLabel')}: {request.date}
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

        {docs.length === 0 && (
          <VStack gap={4} py={12}>
            <Box as={FiFileText} w={16} h={16} color="gray.400" />
            <Text fontSize="lg" color="gray.500">
              {t('requests.noDocsMessage')}
            </Text>
            <Text fontSize="sm" color="gray.400" textAlign="center">
              {t('requests.noDocsDescription')}
            </Text>
          </VStack>
        )}
      </Box>
    </MainLayout>
  )
}

export { RequestsPage }
