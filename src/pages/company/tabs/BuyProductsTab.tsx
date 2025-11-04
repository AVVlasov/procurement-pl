import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Button,
  Table,
  Text,
  Input,
  Textarea,
  Heading,
  Badge,
  IconButton,
  Dialog,
  Field,
  Flex,
  Spinner,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiTrash2, FiDownload, FiFileText, FiEdit2, FiUpload, FiCheck, FiX } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth'
import { 
  useGetCompanyBuyProductsQuery, 
  useCreateBuyProductMutation, 
  useUpdateBuyProductMutation, 
  useDeleteBuyProductMutation,
  useAddBuyProductFileMutation,
  useDeleteBuyProductFileMutation,
  useAcceptBuyProductMutation,
  useGetBuyProductAcceptancesQuery,
} from '../../../__data__/api/buyProductsApi'
import { useToast } from '../../../hooks/useToast'

interface BuyProductForm {
  name: string
  description: string
  quantity: string
  unit: string
}

interface ValidationErrors {
  name?: string
  description?: string
}

const VALIDATION_RULES = {
  description: {
    minLength: 20,
    maxLength: 500,
  },
}

const validateBuyProductForm = (formData: BuyProductForm): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!formData.name.trim()) {
    errors.name = 'Название обязательно'
  }

  if (!formData.description.trim()) {
    errors.description = 'Описание обязательно'
  } else if (formData.description.length < VALIDATION_RULES.description.minLength) {
    errors.description = `Минимум ${VALIDATION_RULES.description.minLength} символов`
  } else if (formData.description.length > VALIDATION_RULES.description.maxLength) {
    errors.description = `Максимум ${VALIDATION_RULES.description.maxLength} символов`
  }

  return errors
}

