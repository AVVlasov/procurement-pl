import React from 'react'
import { UseFormRegister, FieldErrors } from 'react-hook-form'
import { VStack, HStack, Text, Box } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '../../../components/forms/FormInput'
import type { RegistrationFormData } from '../../../utils/validators/registrationSchema'

interface Step2Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
}

export const Step2ContactPerson: React.FC<Step2Props> = ({ register, errors }) => {
  const { t } = useTranslation('auth')

  return (
    <VStack gap={{ base: 4, md: 6 }}>
      <Text fontSize={{ base: 'md', md: 'lg' }} fontWeight="semibold" w="full">
        {t('register.step2.title')}
      </Text>

      <VStack gap={{ base: 3, md: 4 }} w="full">
        <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.last_name') + ' *'}
              {...register('lastName')}
              error={errors.lastName?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>

          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.first_name') + ' *'}
              {...register('firstName')}
              error={errors.firstName?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>
        </HStack>

        <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.middle_name')}
              {...register('middleName')}
              error={errors.middleName?.message}
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>

          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.position') + ' *'}
              {...register('position')}
              error={errors.position?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>
        </HStack>

        <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.phone') + ' *'}
              type="tel"
              placeholder="+7 (999) 123-45-67"
              {...register('phone')}
              error={errors.phone?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>

          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.email') + ' *'}
              type="email"
              placeholder="name@company.com"
              {...register('email')}
              error={errors.email?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>
        </HStack>

        <HStack gap={{ base: 2, md: 4 }} w="full" flexWrap="wrap">
          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.password') + ' *'}
              type="password"
              placeholder="Минимум 8 символов"
              {...register('password')}
              error={errors.password?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>

          <Box flex={{ base: '1', md: '1' }} minW={{ base: '200px', md: 'auto' }}>
            <FormInput
              label={t('register.step2.confirm_password') + ' *'}
              type="password"
              {...register('confirmPassword')}
              error={errors.confirmPassword?.message}
              required
              size={{ base: 'sm', md: 'md' }}
            />
          </Box>
        </HStack>

        <Box bg="blue.50" p={{ base: 3, md: 4 }} borderRadius="md" w="full">
          <Text fontSize={{ base: 'xs', md: 'sm' }} color="blue.800">
            <strong>Важно:</strong> {t('register.step2.corporate_email_hint')}
          </Text>
        </Box>
      </VStack>
    </VStack>
  )
}

