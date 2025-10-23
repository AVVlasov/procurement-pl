import React, { useState } from 'react'
import { Box, Text, VStack, HStack, Button, Badge, Field, Input, NativeSelect, Table, Container, Tabs, Heading } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiFileText, FiClock, FiCheck, FiX, FiUpload, FiSend, FiDownload } from 'react-icons/fi'
import { MainLayout } from '../../components/layout/MainLayout'
import { useAuth } from '../../hooks/useAuth'
import { useGetBuyDocsQuery, useUploadBuyDocMutation, useAcceptBuyDocMutation, useDeleteBuyDocMutation } from '../../__data__/api/buyApi'
import { useSendBulkRequestMutation, useGetLastReportQuery } from '../../__data__/api/requestsApi'
import { useSearchCompaniesQuery } from '../../__data__/api/searchApi'
import { useToast } from '../../hooks/useToast'
import * as XLSX from 'xlsx'
import { deleteFileFromRemoteAssets } from '../../utils/fileManager'

const RequestsPage = () => {
  const showToast = useToast()
  
  const safeToast = (options: { title: string; type: 'success' | 'error' | 'warning' | 'info' }) => {
    try {
      if (options.type === 'success') showToast.success(options.title)
      else if (options.type === 'error') showToast.error(options.title)
      else if (options.type === 'warning') showToast.warning(options.title)
      else showToast.info(options.title)
    } catch (e) {
      console.log(`[${options.type.toUpperCase()}]`, options.title)
    }
  }
  const { t } = useTranslation('common')
  const { company } = useAuth()
  const companyId = company?.id
  const [tabValue, setTabValue] = useState('products')
  
  const { data: docs = [] } = useGetBuyDocsQuery({ ownerCompanyId: companyId })
  const [uploadDoc, { isLoading: isUploading }] = useUploadBuyDocMutation()
  const [acceptDoc] = useAcceptBuyDocMutation()
  const [sendBulk, { isLoading: isSending }] = useSendBulkRequestMutation()
  const [deleteDoc] = useDeleteBuyDocMutation()
  const { data: companyOptions } = useSearchCompaniesQuery({ limit: 50 })
  const { data: lastReport } = useGetLastReportQuery()
  const [fileName, setFileName] = useState('')
  const [fileType, setFileType] = useState<'xlsx' | 'docx'>('xlsx')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [bulkText, setBulkText] = useState('')
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  // Separate docs by status for tabs
  const requestDocs = docs.filter(d => d.acceptedBy.length === 0)
  const acceptedDocs = docs.filter(d => d.acceptedBy.length > 0)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      setFileName(file.name.replace(/\.[^/.]+$/, ''))
      setFileType(file.name.endsWith('.docx') ? 'docx' : 'xlsx')
    }
  }

  const handleUpload = async () => {
    if (!fileName.trim() || !selectedFile) {
      showToast.warning(t('labels.select_file') || 'Пожалуйста, выберите файл')
      return
    }
    try {
      const reader = new FileReader()
      reader.onload = async (e) => {
        if (!e.target?.result) {
          showToast.error(t('labels.error') || 'Ошибка')
          return
        }
        
        const base64Data = (e.target.result as string).split(',')[1]
        
        try {
          await uploadDoc({
            ownerCompanyId: companyId,
            name: fileName.trim(),
            type: fileType,
            fileData: base64Data,
          }).unwrap()
          showToast.success(t('labels.success') || 'Успешно')
          setFileName('')
          setSelectedFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        } catch {
          showToast.error(t('labels.error') || 'Ошибка')
        }
      }
      reader.onerror = () => {
        showToast.error(t('labels.error') || 'Ошибка при чтении файла')
      }
      reader.readAsDataURL(selectedFile)
    } catch {
      showToast.error(t('labels.error') || 'Ошибка')
    }
  }

  const handleAccept = async (id: string) => {
    try {
      await acceptDoc({ id, companyId }).unwrap()
      safeToast({ title: t('labels.success'), type: 'success' })
    } catch {
      safeToast({ title: t('labels.error'), type: 'error' })
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc({ id }).unwrap()
      await deleteFileFromRemoteAssets(id)
      safeToast({ title: t('labels.success'), type: 'success' })
    } catch {
      safeToast({ title: t('labels.error'), type: 'error' })
    }
  }

  const handleDownload = (doc: typeof docs[0]) => {
    const a = document.createElement('a')
    a.href = doc.url
    a.download = `${doc.name}.${doc.type}`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  const handleSendBulk = async () => {
    if (!bulkText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20) return
    try {
      await sendBulk({ text: bulkText.trim(), recipientCompanyIds: selectedRecipients, files: [] }).unwrap()
      safeToast({ title: 'Рассылка отправлена', type: 'success' })
      setBulkText('')
      setSelectedRecipients([])
    } catch {
      safeToast({ title: t('labels.error'), type: 'error' })
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

  return (
    <MainLayout>
      <Container maxW="container.xl">
        <VStack gap={6} align="stretch">
          <Heading size="xl">{t('requests.buyDocsTitle')}</Heading>

          <Tabs.Root
            value={tabValue}
            onValueChange={(details) => setTabValue(details.value)}
            colorPalette="brand"
            variant="enclosed"
          >
            <Tabs.List>
              <Tabs.Trigger value="products" whiteSpace="nowrap">
                {t('requests.productsTab') || 'Товары'}
              </Tabs.Trigger>
              <Tabs.Trigger value="requests" whiteSpace="nowrap">
                {t('requests.requestsTab') || 'Заявки'}
              </Tabs.Trigger>
              <Tabs.Trigger value="acceptances" whiteSpace="nowrap">
                {t('requests.acceptancesTab') || 'Акцепты'}
              </Tabs.Trigger>
              <Tabs.Trigger value="bulk" whiteSpace="nowrap">
                {t('requests.bulkTab') || 'Рассылка'}
              </Tabs.Trigger>
            </Tabs.List>

            {/* Products Tab */}
            <Box flex="1" p={6}>
              <Tabs.Content value="products">
                <VStack gap={6} align="stretch">
                  <Text fontSize="lg" fontWeight="semibold">{t('requests.productsDescription') || 'Список товаров, которые вы предлагаете'}</Text>
                  
                  <Box p={6} borderWidth="1px" borderRadius="lg" bg="gray.50">
                    <Text color="gray.600">{t('requests.productsEmpty') || 'Товары будут отображены здесь'}</Text>
                  </Box>
                </VStack>
              </Tabs.Content>

              {/* Requests Tab */}
              <Tabs.Content value="requests">
                <VStack gap={6} align="stretch">
                  {/* Upload Section */}
                  <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white">
                    <Text fontWeight="semibold">{t('requests.uploadDocTitle')}</Text>
                    <HStack gap={3} wrap="wrap">
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        style={{ position: 'absolute', visibility: 'hidden', width: 0, height: 0 }} 
                        accept=".xlsx,.docx" 
                      />
                      <Button 
                        colorPalette="gray" 
                        onClick={() => {
                          if (fileInputRef.current) {
                            fileInputRef.current.click()
                          }
                        }}
                        variant="outline"
                      >
                        <FiUpload />
                        <Text ml={2}>{selectedFile ? '📎 ' + selectedFile.name : 'Выбрать файл'}</Text>
                      </Button>
                      <Field.Root>
                        <Field.Label>{t('requests.fileNameLabel')}</Field.Label>
                        <Input 
                          value={fileName} 
                          onChange={(e) => setFileName(e.target.value)} 
                          placeholder="Название без расширения"
                          readOnly={!!selectedFile}
                        />
                      </Field.Root>
                      <Field.Root>
                        <Field.Label>{t('requests.fileTypeLabel')}</Field.Label>
                        <NativeSelect.Root size="sm" w="120px">
                          <NativeSelect.Field
                            value={fileType}
                            onChange={(e) => setFileType(e.target.value as 'xlsx' | 'docx')}
                            disabled={!!selectedFile}
                          >
                            <option value="xlsx">{t('requests.xlsxFileType')}</option>
                            <option value="docx">{t('requests.docxFileType')}</option>
                          </NativeSelect.Field>
                          <NativeSelect.Indicator />
                        </NativeSelect.Root>
                      </Field.Root>
                      <Button colorPalette="blue" onClick={handleUpload} disabled={!fileName.trim() || !selectedFile} loading={isUploading}>
                        <FiUpload />
                        <Text ml={2}>{t('buttons.upload')}</Text>
                      </Button>
                    </HStack>
                  </VStack>

                  {/* Requests List */}
                  <VStack gap={4} align="stretch">
                    <Text fontWeight="semibold">Заявки без акцепта</Text>
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
                        {requestDocs.map((d) => (
                          <Table.Row key={d.id}>
                            <Table.Cell>{d.name}</Table.Cell>
                            <Table.Cell>{d.type}</Table.Cell>
                            <Table.Cell>{Math.round(d.size / 1024)} КБ</Table.Cell>
                            <Table.Cell>{d.acceptedBy.length}</Table.Cell>
                            <Table.Cell>
                              <HStack>
                                <Button size="xs" variant="outline" onClick={() => handleDownload(d)} title="Скачать">
                                  <FiDownload />
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => handleAccept(d.id)}>
                                  <FiCheck />
                                  <Text ml={1}>{t('requests.acceptButton')}</Text>
                                </Button>
                                <Button size="xs" variant="outline" onClick={() => handleDelete(d.id)}>
                                  <FiX />
                                  <Text ml={1}>{t('requests.deleteButton')}</Text>
                                </Button>
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                    {requestDocs.length === 0 && (
                      <Box p={8} textAlign="center" color="gray.500">
                        <Text>{t('requests.noDocsMessage')}</Text>
                      </Box>
                    )}
                  </VStack>
                </VStack>
              </Tabs.Content>

              {/* Acceptances Tab */}
              <Tabs.Content value="acceptances">
                <VStack gap={6} align="stretch">
                  <Text fontWeight="semibold">Акцептованные заявки</Text>
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
                      {acceptedDocs.map((d) => (
                        <Table.Row key={d.id}>
                          <Table.Cell>{d.name}</Table.Cell>
                          <Table.Cell>{d.type}</Table.Cell>
                          <Table.Cell>{Math.round(d.size / 1024)} КБ</Table.Cell>
                          <Table.Cell>{d.acceptedBy.length}</Table.Cell>
                          <Table.Cell>
                            <HStack>
                              <Button size="xs" variant="outline" onClick={() => handleDownload(d)} title="Скачать">
                                <FiDownload />
                              </Button>
                              <Button size="xs" variant="outline" onClick={() => handleDelete(d.id)}>
                                <FiX />
                                <Text ml={1}>{t('requests.deleteButton')}</Text>
                              </Button>
                            </HStack>
                          </Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                  {acceptedDocs.length === 0 && (
                    <Box p={8} textAlign="center" color="gray.500">
                      <Text>{t('requests.noDocsMessage')}</Text>
                    </Box>
                  )}
                </VStack>
              </Tabs.Content>

              {/* Bulk Tab */}
              <Tabs.Content value="bulk">
                <VStack align="stretch" gap={4}>
                  {/* Bulk requests */}
                  <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white">
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
                      <Button colorPalette="green" onClick={handleSendBulk} disabled={!bulkText.trim() || selectedRecipients.length === 0 || selectedRecipients.length > 20} loading={isSending}>
                        <FiSend />
                        <Text ml={2}>{t('requests.sendBulkButton')}</Text>
                      </Button>
                    </HStack>
                  </VStack>

                  {/* Report Preview */}
                  {lastReport && (
                    <VStack align="stretch" gap={4} p={4} borderWidth="1px" borderRadius="lg" bg="white">
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
                </VStack>
              </Tabs.Content>
            </Box>
          </Tabs.Root>
        </VStack>
      </Container>
    </MainLayout>
  )
}

export { RequestsPage }
