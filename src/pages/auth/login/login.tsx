import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { Box, Button, Container, Heading, Text, VStack, HStack } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { FormInput } from '../../../components/forms/FormInput'
import { FormCheckbox } from '../../../components/forms/FormCheckbox'
import { useLoginMutation } from '../../../__data__/api/authApi'
import { useAuth } from '../../../hooks/useAuth'
import { useToast } from '../../../hooks/useToast'
import { loginSchema, type LoginFormData } from '../../../utils/validators/registrationSchema'

export const Login: React.FC = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const location = useLocation()
  const { login } = useAuth()
  const toast = useToast()
  const [loginMutation, { isLoading }] = useLoginMutation()

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      const result = await loginMutation(data).unwrap()
      login(result, data.rememberMe)
      toast.success(t('login.success'))
      
      // Redirect to the page they tried to visit or dashboard
      const from = (location.state as any)?.from?.pathname || '/dashboard'
      navigate(from, { replace: true })
    } catch (error: any) {
      toast.error(t('login.error'), error?.data?.message)
    }
  }

  return (
    <Container maxW="md" py={12}>
      <VStack gap={8}>
        <VStack gap={2} textAlign="center">
          <Heading size="2xl">{t('login.title')}</Heading>
        </VStack>

        <Box w="full" bg="bg.surface" p={8} borderRadius="l3" borderWidth="1px">
          <form onSubmit={handleSubmit(onSubmit)}>
            <VStack gap={4}>
              <FormInput
                label={t('login.email')}
                type="email"
                placeholder="name@company.com"
                {...register('email')}
                error={errors.email?.message}
                required
              />

              <FormInput
                label={t('login.password')}
                type="password"
                placeholder="••••••••"
                {...register('password')}
                error={errors.password?.message}
                required
              />

              <HStack w="full" justify="space-between">
                <FormCheckbox label={t('login.remember_me')} {...register('rememberMe')} />
                <Link to="/auth/forgot-password">
                  <Text color="brand.600" fontSize="sm">
                    {t('login.forgot_password')}
                  </Text>
                </Link>
              </HStack>

              <Button
                type="submit"
                w="full"
                size="lg"
                colorPalette="brand"
                loading={isLoading ? true : undefined}
              >
                {t('login.button')}
              </Button>

              <HStack>
                <Text fontSize="sm" color="fg.muted">
                  {t('login.no_account')}
                </Text>
                <Link to="/auth/register">
                  <Text fontSize="sm" color="brand.600" fontWeight="medium">
                    {t('login.register')}
                  </Text>
                </Link>
              </HStack>
            </VStack>
          </form>
        </Box>
      </VStack>
    </Container>
  )
}

