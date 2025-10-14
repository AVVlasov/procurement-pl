import React, { useEffect, useState } from 'react'
import { Box, Text, VStack, keyframes } from '@chakra-ui/react'
import { FiCheckCircle } from 'react-icons/fi'

const scaleIn = keyframes`
  0% { transform: scale(0); opacity: 0; }
  50% { transform: scale(1.1); }
  100% { transform: scale(1); opacity: 1; }
`

const checkmark = keyframes`
  0% { stroke-dashoffset: 100; }
  100% { stroke-dashoffset: 0; }
`

interface SuccessAnimationProps {
  message?: string
  onComplete?: () => void
  duration?: number
  size?: number
}

export const SuccessAnimation = ({
  message = 'Успешно!',
  onComplete,
  duration = 2000,
  size = 120,
}: SuccessAnimationProps) => {
  const [show, setShow] = useState(true)

  useEffect(() => {
    if (onComplete) {
      const timer = setTimeout(() => {
        setShow(false)
        onComplete()
      }, duration)
      return () => clearTimeout(timer)
    }
  }, [onComplete, duration])

  if (!show && onComplete) return null

  return (
    <VStack gap={4} py={8}>
      <Box
        w={size}
        h={size}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="green.100"
        color="green.500"
        animation={`${scaleIn} 0.5s ease-out`}
      >
        <FiCheckCircle size={size * 0.6} />
      </Box>
      <Text
        fontSize="xl"
        fontWeight="bold"
        color="green.600"
        animation={`${scaleIn} 0.5s ease-out 0.2s backwards`}
      >
        {message}
      </Text>
    </VStack>
  )
}

