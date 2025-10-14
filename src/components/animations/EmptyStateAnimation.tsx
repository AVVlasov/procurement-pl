import React from 'react'
import { Box, Text, VStack, Button } from '@chakra-ui/react'
import { FiInbox } from 'react-icons/fi'

interface EmptyStateAnimationProps {
  title: string
  description?: string
  actionLabel?: string
  onAction?: () => void
  size?: number
}

export const EmptyStateAnimation = ({
  title,
  description,
  actionLabel,
  onAction,
  size = 120,
}: EmptyStateAnimationProps) => {
  return (
    <VStack gap={6} py={12}>
      <Box
        w={size}
        h={size}
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="full"
        bg="gray.100"
        color="gray.400"
      >
        <FiInbox size={size * 0.5} />
      </Box>
      <VStack gap={2}>
        <Text fontSize="xl" fontWeight="bold" color="gray.700">
          {title}
        </Text>
        {description && (
          <Text fontSize="md" color="gray.500" textAlign="center" maxW="400px">
            {description}
          </Text>
        )}
      </VStack>
      {actionLabel && onAction && (
        <Button colorPalette="brand" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </VStack>
  )
}

