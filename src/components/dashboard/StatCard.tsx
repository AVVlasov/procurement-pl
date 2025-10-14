import React from 'react'
import {
  Box,
  Flex,
  VStack,
  Text,
} from '@chakra-ui/react'
import { colors } from '../../utils/colorMode'

interface StatCardProps {
  title: string
  value: string | number
  icon: React.ElementType
  change?: number
  changeLabel?: string
  colorPalette?: string
}

export const StatCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeLabel,
  colorPalette = 'brand',
}: StatCardProps) => {
  const colorMap: Record<string, { bg: string; color: string }> = {
    brand: { bg: 'orange.50', color: 'orange.500' },
    blue: { bg: 'blue.50', color: 'blue.500' },
    green: { bg: 'green.50', color: 'green.500' },
    orange: { bg: 'orange.50', color: 'orange.500' },
    yellow: { bg: 'yellow.50', color: 'yellow.500' },
    purple: { bg: 'purple.50', color: 'purple.500' },
    red: { bg: 'red.50', color: 'red.500' },
  }

  const iconColors = colorMap[colorPalette] || colorMap.brand

  return (
    <Box
      bg={colors.bg.primary}
      p={{ base: 4, md: 6 }}
      borderRadius="lg"
      shadow="sm"
      borderWidth="1px"
      borderColor={colors.border.primary}
      transition="all 0.2s ease-in-out"
      _hover={{
        shadow: 'md',
        transform: 'translateY(-2px)',
        borderColor: iconColors.color,
      }}
      minH={{ base: '120px', md: '140px' }}
    >
      <Flex justify="space-between" align="flex-start" h="full">
        <VStack align="start" gap={1} flex="1" minW={0}>
          <Text 
            fontSize={{ base: 'xs', md: 'sm' }} 
            color="gray.500" 
            fontWeight="medium"
            lineClamp={2}
          >
            {title}
          </Text>
          <Text 
            fontSize={{ base: '2xl', md: '3xl' }} 
            fontWeight="bold" 
            mt={2}
            lineClamp={1}
          >
            {value}
          </Text>
          {change !== undefined && (
            <Flex align="center" mt={2} flexWrap="wrap">
              <Text
                fontSize={{ base: 'xs', md: 'sm' }}
                color={change >= 0 ? 'green.500' : 'red.500'}
                fontWeight="medium"
              >
                {change >= 0 ? '↑' : '↓'} {Math.abs(change)}%
              </Text>
              {changeLabel && (
                <Text 
                  ml={1} 
                  fontSize={{ base: 'xs', md: 'sm' }} 
                  color="gray.500"
                  display={{ base: 'none', sm: 'inline' }}
                >
                  {changeLabel}
                </Text>
              )}
            </Flex>
          )}
        </VStack>
        <Flex
          w={{ base: 10, md: 12 }}
          h={{ base: 10, md: 12 }}
          align="center"
          justify="center"
          borderRadius="lg"
          bg={iconColors.bg}
          flexShrink={0}
          ml={2}
        >
          <Box as={Icon} w={{ base: 5, md: 6 }} h={{ base: 5, md: 6 }} color={iconColors.color} />
        </Flex>
      </Flex>
    </Box>
  )
}
