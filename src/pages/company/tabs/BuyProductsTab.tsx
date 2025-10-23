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
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiTrash2, FiDownload, FiFileText, FiEdit2 } from 'react-icons/fi'
import { useAuth } from '../../../hooks/useAuth'
import { useGetCompanyBuyProductsQuery, useCreateBuyProductMutation, useUpdateBuyProductMutation, useDeleteBuyProductMutation } from '../../../__data__/api/buyProductsApi'
import { useToast } from '../../../hooks/useToast'

interface BuyProductForm {
  name: string
  description: string
  quantity: string
  unit: string
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

  const [isFormOpen, setIsFormOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<BuyProductForm>({
    name: '',
    description: '',
    quantity: '',
    unit: 'шт',
  })
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAddNew = () => {
    setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
    setSelectedFiles([])
    setEditingId(null)
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
    setIsFormOpen(true)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      setSelectedFiles(Array.from(files))
    }
  }

  const handleSaveProduct = async () => {
    if (!formData.name.trim() || !formData.description.trim()) {
      toast.warning(t('common:labels.fill_required_fields') || 'Заполните обязательные поля')
      return
    }

    try {
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
        await createProduct({
          name: formData.name,
          description: formData.description,
          quantity: formData.quantity,
          unit: formData.unit,
          status: 'published',
        }).unwrap()
        toast.success(t('common:labels.success') || 'Товар добавлен')
      }
      setIsFormOpen(false)
      setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
      setSelectedFiles([])
    } catch (error) {
      toast.error(t('common:errors.server_error') || 'Ошибка при сохранении')
    }
  }

  const handleDeleteProduct = async (id: string) => {
    if (window.confirm('Вы уверены, что хотите удалить этот товар?')) {
      try {
        await deleteProduct(id).unwrap()
        toast.success(t('common:labels.success') || 'Товар удален')
      } catch (error) {
        toast.error(t('common:errors.server_error') || 'Ошибка при удалении')
      }
    }
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
                <Table.ColumnHeader>{t('common:labels.status') || 'Статус'}</Table.ColumnHeader>
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
                    <Badge colorPalette={product.status === 'published' ? 'green' : 'yellow'}>
                      {product.status === 'published' ? 'Опубликовано' : 'Черновик'}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <HStack gap={2}>
                      {isEditingOwn && (
                        <>
                          <IconButton
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(product)}
                            title="Редактировать"
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
                <Field.Root required>
                  <Field.Label>{t('buy_products.name') || 'Название'}</Field.Label>
                  <Input
                    placeholder={t('buy_products.name_placeholder') || 'Название товара'}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </Field.Root>

                <Field.Root required>
                  <Field.Label>{t('buy_products.description') || 'Описание'}</Field.Label>
                  <Textarea
                    placeholder={t('buy_products.description_placeholder') || 'Описание товара (мин. 10 символов)'}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                  />
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
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button
                variant="ghost"
                onClick={() => {
                  setIsFormOpen(false)
                  setFormData({ name: '', description: '', quantity: '', unit: 'шт' })
                  setSelectedFiles([])
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
