import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Textarea,
  Spinner,
  Flex,
  Alert,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiEdit, FiSave, FiX, FiLock } from 'react-icons/fi'
import {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
} from '../../../__data__/api/companiesApi'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'

export const LegalTab = ({ companyId: propCompanyId, isOwnCompany }: { companyId?: string; isOwnCompany?: boolean }) => {
  const { t } = useTranslation('company')
  const { user } = useAuth()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const finalCompanyId = propCompanyId || user?.companyId
  const isEditingOwn = isOwnCompany !== false

  const { data: company, isLoading } = useGetCompanyQuery(finalCompanyId || '', {
    skip: !finalCompanyId,
  })
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation()

  // Determine if details should be visible
  const isDetailsVisible = isOwnCompany || company?.verified

  const [formData, setFormData] = useState({
    legalAddress: company?.legalAddress || '',
    actualAddress: company?.actualAddress || '',
    bankDetails: company?.bankDetails || '',
  })

  React.useEffect(() => {
    if (company) {
      setFormData({
        legalAddress: company.legalAddress || '',
        actualAddress: company.actualAddress || '',
        bankDetails: company.bankDetails || '',
      })
    }
  }, [company])

  const handleSave = async () => {
    try {
      await updateCompany({
        id: user?.companyId || '',
        data: formData,
      }).unwrap()
      
      toast.success(t('common:labels.success'))
      setIsEditing(false)
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
  }

  const handleCancel = () => {
    if (company) {
      setFormData({
        legalAddress: company.legalAddress || '',
        actualAddress: company.actualAddress || '',
        bankDetails: company.bankDetails || '',
      })
    }
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    )
  }

  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Heading size="lg">{t('legal.title')}</Heading>
        {!isEditing && isOwnCompany ? (
          <Button
            colorPalette="brand"
            onClick={() => setIsEditing(true)}
          >
            {t('common:buttons.edit')}
          </Button>
        ) : isEditing ? (
          <HStack>
            <Button
              colorPalette="brand"
              onClick={handleSave}
              loading={isUpdating}
            >
              {t('common:buttons.save')}
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              {t('common:buttons.cancel')}
            </Button>
          </HStack>
        ) : null}
      </HStack>

      {!isDetailsVisible && (
        <Alert.Root borderRadius="lg">
          <Alert.Indicator />
          <Alert.Content>
            <Alert.Description>
              {t('legal.bank_details_hidden')} - доступ предоставляется только верифицированным партнерам
            </Alert.Description>
          </Alert.Content>
        </Alert.Root>
      )}

      {/* Legal Address */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t('legal.legal_address')}
        </Text>
        {isEditing ? (
          <Textarea
            value={formData.legalAddress}
            onChange={(e) =>
              setFormData({ ...formData, legalAddress: e.target.value })
            }
            rows={3}
          />
        ) : (
          <Text fontSize="md" p={4} borderWidth="1px" borderRadius="md">
            {company?.legalAddress || '-'}
          </Text>
        )}
      </Box>

      {/* Actual Address */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t('legal.actual_address')}
        </Text>
        {isEditing ? (
          <Textarea
            value={formData.actualAddress}
            onChange={(e) =>
              setFormData({ ...formData, actualAddress: e.target.value })
            }
            rows={3}
          />
        ) : (
          <Text fontSize="md" p={4} borderWidth="1px" borderRadius="md">
            {company?.actualAddress || '-'}
          </Text>
        )}
      </Box>

      {/* Bank Details */}
      <Box>
        <Text fontSize="lg" fontWeight="bold" mb={2}>
          {t('legal.bank_details')}
        </Text>
        {isEditing ? (
          <Textarea
            value={formData.bankDetails}
            onChange={(e) =>
              setFormData({ ...formData, bankDetails: e.target.value })
            }
            rows={6}
            placeholder="Название банка, БИК, Корр. счет, Расчетный счет..."
          />
        ) : (
          <Box position="relative">
            {company?.bankDetails ? (
              <>
                {isDetailsVisible ? (
                  <Text fontSize="md" p={4} borderWidth="1px" borderRadius="md">
                    {company.bankDetails}
                  </Text>
                ) : (
                  <>
                    <Box
                      p={4}
                      borderWidth="1px"
                      borderRadius="md"
                      filter="blur(4px)"
                      userSelect="none"
                    >
                      <Text>{company.bankDetails}</Text>
                    </Box>
                    <Flex
                      position="absolute"
                      top={0}
                      left={0}
                      right={0}
                      bottom={0}
                      align="center"
                      justify="center"
                      bg="rgba(255,255,255,0.9)"
                      borderRadius="md"
                    >
                      <VStack>
                        <FiLock size={32} color="gray" />
                        <Text fontWeight="bold" color="gray.600">
                          {t('legal.bank_details_hidden')}
                        </Text>
                        <Button
                          size="sm"
                          colorPalette="brand"
                          onClick={() => {
                            toast.info('Запрос отправлен', 'Ожидайте подтверждения от компании')
                          }}
                        >
                          {t('legal.request_access')}
                        </Button>
                      </VStack>
                    </Flex>
                  </>
                )}
              </>
            ) : (
              <Text fontSize="md" p={4} borderWidth="1px" borderRadius="md" color="gray.500">
                -
              </Text>
            )}
          </Box>
        )}
      </Box>
    </VStack>
  )
}

