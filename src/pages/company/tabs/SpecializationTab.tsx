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
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiPlus, FiEdit, FiTrash2, FiExternalLink } from 'react-icons/fi'
import { useGetProductsQuery, useCreateProductMutation, useUpdateProductMutation, useDeleteProductMutation } from '../../../__data__/api/productsApi'
import { PRODUCT_CATEGORIES } from '../../../utils/constants'
import { useToast } from '../../../hooks/useToast'

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

export const SpecializationTab = () => {
  const { t } = useTranslation('company')
  const toast = useToast()
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
  const buyProducts = products?.filter((p: any) => p.type === 'buy') || []

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
    setEditingProduct(null)
    setFormData({
      name: '',
      category: '',
      description: '',
      type: 'sell',
      productUrl: '',
    })
    setErrors({})
    onClose()
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
          data: formData,
        }).unwrap()
      } else {
        await createProduct(formData).unwrap()
      }
      
      toast.success(t('common:labels.success'))
      handleClose()
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProduct(id).unwrap()
      toast.success(t('common:labels.success'))
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
  }

  const ProductCard = ({ product }: { product: any }) => (
    <Box
      p={4}
      borderWidth="1px"
      borderRadius="lg"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      <VStack align="stretch" gap={3}>
        <HStack justify="space-between">
          <Heading size="sm">{product.name}</Heading>
          <HStack>
            <IconButton
              aria-label="Edit"
              size="sm"
              variant="ghost"
              onClick={() => handleOpenModal(product.type, product)}
              color="black"
            >
              <FiEdit />
            </IconButton>
            <IconButton
              aria-label="Delete"
              size="sm"
              variant="ghost"
              colorPalette="red"
              onClick={() => handleDelete(product.id)}
              color="black"
            >
              <FiTrash2 />
            </IconButton>
          </HStack>
        </HStack>
        <Badge colorPalette="blue" w="fit-content">
          {product.category}
        </Badge>
        <Text fontSize="sm" color="gray.600">
          {product.description}
        </Text>
        {product.productUrl && (
          <Button
            as="a"
            href={product.productUrl}
            target="_blank"
            size="sm"
            variant="link"
            colorPalette="brand"
          >
            {t('specialization.product_url')}
            <FiExternalLink />
          </Button>
        )}
      </VStack>
    </Box>
  )

  return (
    <VStack gap={8} align="stretch">
      {/* Sell Section */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">{t('specialization.sell_section')}</Heading>
          <Button
            colorPalette="brand"
            size="sm"
            onClick={() => handleOpenModal('sell')}
          >
            <FiPlus />
            {t('specialization.add_product')}
          </Button>
        </HStack>
        {sellProducts.length > 0 ? (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            {sellProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        ) : (
          <Flex
            p={8}
            borderWidth="1px"
            borderRadius="lg"
            justify="center"
            color="gray.500"
          >
            <Text>{t('specialization.no_products')}</Text>
          </Flex>
        )}
      </Box>

      {/* Buy Section */}
      <Box>
        <HStack justify="space-between" mb={4}>
          <Heading size="md">{t('specialization.buy_section')}</Heading>
          <Button
            colorPalette="green"
            size="sm"
            onClick={() => handleOpenModal('buy')}
          >
            <FiPlus />
            {t('specialization.add_product')}
          </Button>
        </HStack>
        {buyProducts.length > 0 ? (
          <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={4}>
            {buyProducts.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </Grid>
        ) : (
          <Flex
            p={8}
            borderWidth="1px"
            borderRadius="lg"
            justify="center"
            color="gray.500"
          >
            <Text>{t('specialization.no_products')}</Text>
          </Flex>
        )}
      </Box>

      {/* Dialog */}
      <Dialog.Root open={open} onOpenChange={(e) => e.open ? onOpen() : onClose()} size="xl">
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>
                {editingProduct ? t('common:buttons.edit') : t('specialization.add_product')}
              </Dialog.Title>
              <Dialog.CloseTrigger />
            </Dialog.Header>
            <Dialog.Body>
              <VStack gap={4}>
                <Field.Root required invalid={!!errors.name}>
                  <Field.Label>{t('specialization.product_name')}</Field.Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value })
                      if (errors.name) setErrors({ ...errors, name: undefined })
                    }}
                  />
                  {errors.name && <Field.ErrorText>{errors.name}</Field.ErrorText>}
                </Field.Root>

                <Field.Root required invalid={!!errors.category}>
                  <Field.Label>{t('specialization.category')}</Field.Label>
                  <NativeSelect.Root>
                    <NativeSelect.Field
                      value={formData.category}
                      onChange={(e) => {
                        setFormData({ ...formData, category: e.target.value })
                        if (errors.category) setErrors({ ...errors, category: undefined })
                      }}
                      placeholder={t('common:labels.select')}
                    >
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

