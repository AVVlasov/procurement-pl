import React, { useEffect } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { Spinner, Center } from '@chakra-ui/react'
import { isTokenExpired } from '../utils/jwt'

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, loading, accessToken, logout } = useAuth()
  const location = useLocation()

  // Check if token has expired
  useEffect(() => {
    if (accessToken && isTokenExpired(accessToken)) {
      console.log('Token expired, logging out...')
      logout()
    }
  }, [accessToken, logout])

  if (loading) {
    return (
      <Center h="100vh">
        <Spinner size="xl" />
      </Center>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page but save the attempted location
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  // Check if token is expired (double check)
  if (accessToken && isTokenExpired(accessToken)) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

