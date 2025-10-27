import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Textarea,
  NativeSelect,
  Grid,
  GridItem,
  useDisclosure,
  Dialog,
  Field,
  Badge,
  IconButton,
  Flex,
  Separator,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiEdit, FiTrash2, FiExternalLink } from 'react-icons/fi'
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../../../__data__/api/productsApi'
import { PRODUCT_CATEGORIES } from '../../../utils/constants'
import { useToast } from '../../../hooks/useToast'
import { BuyProductsTab } from './BuyProductsTab'
import { useAuth } from '../../../hooks/useAuth'

interface ProductFormData {
  name: string
  category: string
  description: string
  type: 'sell' | 'buy'
  productUrl?: string
}

interface ValidationErrors {
  name?: string
  category?: string
  description?: string
}

const VALIDATION_RULES = {
  description: {
    minLength: 20,
    maxLength: 500,
  },
}

const validateProductForm = (formData: ProductFormData): ValidationErrors => {
  const errors: ValidationErrors = {}

  if (!formData.name.trim()) {
    errors.name = 'Название обязательно'
  }

  if (!formData.category.trim()) {
    errors.category = 'Категория обязательна'
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

interface SpecializationTabProps {
  companyId?: string
  isOwnCompany?: boolean
}

export const SpecializationTab = ({ companyId, isOwnCompany = true }: SpecializationTabProps) => {
  const { t } = useTranslation('company')
  const toast = useToast()
  const { company } = useAuth()
  const { open, onOpen, onClose } = useDisclosure()
  
  const [editingProduct, setEditingProduct] = useState<any>(null)
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    category: '',
    description: '',
    type: 'sell',
    productUrl: '',
  })
  const [errors, setErrors] = useState<ValidationErrors>({})

  const { data: products } = useGetProductsQuery()
  const [createProduct, { isLoading: isCreating }] = useCreateProductMutation()
  const [updateProduct, { isLoading: isUpdating }] = useUpdateProductMutation()
  const [deleteProduct] = useDeleteProductMutation()

  const sellProducts = products?.filter((p: any) => p.type === 'sell') || []

  const handleOpenModal = (type: 'sell' | 'buy', product?: any) => {
    if (product) {
      setEditingProduct(product)
      setFormData({
        name: product.name,
        category: product.category,
        description: product.description,
        type: product.type,
        productUrl: product.productUrl || '',
      })
    } else {
      setEditingProduct(null)
      setFormData({
        name: '',
        category: '',
        description: '',
        type,
        productUrl: '',
      })
    }
    setErrors({})
    onOpen()
  }

  const handleClose = () => {
    onClose()
    setEditingProduct(null)
    setFormData({
      name: '',
      category: '',
      description: '',
      type: 'sell',
      productUrl: '',
    })
    setErrors({})
  }

  const handleSave = async () => {
    const validationErrors = validateProductForm(formData)
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors)
      return
    }

    try {
      if (editingProduct) {
        await updateProduct({
          id: editingProduct.id,
          ...formData,
        }).unwrap()
        toast.success(t('common:labels.success') || 'Товар обновлен')
      } else {
        await createProduct(formData).unwrap()
        toast.success(t('common:labels.success') || 'Товар добавлен')
      }
      handleClose()
    } catch (error) {
      toast.error(t('common:errors.server_error') || 'Ошибка при сохранении')
    }
  }

  const handleDelete = async (productId: string) => {
    try {
      await deleteProduct(productId).unwrap()
      toast.success(t('common:labels.success') || 'Товар удален')
    } catch (error) {
      toast.error(t('common:errors.server_error') || 'Ошибка при удалении')
    }
  }

  const getCategoryLabel = (categoryValue: string): string => {
    const category = PRODUCT_CATEGORIES.find(cat => cat.value === categoryValue)
    return category ? category.label : categoryValue
  }

  const ProductCard = ({ product }: { product: any }) => (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={4}
      _hover={{ shadow: 'md', borderColor: 'brand.300' }}
      transition="all 0.2s"
    >
      <VStack align="start" gap={3}>
        <HStack justify="space-between" w="full">
          <Heading size="md">{product.name}</Heading>
          {isOwnCompany && (
            <HStack gap={2}>
              <IconButton
                size="sm"
                variant="outline"
                onClick={() => handleOpenModal('sell', product)}
                title="Редактировать"
              >
                <FiEdit />
              </IconButton>
              <IconButton
                size="sm"
                variant="outline"
                colorPalette="red"
                onClick={() => handleDelete(product.id)}
                title="Удалить"
              >
                <FiTrash2 />
              </IconButton>
            </HStack>
          )}
        </HStack>

        <HStack gap={2}>
          <Badge colorPalette="brand" fontSize="xs">
            {getCategoryLabel(product.category)}
          </Badge>
        </HStack>

        <Text fontSize="sm" color="gray.600">
          {product.description}
        </Text>

        {product.productUrl && (
          <Button
            size="sm"
            variant="outline"
            as="a"
            href={product.productUrl}
            target="_blank"
          >
            <FiExternalLink />
            {t('specialization.view_product') || 'Перейти на продукт'}
          </Button>
        )}
      </VStack>
    </Box>
  )

  return (
    <VStack gap={8} align="stretch">
      {/* Я Продаю Section */}
      <VStack gap={6} align="stretch">
        <HStack justify="space-between">
          <Heading size="lg">{t('specialization.title') || 'Специализация'}</Heading>
          {isOwnCompany && (
            <Button colorPalette="brand" onClick={() => handleOpenModal('sell')}>
              <FiPlus />
              {t('specialization.add_product')}
            </Button>
          )}
        </HStack>

        {sellProducts.length > 0 ? (
          <Grid
            templateColumns={{
              base: '1fr',
              md: 'repeat(2, 1fr)',
              lg: 'repeat(3, 1fr)',
            }}
            gap={6}
          >
            {sellProducts.map((product: any) => (
              <GridItem key={product.id}>
                <ProductCard product={product} />
              </GridItem>
            ))}
          </Grid>
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
            <Text fontSize="lg">{t('specialization.no_products') || 'Нет товаров'}</Text>
          </Flex>
        )}
      </VStack>

      {/* Separator */}
      <Separator />

      {/* Я Покупаю Section */}
      <VStack gap={6} align="stretch">
        <BuyProductsTab companyId={companyId} isOwnCompany={isOwnCompany} />
      </VStack>

      {/* Add/Edit Product Dialog */}
      <Dialog.Root open={open} onOpenChange={(e) => e.open ? onOpen() : handleClose()} size="lg">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {editingProduct
                  ? t('specialization.edit_product')
                  : t('specialization.add_product')}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={6}>
                <Field.Root required invalid={!!errors.name}>
                  <Field.Label>{t('specialization.product_name')}</Field.Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                    placeholder={t('specialization.product_name')}
                  />
                  {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                </Field.Root>

                <Field.Root required invalid={!!errors.category}>
                  <Field.Label>{t('specialization.category')}</Field.Label>
                  <NativeSelect.Root size="sm">
                    <NativeSelect.Field
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value })
                        if (errors.category) setErrors({ ...errors, category: undefined })
                      }}
                    >
                      <option value="">{t('specialization.select_category')}</option>
                      {PRODUCT_CATEGORIES.map((cat) => (
                        <option key={cat.value} value={cat.value}>
                          {cat.label}
                        </option>
                      ))}
                    </NativeSelect.Field>
                    <NativeSelect.Indicator />
                  </NativeSelect.Root>
                  {errors.category && <Field.ErrorText>{errors.category}</Field.ErrorText>}
                </Field.Root>

                <Field.Root required invalid={!!errors.description}>
                  <Field.Label>
                    <HStack justify="space-between">
                      <Text>{t('specialization.description')}</Text>
                      <Text fontSize="xs" color={formData.description.length > VALIDATION_RULES.description.maxLength ? 'red.500' : 'gray.500'}>
                        {formData.description.length}/{VALIDATION_RULES.description.maxLength}
                      </Text>
                    </HStack>
                  </Field.Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => {
                      setFormData({ ...formData, description: e.target.value })
                      if (errors.description) setErrors({ ...errors, description: undefined })
                    }}
                    rows={4}
                    placeholder={`Минимум ${VALIDATION_RULES.description.minLength} символов`}
                  />
                  <HStack justify="space-between" fontSize="xs" mt={1}>
                    <Text color="gray.500">
                      Минимум: {VALIDATION_RULES.description.minLength} • Максимум: {VALIDATION_RULES.description.maxLength}
                    </Text>
                  </HStack>
                  {errors.description && <Field.ErrorText>{errors.description}</Field.ErrorText>}
                </Field.Root>

                <Field.Root>
                  <Field.Label>{t('specialization.product_url')}</Field.Label>
                  <Input
                    value={formData.productUrl}
                    onChange={(e) =>
                      setFormData({ ...formData, productUrl: e.target.value })
                    }
                    placeholder="https://..."
                  />
                </Field.Root>
              </VStack>
            </Dialog.Body>
            <Dialog.Footer>
              <Button variant="ghost" mr={3} onClick={handleClose}>
                {t('common:buttons.cancel')}
              </Button>
              <Button
                colorPalette="brand"
                onClick={handleSave}
                loading={isCreating || isUpdating}
              >
                {t('common:buttons.save')}
              </Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Dialog.Root>
    </VStack>
  )
}
