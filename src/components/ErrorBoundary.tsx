import React, { Component, ErrorInfo, ReactNode } from 'react'
import {
  Box,
  VStack,
  Heading,
  Text,
  Button,
  Container,
} from '@chakra-ui/react'
import { FiAlertTriangle } from 'react-icons/fi'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  handleReset = (): void => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  handleReload = (): void => {
    window.location.reload()
  }

  render(): ReactNode {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <Container maxW="container.md" py={20}>
          <Box
            bg="white"
            p={8}
            borderRadius="lg"
            shadow="lg"
            borderWidth="1px"
            borderColor="red.200"
          >
            <VStack gap={6} align="center">
              <Box color="red.500" fontSize="64px">
                <FiAlertTriangle />
              </Box>
              
              <VStack gap={2}>
                <Heading size="lg" color="red.600">
                  Что-то пошло не так
                </Heading>
                <Text color="gray.600" textAlign="center">
                  Произошла непредвиденная ошибка. Попробуйте обновить страницу.
                </Text>
              </VStack>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <Box
                  w="full"
                  p={4}
                  bg="red.50"
                  borderRadius="md"
                  borderWidth="1px"
                  borderColor="red.200"
                >
                  <Text fontSize="sm" fontFamily="mono" color="red.800">
                    {this.state.error.toString()}
                  </Text>
                  {this.state.errorInfo && (
                    <Text
                      fontSize="xs"
                      fontFamily="mono"
                      color="red.600"
                      mt={2}
                      whiteSpace="pre-wrap"
                    >
                      {this.state.errorInfo.componentStack}
                    </Text>
                  )}
                </Box>
              )}

              <VStack gap={3} w="full">
                <Button
                  colorPalette="red"
                  size="lg"
                  w="full"
                  onClick={this.handleReload}
                >
                  Обновить страницу
                </Button>
                <Button
                  variant="outline"
                  colorPalette="red"
                  size="lg"
                  w="full"
                  onClick={this.handleReset}
                >
                  Попробовать снова
                </Button>
              </VStack>
            </VStack>
          </Box>
        </Container>
      )
    }

    return this.props.children
  }
}

