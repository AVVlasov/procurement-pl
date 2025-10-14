import React from 'react'
import {
  Box,
  HStack,
  VStack,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react'
import { colors } from '../../utils/colorMode'

export const CompanyCardSkeleton = () => {
  return (
    <Box
      bg={colors.bg.primary}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colors.border.primary}
    >
      <VStack gap={4} align="stretch">
        {/* Header */}
        <HStack gap={4}>
          <SkeletonCircle size="16" />
          <VStack align="start" gap={2} flex={1}>
            <Skeleton height="20px" width="60%" />
            <Skeleton height="16px" width="40%" />
          </VStack>
        </HStack>

        {/* Description */}
        <Skeleton height="16px" width="90%" />

        {/* Info tags */}
        <HStack gap={4}>
          <Skeleton height="16px" width="80px" />
          <Skeleton height="16px" width="60px" />
          <Skeleton height="16px" width="100px" />
        </HStack>

        {/* Badges */}
        <HStack gap={2}>
          <Skeleton height="24px" width="80px" borderRadius="md" />
          <Skeleton height="24px" width="100px" borderRadius="md" />
        </HStack>

        {/* Buttons */}
        <HStack gap={3}>
          <Skeleton height="40px" flex={1} borderRadius="md" />
          <Skeleton height="40px" flex={1} borderRadius="md" />
        </HStack>
      </VStack>
    </Box>
  )
}
