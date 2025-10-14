import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Grid,
  GridItem,
  Skeleton,
  SkeletonCircle,
} from '@chakra-ui/react'

export const ProfileSkeleton = () => {
  return (
    <VStack gap={6} align="stretch">
      {/* Header */}
      <HStack justify="space-between">
        <Skeleton height="32px" width="200px" />
        <Skeleton height="40px" width="120px" />
      </HStack>

      {/* Logo Section */}
      <Box>
        <Skeleton height="20px" width="100px" mb={3} />
        <SkeletonCircle size="32" />
      </Box>

      {/* Grid Fields */}
      <Grid templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} gap={6}>
        {[...Array(8)].map((_, index) => (
          <GridItem key={index}>
            <Skeleton height="20px" width="150px" mb={2} />
            <Skeleton height="24px" width="100%" />
          </GridItem>
        ))}
      </Grid>
    </VStack>
  )
}
