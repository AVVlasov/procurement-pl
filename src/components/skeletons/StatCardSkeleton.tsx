import React from 'react'
import {
  Box,
  Flex,
  VStack,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react'
import { colors } from '../../utils/colorMode'

export const StatCardSkeleton = () => {
  return (
    <Box
      bg={colors.bg.primary}
      p={6}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colors.border.primary}
    >
      <Flex justify="space-between" align="center">
        <VStack align="start" gap={3}>
          <Skeleton height="16px" width="120px" />
          <Skeleton height="32px" width="80px" />
          <Skeleton height="14px" width="100px" />
        </VStack>
        <SkeletonCircle size="12" />
      </Flex>
    </Box>
  )
}
