import React, { useState } from 'react'
import {
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Button,
  Input,
  Avatar,
  Badge,
  Grid,
  GridItem,
  Spinner,
  Flex,
} from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiEdit, FiSave, FiX, FiCheck, FiUpload } from 'react-icons/fi'
import {
  useGetCompanyQuery,
  useUpdateCompanyMutation,
  useUploadLogoMutation,
} from '../../../__data__/api/companiesApi'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'

export const AboutTab = () => {
  const { t } = useTranslation('company')
  const { user } = useAuth()
  const toast = useToast()
  const [isEditing, setIsEditing] = useState(false)

  const { data: company, isLoading } = useGetCompanyQuery(user?.companyId || '', {
    skip: !user?.companyId,
  })
  const [updateCompany, { isLoading: isUpdating }] = useUpdateCompanyMutation()
  const [uploadLogo, { isLoading: isUploading }] = useUploadLogoMutation()

  const [formData, setFormData] = useState({
    fullName: company?.fullName || '',
    shortName: company?.shortName || '',
    slogan: company?.slogan || '',
    website: company?.website || '',
    phone: company?.phone || '',
    email: company?.email || '',
    foundedYear: company?.foundedYear || '',
  })

  React.useEffect(() => {
    if (company) {
      setFormData({
        fullName: company.fullName,
        shortName: company.shortName || '',
        slogan: company.slogan || '',
        website: company.website,
        phone: company.phone || '',
        email: company.email || '',
        foundedYear: company.foundedYear?.toString() || '',
      })
    }
  }, [company])

  const handleSave = async () => {
    try {
      await updateCompany({
        id: user?.companyId || '',
        data: {
          ...formData,
          foundedYear: formData.foundedYear ? parseInt(formData.foundedYear) : undefined,
        },
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
        fullName: company.fullName,
        shortName: company.shortName || '',
        slogan: company.slogan || '',
        website: company.website,
        phone: company.phone || '',
        email: company.email || '',
        foundedYear: company.foundedYear?.toString() || '',
      })
    }
    setIsEditing(false)
  }

  const handleLogoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user?.companyId) return

    try {
      await uploadLogo({ companyId: user.companyId, file }).unwrap()
      toast.success(t('common:labels.success'))
    } catch (error) {
      toast.error(t('common:errors.server_error'))
    }
  }

  if (isLoading) {
    return (
      <Flex justify="center" align="center" minH="400px">
        <Spinner size="xl" color="brand.500" />
      </Flex>
    )
  }

  return (
    <VStack gap={{ base: 4, md: 6 }} align="stretch">
      {/* Header */}
      <HStack justify="space-between" flexWrap="wrap" gap={2}>
        <Heading size={{ base: 'md', md: 'lg' }}>{t('about.title')}</Heading>
        {!isEditing ? (
          <Button
            colorPalette="brand"
            onClick={() => setIsEditing(true)}
            size={{ base: 'sm', md: 'md' }}
          >
            <FiEdit />
            <Text ml={2} display={{ base: 'none', sm: 'inline' }}>
              {t('common:buttons.edit')}
            </Text>
            <Text ml={2} display={{ base: 'inline', sm: 'none' }}>
              Изменить
            </Text>
          </Button>
        ) : (
          <HStack gap={2}>
            <Button
              colorPalette="brand"
              onClick={handleSave}
              loading={isUpdating}
              size={{ base: 'sm', md: 'md' }}
            >
              <FiSave />
              <Text ml={2} display={{ base: 'none', sm: 'inline' }}>
                {t('common:buttons.save')}
              </Text>
              <Text ml={2} display={{ base: 'inline', sm: 'none' }}>
                Сохранить
              </Text>
            </Button>
            <Button
              variant="outline"
              onClick={handleCancel}
              size={{ base: 'sm', md: 'md' }}
            >
              <FiX />
              <Text ml={2} display={{ base: 'none', sm: 'inline' }}>
                {t('common:buttons.cancel')}
              </Text>
              <Text ml={2} display={{ base: 'inline', sm: 'none' }}>
                Отмена
              </Text>
            </Button>
          </HStack>
        )}
      </HStack>

      {/* Logo Section */}
      <Box>
        <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
          {t('about.logo')}
        </Text>
        <HStack gap={4} flexWrap="wrap">
          <Avatar.Root
            size={{ base: 'xl', md: '2xl' }}
            name={company?.fullName}
            src={company?.logo}
          >
            <Avatar.Fallback>{company?.fullName?.[0]}</Avatar.Fallback>
          </Avatar.Root>
          {isEditing && (
            <Button
              as="label"
              colorPalette="gray"
              variant="outline"
              cursor="pointer"
              loading={isUploading}
              size={{ base: 'sm', md: 'md' }}
            >
              <FiUpload />
              <Text ml={2} display={{ base: 'none', sm: 'inline' }}>
                {t('common:buttons.upload')}
              </Text>
              <Text ml={2} display={{ base: 'inline', sm: 'none' }}>
                Загрузить
              </Text>
              <Input
                type="file"
                accept="image/*"
                hidden
                onChange={handleLogoUpload}
              />
            </Button>
          )}
        </HStack>
      </Box>

      {/* Company Info Grid */}
      <Grid 
        templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} 
        gap={{ base: 4, md: 6 }}
      >
        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.full_name')}
            </Text>
            {isEditing ? (
              <Input
                value={formData.fullName}
                onChange={(e) =>
                  setFormData({ ...formData, fullName: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.fullName}</Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.short_name')}
            </Text>
            {isEditing ? (
              <Input
                value={formData.shortName}
                onChange={(e) =>
                  setFormData({ ...formData, shortName: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.shortName || '-'}</Text>
            )}
          </Box>
        </GridItem>

        <GridItem colSpan={{ base: 1, md: 2 }}>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.slogan')}
            </Text>
            {isEditing ? (
              <Input
                value={formData.slogan}
                onChange={(e) =>
                  setFormData({ ...formData, slogan: e.target.value })
                }
                placeholder="Ваш слоган..."
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }} fontStyle="italic" color="gray.600">
                {company?.slogan || '-'}
              </Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.inn')}
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.inn}</Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.ogrn')}
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.ogrn}</Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.founded_year')}
            </Text>
            {isEditing ? (
              <Input
                type="number"
                value={formData.foundedYear}
                onChange={(e) =>
                  setFormData({ ...formData, foundedYear: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.foundedYear || '-'}</Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.website')}
            </Text>
            {isEditing ? (
              <Input
                value={formData.website}
                onChange={(e) =>
                  setFormData({ ...formData, website: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>
                {company?.website ? (
                  <a
                    href={company.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#3182ce' }}
                  >
                    {company.website}
                  </a>
                ) : (
                  '-'
                )}
              </Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.phone')}
            </Text>
            {isEditing ? (
              <Input
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.phone || '-'}</Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.email')}
            </Text>
            {isEditing ? (
              <Input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                size={{ base: 'sm', md: 'md' }}
              />
            ) : (
              <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.email || '-'}</Text>
            )}
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.employee_count')}
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.employeeCount || '-'}</Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.revenue')}
            </Text>
            <Text fontSize={{ base: 'md', md: 'lg' }}>{company?.revenue || '-'}</Text>
          </Box>
        </GridItem>

        <GridItem>
          <Box>
            <Text fontWeight="medium" mb={2} fontSize={{ base: 'sm', md: 'md' }}>
              {t('about.verified')}
            </Text>
            <Badge colorPalette={company?.verified ? 'green' : 'gray'} fontSize={{ base: 'sm', md: 'md' }}>
              {company?.verified ? (
                <HStack gap={1}>
                  <Box as={FiCheck} />
                  <Text>Да</Text>
                </HStack>
              ) : (
                'Нет'
              )}
            </Badge>
          </Box>
        </GridItem>
      </Grid>
    </VStack>
  )
}

