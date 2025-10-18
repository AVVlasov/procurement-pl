import React, { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { Box, Button, Container, Heading, VStack, HStack, Text } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FiCheck } from 'react-icons/fi'
import { useRegisterMutation } from '../../../__data__/api/authApi'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { registrationSchema, type RegistrationFormData } from '../../../utils/validators/registrationSchema'
import { Step1CompanyInfo } from './Step1CompanyInfo'
import { Step2ContactPerson } from './Step2ContactPerson'
import { Step3Needs } from './Step3Needs'
import { Step4Marketing } from './Step4Marketing'

const STEPS = [
  { id: 1, key: 'company_info' },
  { id: 2, key: 'contact_person' },
  { id: 3, key: 'needs' },
  { id: 4, key: 'completion' },
]

const STEP_FIELDS: Record<number, (keyof RegistrationFormData)[]> = {
  1: ['inn', 'ogrn', 'fullName', 'legalForm', 'industry', 'companySize', 'website'],
  2: ['firstName', 'lastName', 'position', 'phone', 'email', 'password', 'confirmPassword'],
  3: ['platformGoals', 'productsOffered', 'productsNeeded'],
  4: ['agreeToTerms'],
}

export const Register: React.FC = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { login } = useAuth()
  const toast = useToast()
  const [currentStep, setCurrentStep] = useState(1)
  const [registerMutation, { isLoading }] = useRegisterMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
    trigger,
  } = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    mode: 'onBlur',
    defaultValues: {
      inn: '',
      ogrn: '',
      fullName: '',
      shortName: '',
      legalForm: '',
      industry: '',
      companySize: '',
      website: '',
      firstName: '',
      lastName: '',
      middleName: '',
      position: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: '',
      platformGoals: [],
      productsOffered: '',
      productsNeeded: '',
      partnerIndustries: [],
      partnerGeography: [],
      source: '',
      agreeToTerms: false,
      agreeToMarketing: false,
    },
  })

  const handleNext = async () => {
    const fieldsToValidate = STEP_FIELDS[currentStep]
    const isValid = await trigger(fieldsToValidate as any)
    
    if (!isValid) {
      toast.error('Ошибка валидации', 'Пожалуйста, заполните все обязательные поля')
      return
    }
    
    if (currentStep < STEPS.length) {
      setCurrentStep((prev) => prev + 1)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1)
    }
  }

  const onSubmit = async (data: RegistrationFormData) => {
    try {
      const result = await registerMutation(data).unwrap()
      login(result)
      toast.success(t('register.success'))
      navigate('/dashboard')
    } catch (error: any) {
      toast.error(t('register.error'), error?.data?.message)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return <Step1CompanyInfo register={register} errors={errors} setValue={setValue} watch={watch} />
      case 2:
        return <Step2ContactPerson register={register} errors={errors} />
      case 3:
        return <Step3Needs register={register} errors={errors} setValue={setValue} watch={watch} />
      case 4:
        return <Step4Marketing register={register} errors={errors} />
      default:
        return null
    }
  }

  return (
    <Container maxW="4xl" py={{ base: 4, md: 8 }} px={{ base: 2, md: 4 }}>
      <VStack gap={{ base: 6, md: 8 }}>
        <Heading size={{ base: 'xl', md: '2xl' }} textAlign="center">
          {t('register.title')}
        </Heading>

        {/* Progress bar */}
        <Box w="full" overflowX="auto">
          <HStack gap={0} justify="space-between" minW="max-content">
            {STEPS.map((step, index) => {
              const isPassed = currentStep > step.id
              const isCurrent = currentStep === step.id
              
              return (
                <HStack key={step.id} flex={index < STEPS.length - 1 ? "1" : "0 0 auto"} gap={0}>
                  <VStack gap={2} flex="0 0 auto">
                    <Box
                      w={{ base: 8, md: 10 }}
                      h={{ base: 8, md: 10 }}
                      borderRadius="full"
                      display="flex"
                      alignItems="center"
                      justifyContent="center"
                      backgroundColor={
                        isPassed ? 'green.500' : 
                        isCurrent ? 'orange.500' : 
                        'gray.200'
                      }
                      color={isPassed || isCurrent ? 'white' : 'gray.600'}
                      fontWeight="bold"
                      transition="all 0.3s"
                      fontSize={{ base: 'sm', md: 'md' }}
                    >
                      {isPassed ? (
                        <Box as={FiCheck} boxSize={{ base: 4, md: 5 }} />
                      ) : (
                        step.id
                      )}
                    </Box>
                    <Text 
                      fontSize={{ base: '2xs', md: 'xs' }} 
                      textAlign="center" 
                      color={isCurrent ? 'brand.600' : 'fg.muted'}
                      fontWeight={isCurrent ? 'semibold' : 'normal'}
                      whiteSpace="nowrap"
                      maxW={{ base: '60px', md: '80px' }}
                      lineClamp={2}
                    >
                      {t(`register.steps.${step.key}`)}
                    </Text>
                  </VStack>
                  {index < STEPS.length - 1 && (
                    <Box
                      flex="1"
                      h="1"
                      bg={currentStep > step.id ? 'green.500' : 'gray.200'}
                      mx={{ base: 1, md: 2 }}
                      mt={{ base: 4, md: 5 }}
                      transition="all 0.3s"
                      minW="20px"
                    />
                  )}
                </HStack>
              )
            })}
          </HStack>
        </Box>

        {/* Form */}
        <Box 
          w="full" 
          bg="bg.surface" 
          p={{ base: 4, md: 8 }} 
          borderRadius={{ base: 'lg', md: 'l3' }} 
          borderWidth="1px"
        >
          <form onSubmit={handleSubmit(onSubmit)}>
            {renderStep()}

            {/* Navigation buttons */}
            <HStack 
              mt={{ base: 6, md: 8 }} 
              justify="space-between" 
              flexWrap="wrap"
              gap={2}
            >
              <Button
                onClick={handleBack}
                disabled={currentStep === 1}
                variant="outline"
                size={{ base: 'sm', md: 'md' }}
                flex={{ base: '1', md: '0 0 auto' }}
                minW={{ base: '120px', md: 'auto' }}
              >
                {t('common:buttons.back')}
              </Button>

              {currentStep < STEPS.length ? (
                <Button 
                  onClick={handleNext} 
                  colorPalette="brand"
                  size={{ base: 'sm', md: 'md' }}
                  flex={{ base: '1', md: '0 0 auto' }}
                  minW={{ base: '120px', md: 'auto' }}
                >
                  {t('common:buttons.next')}
                </Button>
              ) : (
                <Button
                  type="submit"
                  colorPalette="brand"
                  loading={isLoading ? true : undefined}
                  size={{ base: 'sm', md: 'md' }}
                  flex={{ base: '1', md: '0 0 auto' }}
                  minW={{ base: '120px', md: 'auto' }}
                >
                  {isLoading ? t('register.step4.registering') : t('register.step4.button')}
                </Button>
              )}
            </HStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}

