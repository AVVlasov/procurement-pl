import React, { useState } from 'react'
import { Box, Text, VStack, Button, Input, Field } from '@chakra-ui/react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { FiMail, FiArrowLeft } from 'react-icons/fi'
import { useToast } from '../../../hooks/useToast'

const ForgotPasswordPage = () => {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email.trim()) {
      error(t('forgot_password.email_required'))
      return
    }

    // Валидация email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      error(t('forgot_password.email_invalid'))
      return
    }

    setIsLoading(true)

    try {
      // Имитация отправки запроса
      await new Promise((resolve) => setTimeout(resolve, 1500))

      setIsSubmitted(true)
      success(t('forgot_password.email_sent'))
    } catch (err) {
      error(t('forgot_password.error'))
    } finally {
      setIsLoading(false)
    }
  }

  if (isSubmitted) {
    return (
      <Box
        minH="100vh"
        display="flex"
        alignItems="center"
        justifyContent="center"
        bg="gray.50"
        px={4}
      >
        <Box
          bg="white"
          p={8}
          borderRadius="lg"
          boxShadow="md"
          w="full"
          maxW="md"
        >
          <VStack gap={6} align="stretch">
            <VStack gap={2}>
              <Box
                as={FiMail}
                w={16}
                h={16}
                color="brand.500"
                mx="auto"
              />
              <Text fontSize="2xl" fontWeight="bold" textAlign="center">
                {t('forgot_password.check_email')}
              </Text>
              <Text color="gray.600" textAlign="center">
                {t('forgot_password.instructions_sent', { email })}
              </Text>
            </VStack>

            <VStack gap={3}>
              <Button
                w="full"
                colorPalette="brand"
                onClick={() => navigate('/auth/login')}
              >
                <FiArrowLeft />
                <Text ml={2}>{t('forgot_password.back_to_login')}</Text>
              </Button>

              <Button
                w="full"
                variant="ghost"
                onClick={() => {
                  setIsSubmitted(false)
                  setEmail('')
                }}
              >
                {t('forgot_password.resend')}
              </Button>
            </VStack>
          </VStack>
        </Box>
      </Box>
    )
  }

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      bg="gray.50"
      px={4}
    >
      <Box
        bg="white"
        p={8}
        borderRadius="lg"
        boxShadow="md"
        w="full"
        maxW="md"
      >
        <form onSubmit={handleSubmit}>
          <VStack gap={6} align="stretch">
            <VStack gap={2}>
              <Text fontSize="2xl" fontWeight="bold">
                {t('forgot_password.title')}
              </Text>
              <Text color="gray.600" textAlign="center">
                {t('forgot_password.description')}
              </Text>
            </VStack>

            <Field.Root>
              <Field.Label>{t('forgot_password.email_label')}</Field.Label>
              <Input
                type="email"
                placeholder={t('forgot_password.email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </Field.Root>

            <VStack gap={3}>
              <Button
                type="submit"
                w="full"
                colorPalette="brand"
                loading={isLoading}
              >
                {t('forgot_password.submit')}
              </Button>

              <Link to="/auth/login">
                <Button variant="ghost" w="full">
                  <FiArrowLeft />
                  <Text ml={2}>{t('forgot_password.back_to_login')}</Text>
                </Button>
              </Link>
            </VStack>
          </VStack>
        </form>
      </Box>
    </Box>
  )
}

export { ForgotPasswordPage }