export const BuyProductsTab = ({ companyId: propCompanyId, isOwnCompany }: { companyId?: string; isOwnCompany?: boolean }) => {
  const { t } = useTranslation('company')
  const toast = useToast()
  const { company } = useAuth()
  const companyId = propCompanyId || company?.id
  const isEditingOwn = isOwnCompany !== false

  const { data: products = [], isLoading, refetch } = useGetCompanyBuyProductsQuery(companyId, { skip: !companyId })
  const [createProduct, { isLoading: isCreating }] = useCreateBuyProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateBuyProductMutation()
  const [deleteProduct, { isLoading: isDeleting }] = useDeleteBuyProductMutation()
  const [addFile, { isLoading: isUploadingFile }] = useAddBuyProductFileMutation()
  const [removeFile, { isLoading: isRemovingFile }] = useDeleteBuyProductFileMutation()
  const [acceptProduct] = useAcceptBuyProductMutation()

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BuyProductForm>({
    name: '',
    description: '',
    quantity: '',
    unit: 'шт',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [errors, setErrors] = useState<ValidationErrors>({})
  const [showAcceptances, setShowAcceptances] = useState<string | null>(null)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAddNew = () => {
    setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
    setSelectedFiles([])
    setEditingId(null)
    setErrors({})
    setIsFormOpen(true)
  }

  const handleEdit = (product: any) => {
    setFormData({
      name: product.name,
      description: product.description,
      quantity: product.quantity,
      unit: product.unit,
    })
    setEditingId(product._id)
    setErrors({})
    setIsFormOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleSaveProduct = async () => {
    const validationErrors = validateBuyProductForm(formData)

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      let productId = editingId
      
      if (editingId) {
        await updateProduct({
          id: editingId,
          name: formData.name,
          description: formData.description,
          quantity: formData.quantity,
          unit: formData.unit,
        }).unwrap()
        toast.success(t('common:labels.success') || 'Товар обновлен')
      } else {
        const result = await createProduct({
          name: formData.name,
          description: formData.description,
          quantity: formData.quantity,
          unit: formData.unit,
          status: 'published',
        }).unwrap()
        productId = result._id || result.id
        toast.success(t('common:labels.success') || 'Товар добавлен')
      }

      // Upload files if any
      if (selectedFiles.length > 0 && productId) {
        for (const file of selectedFiles) {
          try {
            await addFile({ id: productId, file }).unwrap()
          } catch (err) {
            console.error('Error uploading file:', err)
            toast.error(t('common:messages.file_upload_failed'))
          }
        }
      }

      setIsFormOpen(false)
      setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
      setSelectedFiles([])
      setErrors({})
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      await refetch()
    } catch (error) {
      toast.error(t('common:errors.server_error') || 'Ошибка при сохранении')
    }
  }

  const handleRemoveFile = async (productId: string, fileId: string) => {
    try {
      await removeFile({ id: productId, fileId }).unwrap()
      toast.success(t('common:messages.file_deleted'))
      await refetch()
    } catch (error) {
      toast.error(t('common:messages.file_delete_failed'))
    }
  }

  const handleDeleteProduct = async (id: string) => {
    try {
      await deleteProduct(id).unwrap()
      toast.success(t('common:labels.success') || 'Товар удален')
      await refetch()
    } catch (error) {
      toast.error(t('common:errors.server_error') || 'Ошибка при удалении')
    }
  }

  const handleAcceptProduct = async (id: string) => {
    try {
      await acceptProduct(id).unwrap()
      toast.success('Товар акцептирован')
      await refetch()
    } catch (error) {
      toast.error('Ошибка при акцепте')
    }
  }

  const handleDownloadFile = async (productId: string, fileId: string, fileName: string) => {
    try {
      const token = localStorage.getItem('accessToken')
      const response = await fetch(`/api/buy-products/download/${productId}/${fileId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to download file')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      toast.error('Ошибка при скачивании файла')
    }
  }

  const isProductAccepted = (product: any) => {
    return product.acceptedBy?.some((a: any) => {
      const compId = typeof a.companyId === 'string' ? a.companyId : a.companyId?._id
      return compId === company?.id
    })
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Heading size="lg">{t('buy_products.title') || 'Товары (Я покупаю)'}</Heading>
        {isEditingOwn && (
          <Button colorPalette="brand" onClick={handleAddNew}>
            <FiPlus />
            {t('common:buttons.add') || 'Добавить товар'}
          </Button>
        )}
      </HStack>

      {/* Products Table */}
      {isLoading ? (
        <Flex justify="center" py={8}>
          <Text color="gray.500">{t('common:labels.loading')}</Text>
        </Flex>
      ) : products.length > 0 ? (
        <Box overflowX="auto">
          <Table.Root variant="line">
            <Table.Header>
              <Table.Row>
                <Table.ColumnHeader>{t('common:labels.name') || 'Название'}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('common:labels.description') || 'Описание'}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('common:labels.quantity') || 'Количество'}</Table.ColumnHeader>
                <Table.ColumnHeader>{t('buy_products.files') || 'Файлы'}</Table.ColumnHeader>
                <Table.ColumnHeader>Акцепты</Table.ColumnHeader>
                <Table.ColumnHeader>{t('common:labels.actions') || 'Действия'}</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {products.map((product: any) => (
                <Table.Row key={product._id}>
                  <Table.Cell fontWeight="medium">{product.name}</Table.Cell>
                  <Table.Cell fontSize="sm" color="gray.600">
                    {product.description?.substring(0, 50)}
                    {product.description && product.description.length > 50 ? '...' : ''}
                  </Table.Cell>
                  <Table.Cell>
                    {product.quantity} {product.unit}
                  </Table.Cell>
                  <Table.Cell>
                    {product.files && product.files.length > 0 ? (
                      <VStack align="start" gap={2} maxW="240px">
                        {product.files.map((file: any) => (
                          <HStack key={file.id} gap={2} align="center" maxW="100%">
                            <Box
                              onClick={() => handleDownloadFile(product._id, file.id, file.name)}
                              display="flex"
                              alignItems="center"
                              gap={1}
                              maxW="180px"
                              color="brand.500"
                              textDecoration="none"
                              fontSize="sm"
                              _hover={{ textDecoration: 'underline', color: 'brand.600' }}
                              cursor="pointer"
                            >
                              <FiDownload style={{ flexShrink: 0 }} />
                              <Text
                                overflow="hidden"
                                textOverflow="ellipsis"
                                whiteSpace="nowrap"
                                title={file.name}
                              >
                                {file.name}
                              </Text>
                            </Box>
                            {isEditingOwn && (
                              <IconButton
                                size="xs"
                                variant="ghost"
                                colorPalette="red"
                                aria-label={t('common:buttons.delete') || 'Удалить'}
                                onClick={() => handleRemoveFile(product._id, file.id)}
                                loading={isRemovingFile}
                              >
                                <FiTrash2 />
                              </IconButton>
                            )}
                          </HStack>
                        ))}
                      </VStack>
                    ) : (
                      <Badge colorPalette="gray">
                        {t('buy_products.files_empty') || 'Нет файлов'}
                      </Badge>
                    )}
                  </Table.Cell>
                  <Table.Cell>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowAcceptances(showAcceptances === product._id ? null : product._id)}
                    >
                      {product.acceptedBy?.length || 0}
                    </Button>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      {!isEditingOwn && !isProductAccepted(product) && (
                        <Button
                          size="sm"
                          colorPalette="green"
                          onClick={() => handleAcceptProduct(product._id)}
                          title="Акцептировать"
                        >
                          <FiCheck />
                        </Button>
                      )}
                      {!isEditingOwn && isProductAccepted(product) && (
                        <Badge colorPalette="green">Акцептировано</Badge>
                      )}
                      {isEditingOwn && (
                        <>
                          <IconButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                            title="Редактировать"
                            color="black"
                          >
                            <FiEdit2 />
                          </IconButton>
                          <IconButton
                            size="sm"
                            variant="outline"
                            colorPalette="red"
                            onClick={() => handleDeleteProduct(product._id)}
                            title="Удалить"
                            loading={isDeleting}
                            color="black"
                          >
                            <FiTrash2 />
                          </IconButton>
                        </>
                      )}
                    </HStack>
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Root>

          {/* Acceptances Details */}
          {showAcceptances && (
            <Box p={4} mt={4} borderWidth="1px" borderRadius="lg" bg="gray.50">
              <Text fontWeight="bold" mb={3}>
                Компании которые акцептовали:
              </Text>
              <VStack gap={2} align="stretch">
                {products.find((p: any) => p._id === showAcceptances)?.acceptedBy?.length > 0 ? (
                  products.find((p: any) => p._id === showAcceptances)?.acceptedBy?.map((a: any, idx: number) => (
                    <Box key={idx} p={2} borderWidth="1px" borderRadius="md" bg="white">
                      <Text fontSize="sm">
                        {typeof a.companyId === 'string' 
                          ? a.companyId 
                          : (a.companyId?.shortName || a.companyId?.fullName || 'Неизвестная компания')}
                      </Text>
                      <Text fontSize="xs" color="gray.500">
                        {new Date(a.acceptedAt).toLocaleString('ru-RU')}
                      </Text>
                    </Box>
                  ))
                ) : (
                  <Text color="gray.500" fontSize="sm">Нет акцептов</Text>
                )}
              </VStack>
            </Box>
          )}
        </Box>
      ) : (
        <Flex
          p={12}
          borderWidth="1px"
          borderRadius="lg"
          justify="center"
          direction="column"
          align="center"
          color="gray.500"
        >
          <Box as={FiFileText} boxSize={12} mb={4} />
          <Text fontSize="lg">{t('common:labels.no_data') || 'Нет товаров'}</Text>
          <Text fontSize="sm" color="gray.400" mt={2}>
            {t('buy_products.empty') || 'Добавьте первый товар, чтобы начать'}
          </Text>
        </Flex>
      )}

      {/* Add/Edit Product Dialog */}
      <Dialog.Root open={isFormOpen} onOpenChange={(details) => {
        if (!details.open) {
          setIsFormOpen(false)
          setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
          setSelectedFiles([])
          setErrors({})
        }
      }} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {editingId ? (t('buy_products.edit') || 'Редактировать товар') : (t('buy_products.add') || 'Добавить товар')}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={6}>
                <Field.Root required invalid={!!errors.name}>
                  <Field.Label>{t('buy_products.name') || 'Название'}</Field.Label>
                  <Input
                    placeholder={t('buy_products.name_placeholder') || 'Название товара'}
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                  />
                  {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                </Field.Root>

                <Field.Root required invalid={!!errors.description}>
                  <Field.Label>
                    <HStack justify="space-between">
                      <Text>{t('buy_products.description') || 'Описание'}</Text>
                      <Text fontSize="xs" color={formData.description.length > VALIDATION_RULES.description.maxLength ? 'red.500' : 'gray.500'}>
                        {formData.description.length}/{VALIDATION_RULES.description.maxLength}
                      </Text>
                    </HStack>
                  </Field.Label>
                  <Textarea
                    placeholder={`Описание товара (мин. ${VALIDATION_RULES.description.minLength} символов)`}
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value })
                      if (errors.description) setErrors({ ...errors, description: undefined })
                    }}
                    rows={4}
                  />
                  <HStack justify="space-between" fontSize="xs" mt={1}>
                    <Text color="gray.500">
                      Минимум: {VALIDATION_RULES.description.minLength} • Максимум: {VALIDATION_RULES.description.maxLength}
                    </Text>
                  </HStack>
                  {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
                </Field.Root>

                <HStack gap={4} align="start" w="full">
                  <Field.Root required flex={1}>
                    <Field.Label>{t('buy_products.quantity') || 'Количество'}</Field.Label>
                    <Input
                      placeholder={t('buy_products.quantity_placeholder') || 'Количество'}
                      value={formData.quantity}
                      onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    />
                  </Field.Root>

                  <Field.Root flex={1}>
                    <Field.Label>{t('buy_products.unit') || 'Единица'}</Field.Label>
                    <Input
                      placeholder="шт"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    />
                  </Field.Root>
                </HStack>

                {isEditingOwn && (
                  <Field.Root>
                    <Field.Label>
                      <HStack justify="space-between">
                        <Text>{t('buy_products.files') || 'Файлы'}</Text>
                        <Text fontSize="xs" color="gray.500">
                          {t('buy_products.upload_hint') || 'PDF, DOC, DOCX, XLS, XLSX, CSV до 15 МБ'}
                        </Text>
                      </HStack>
                    </Field.Label>
                    <Input
                      ref={fileInputRef}
                      type="file"
                      multiple
                      accept=".doc,.docx,.xls,.xlsx,.pdf,.csv"
                      onChange={handleFileSelect}
                      display="none"
                    />
                    <Button
                      colorPalette="gray"
                      variant="outline"
                      width="full"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploadingFile}
                    >
                      <HStack gap={2} justify="center">
                        {isUploadingFile ? <Spinner size="sm" /> : <FiUpload />}
                        <Text>
                          {isUploadingFile
                            ? t('buy_products.uploading') || 'Загрузка...'
                            : t('buy_products.select_files') || 'Выбрать файлы (DOC, XLS, PDF)'}
                        </Text>
                      </HStack>
                    </Button>
                    {selectedFiles.length > 0 && (
                      <VStack gap={2} mt={3} align="start">
                        <Text fontSize="sm" fontWeight="medium">
                          Выбранные файлы:
                        </Text>
                        {selectedFiles.map((file, idx) => (
                          <Text key={idx} fontSize="sm" color="gray.600">
                            {file.name}
                          </Text>
                        ))}
                      </VStack>
                    )}
                  </Field.Root>
                )}
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsFormOpen(false)
                  setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
                  setSelectedFiles([])
                  setErrors({})
                }}
              >
                {t('common:buttons.cancel') || 'Отмена'}
              </Button>
              <Button colorPalette="brand" onClick={handleSaveProduct} loading={isCreating || isUpdating}>
                {t('common:buttons.save') || 'Сохранить'}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  )
}
