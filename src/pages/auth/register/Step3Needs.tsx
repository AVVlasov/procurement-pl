import React, { useState } from 'react'
import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch } from 'react-hook-form'
import { VStack, Text, SimpleGrid } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FormCheckbox } from '../../../components/forms/FormCheckbox'
import { FormTextarea } from '../../../components/forms/FormTextarea'
import { PLATFORM_GOALS, INDUSTRIES, GEOGRAPHY_OPTIONS } from '../../../utils/constants'
import type { RegistrationFormData } from '../../../utils/validators/registrationSchema'

interface Step3Props {
  register: UseFormRegister<RegistrationFormData>;
  errors: FieldErrors<RegistrationFormData>;
  setValue: UseFormSetValue<RegistrationFormData>;
  watch: UseFormWatch<RegistrationFormData>;
}

export const Step3Needs: React.FC<Step3Props> = ({ register, errors, setValue }) => {
  const { t } = useTranslation('auth')
  const [selectedGoals, setSelectedGoals] = useState<string[]>([])
  const [selectedIndustries, setSelectedIndustries] = useState<string[]>([])
  const [selectedGeography, setSelectedGeography] = useState<string[]>([])

  const handleGoalChange = (goal: string) => {
    const updated = selectedGoals.includes(goal)
      ? selectedGoals.filter((g) => g !== goal)
      : [...selectedGoals, goal]
    
    setSelectedGoals(updated)
    setValue('platformGoals', updated)
  }

  const handleIndustryChange = (industry: string) => {
    const updated = selectedIndustries.includes(industry)
      ? selectedIndustries.filter((i) => i !== industry)
      : [...selectedIndustries, industry]
    
    setSelectedIndustries(updated)
    setValue('partnerIndustries', updated)
  }

  const handleGeographyChange = (geo: string) => {
    const updated = selectedGeography.includes(geo)
      ? selectedGeography.filter((g) => g !== geo)
      : [...selectedGeography, geo]
    
    setSelectedGeography(updated)
    setValue('partnerGeography', updated)
  }

  return (
    <VStack gap={6}>
      <Text fontSize="lg" fontWeight="semibold" w="full">
        {t('register.step3.title')}
      </Text>

      <VStack gap={4} w="full">
        <VStack align="flex-start" w="full">
          <Text fontWeight="medium">{t('register.step3.platform_goals')} *</Text>
          <VStack align="flex-start" gap={2} w="full">
            {PLATFORM_GOALS.map((goal) => (
              <FormCheckbox
                key={goal.value}
                label={goal.label}
                checked={selectedGoals.includes(goal.value)}
                onChange={() => handleGoalChange(goal.value)}
              />
            ))}
          </VStack>
          {errors.platformGoals && (
            <Text color="red.500" fontSize="sm">{errors.platformGoals.message}</Text>
          )}
        </VStack>

        <FormTextarea
          label={t('register.step3.products_offered') + ' *'}
          rows={3}
          placeholder="Опишите кратко основные продукты или услуги"
          {...register('productsOffered')}
          error={errors.productsOffered?.message}
          required
        />

        <FormTextarea
          label={t('register.step3.products_needed') + ' *'}
          rows={3}
          placeholder="Опишите, что вы хотите приобрести"
          {...register('productsNeeded')}
          error={errors.productsNeeded?.message}
          required
        />

        <VStack align="flex-start" w="full">
          <Text fontWeight="medium">{t('register.step3.partner_industries')}</Text>
          <SimpleGrid columns={2} gap={2} w="full">
            {INDUSTRIES.map((industry) => (
              <FormCheckbox
                key={industry.value}
                label={industry.label}
                checked={selectedIndustries.includes(industry.value)}
                onChange={() => handleIndustryChange(industry.value)}
              />
            ))}
          </SimpleGrid>
        </VStack>

        <VStack align="flex-start" w="full">
          <Text fontWeight="medium">{t('register.step3.partner_geography')}</Text>
          <VStack align="flex-start" gap={2} w="full">
            {GEOGRAPHY_OPTIONS.map((geo) => (
              <FormCheckbox
                key={geo.value}
                label={geo.label}
                checked={selectedGeography.includes(geo.value)}
                onChange={() => handleGeographyChange(geo.value)}
              />
            ))}
          </VStack>
        </VStack>
      </VStack>
    </VStack>
  )
}

