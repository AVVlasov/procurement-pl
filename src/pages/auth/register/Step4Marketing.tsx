import React from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { VStack, Text, Box, Link } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FormSelect } from '../../../components/forms/FormSelect'
import { FormCheckbox } from '../../../components/forms/FormCheckbox'
import { SOURCE_OPTIONS } from '../../../utils/constants'
import type { RegistrationFormData } from '../../../utils/validators/registrationSchema'

interface Step4Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
}

export const Step4Marketing: React.FC<Step4Props> = ({ register, errors }) => {
  const { t } = useTranslation('auth')

  return (
    <VStack gap={6}>
      <Text fontSize="lg" fontWeight="semibold" w="full">
        {t('register.step4.title')}
      </Text>

      <VStack gap={4} w="full">
        <FormSelect
          label={t('register.step4.source')}
          options={SOURCE_OPTIONS}
          {...register('source')}
          error={errors.source?.message}
        />

        <Box borderTop="1px" borderColor="border.default" pt={6} w="full">
          <VStack gap={4} align="flex-start" w="full">
            <FormCheckbox
              label={
                <Text>
                  {t('register.step4.agree_to_terms').split('Пользовательским соглашением')[0]}
                  <Link href="/terms" color="brand.600" target="_blank">
                    Пользовательским соглашением
                  </Link>
                  {' и '}
                  <Link href="/privacy" color="brand.600" target="_blank">
                    Политикой конфиденциальности
                  </Link>
                  {' *'}
                </Text>
              }
              {...register('agreeToTerms', {
                setValueAs: (v) => v === true || v === 'true' || v === 'on',
              })}
              error={errors.agreeToTerms?.message}
            />

            <FormCheckbox
              label={t('register.step4.agree_to_marketing')}
              {...register('agreeToMarketing', {
                setValueAs: (v) => v === true || v === 'true' || v === 'on',
              })}
            />
          </VStack>
        </Box>

        <Box bg="green.50" p={4} borderRadius="md" w="full">
          <Text fontSize="sm" color="green.800">
            {t('register.step4.verification_info')}
          </Text>
        </Box>
      </VStack>
    </VStack>
  )
}

