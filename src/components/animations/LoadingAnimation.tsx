import React from 'react'
import { Box, Text, VStack } from '@chakra-ui/react'
import Lottie from 'lottie-react'

// Inline animation data for loading (simple spinner)
const loadingAnimationData = {
  v: '5.7.4',
  fr: 60,
  ip: 0,
  op: 60,
  w: 200,
  h: 200,
  nm: 'Loading',
  ddd: 0,
  assets: [],
  layers: [
    {
      ddd: 0,
      ind: 1,
      ty: 4,
      nm: 'Circle',
      sr: 1,
      ks: {
        o: { a: 0, k: 100 },
        r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 60 }] },
        p: { a: 0, k: [100, 100, 0] },
        a: { a: 0, k: [0, 0, 0] },
        s: { a: 0, k: [100, 100, 100] },
      },
      ao: 0,
      shapes: [
        {
          ty: 'gr',
          it: [
            {
              ty: 'el',
              p: { a: 0, k: [0, 0] },
              s: { a: 0, k: [80, 80] },
            },
            {
              ty: 'st',
              c: { a: 0, k: [0.2, 0.4, 1, 1] },
              o: { a: 0, k: 100 },
              w: { a: 0, k: 8 },
              lc: 2,
              lj: 1,
              ml: 4,
            },
            {
              ty: 'tr',
              p: { a: 0, k: [0, 0] },
              a: { a: 0, k: [0, 0] },
              s: { a: 0, k: [100, 100] },
              r: { a: 0, k: 0 },
              o: { a: 0, k: 100 },
              sk: { a: 0, k: 0 },
              sa: { a: 0, k: 0 },
            },
          ],
        },
      ],
    },
  ],
}

interface LoadingAnimationProps {
  message?: string
  size?: number
}

export const LoadingAnimation = ({ message, size = 200 }: LoadingAnimationProps) => {
  return (
    <VStack gap={4}>
      <Box w={size} h={size}>
        <Lottie animationData={loadingAnimationData} loop={true} />
      </Box>
      {message && (
        <Text fontSize="lg" color="gray.600" textAlign="center">
          {message}
        </Text>
      )}
    </VStack>
  )
}

