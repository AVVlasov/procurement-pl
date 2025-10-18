import { useSelector, useDispatch } from 'react-redux'
import { useCallback } from 'react'
import type { RootState, AppDispatch } from '../__data__/store'
import { logout, setCredentials } from '../__data__/slices/authSlice'
import type { AuthResponse } from '../__data__/api/authApi'

/**
 * Hook for accessing auth state and actions
 */
export const useAuth = () => {
  const dispatch = useDispatch<AppDispatch>()
  
  const {
    user,
    company,
    isAuthenticated,
    loading,
    error,
    accessToken,
    refreshToken,
  } = useSelector((state: RootState) => state.auth)
  
  const handleLogin = useCallback((authData: AuthResponse) => {
    dispatch(setCredentials(authData))
  }, [dispatch])
  
  const handleLogout = useCallback(() => {
    dispatch(logout())
  }, [dispatch])
  
  return {
    user: user ? {
      ...user,
      companyId: user.companyId || company?.id,
    } : null,
    company,
    isAuthenticated,
    loading,
    error,
    accessToken,
    refreshToken,
    login: handleLogin,
    logout: handleLogout,
  }
}

