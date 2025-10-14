import React from 'react'
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { VStack, HStack, Button, Text, Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '../../../components/forms/FormInput'
import { FormSelect } from '../../../components/forms/FormSelect'
import { useLazyCheckINNQuery } from '../../../__data__/api/companiesApi'
import { useToast } from '../../../hooks/useToast'
import { INDUSTRIES, COMPANY_SIZES, LEGAL_FORMS } from '../../../utils/constants'
import type { RegistrationFormData } from '../../../utils/validators/registrationSchema'

interface Step1Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

export const Step1CompanyInfo: React.FC<Step1Props> = ({ register, errors, setValue, watch }) => {
  const { t } = useTranslation('auth')
  const toast = useToast()
  const [checkINN, { isLoading: isAutoFilling }] = useLazyCheckINNQuery()
  const inn = watch('inn')

  const handleAutoFill = async () => {
    if (!inn || inn.length !== 10) {
      toast.error(t('register.step1.auto_fill_error'), 'Введите корректный ИНН (10 цифр)')
      return
    }

    try {
      const result = await checkINN(inn).unwrap()
      
      if (result.data) {
        setValue('fullName', result.data.name || '')
        setValue('ogrn', result.data.ogrn || '')
        setValue('legalForm', result.data.legal_form || '')
        toast.success(t('register.step1.auto_fill_success'))
      }
    } catch {
      toast.error(t('register.step1.auto_fill_error'))
    }
  }

  return (
    <VStack gap={{ base: 4, md: 6 }}>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" w="full">
        {t('register.step1.title')}
      </Text>

      <VStack gap={{ base: 3, md: 4 }} w="full">
        <VStack gap={2} w="full">
          <HStack gap={{ base: 2, md: 4 }} w="full" align="flex-start" flexWrap="wrap">
            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormInput
                label={t('register.step1.inn') + ' *'}
                placeholder="1234567890"
                maxLength={10}
                {...register('inn')}
                error={errors.inn?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
            <Button
              onClick={handleAutoFill}
              loading={isAutoFilling ? true : undefined}
              disabled={!inn || inn.length !== 10}
              mt={{ base: 0, md: 7 }}
              size={{ base: 'sm', md: 'md' }}
              flexShrink={0}
              w={{ base: 'full', md: 'auto' }}
            >
              {isAutoFilling ? t('register.step1.auto_fill_loading') : t('register.step1.auto_fill')}
            </Button>
          </HStack>

          <Text fontSize={{ base: 'xs', md: 'sm' }} color="fg.muted" w="full">
            {t('register.step1.auto_fill_hint')}
          </Text>
        </VStack>

        <VStack gap={{ base: 3, md: 4 }} w="full">
          <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormInput
                label={t('register.step1.ogrn') + ' *'}
                placeholder="1234567890123"
                {...register('ogrn')}
                error={errors.ogrn?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>

            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormInput
                label={t('register.step1.full_name') + ' *'}
                placeholder="ООО 'Название компании'"
                {...register('fullName')}
                error={errors.fullName?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </HStack>

          <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormInput
                label={t('register.step1.short_name')}
                placeholder="Название"
                {...register('shortName')}
                error={errors.shortName?.message}
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>

            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormSelect
                label={t('register.step1.legal_form') + ' *'}
                options={LEGAL_FORMS}
                value={watch('legalForm') || ''}
                onChange={(value) => setValue('legalForm', value)}
                placeholder={t('common:labels.select')}
                error={errors.legalForm?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </HStack>

          <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormSelect
                label={t('register.step1.industry') + ' *'}
                options={INDUSTRIES}
                value={watch('industry') || ''}
                onChange={(value) => setValue('industry', value)}
                placeholder={t('common:labels.select')}
                error={errors.industry?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>

            <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
              <FormSelect
                label={t('register.step1.company_size') + ' *'}
                options={COMPANY_SIZES}
                value={watch('companySize') || ''}
                onChange={(value) => setValue('companySize', value)}
                placeholder={t('common:labels.select')}
                error={errors.companySize?.message}
                required
                size={{ base: 'sm', md: 'md' }}
              />
            </Box>
          </HStack>

          <Box w="full">
            <FormInput
              label={t('register.step1.website') + ' *'}
              type="url"
              placeholder="https://example.com"
              {...register('website')}
              error={errors.website?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>
        </VStack>
      </VStack>
    </VStack>
  )
}

