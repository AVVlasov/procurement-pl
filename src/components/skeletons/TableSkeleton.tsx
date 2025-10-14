import React from 'react'
import {
  Box,
  VStack,
  HStack,
  Skeleton,
} from '@chakra-ui/react'
import { colors } from '../../utils/colorMode'

interface TableSkeletonProps {
  rows?: number
  columns?: number
}

export const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => {
  return (
    <Box
      bg={colors.bg.primary}
      borderRadius="lg"
      borderWidth="1px"
      borderColor={colors.border.primary}
      overflow="hidden"
    >
      <VStack gap={0} align="stretch">
        {/* Header */}
        <HStack
          gap={4}
          p={4}
          borderBottomWidth="1px"
          borderColor={colors.border.primary}
          bg={colors.bg.secondary}
        >
          {[...Array(columns)].map((_, index) => (
            <Skeleton key={index} height="20px" flex={1} />
          ))}
        </HStack>

        {/* Rows */}
        {[...Array(rows)].map((_, rowIndex) => (
          <HStack
            key={rowIndex}
            gap={4}
            p={4}
            borderBottomWidth={rowIndex < rows - 1 ? '1px' : 0}
            borderColor={colors.border.primary}
          >
            {[...Array(columns)].map((_, colIndex) => (
              <Skeleton key={colIndex} height="16px" flex={1} />
            ))}
          </HStack>
        ))}
      </VStack>
    </Box>
  )
}
