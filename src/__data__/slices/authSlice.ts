import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse } from '../api/authApi'
import { storageUtils } from '../../utils/storage'
import { isTokenExpired } from '../../utils/jwt'

interface AuthState {
  user: AuthResponse['user'] | null;
  company: AuthResponse['company'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Check if string contains invalid UTF-8/encoding issues
const hasEncodingIssues = (str: string): boolean => {
  // Only check for the replacement character (common sign of encoding corruption)
  return /[\uFFFD]/.test(str)
}

// Load initial state from localStorage
const loadTokensFromStorage = () => {
  if (typeof window !== 'undefined') {
    try {
      const accessToken = storageUtils.getString('accessToken')
      const refreshToken = storageUtils.getString('refreshToken')
      const userJson = storageUtils.getString('user')
      const companyJson = storageUtils.getString('company')
      
      // Parse with explicit UTF-8 handling
      let user = null
      let company = null
      
      if (userJson) {
        try {
          // Check for encoding issues before parsing
          if (hasEncodingIssues(userJson)) {
            console.warn('User data has encoding issues, clearing localStorage')
            storageUtils.clear()
            return {
              accessToken: null,
              refreshToken: null,
              user: null,
              company: null,
              isAuthenticated: false,
            }
          }
          user = JSON.parse(userJson)
          // Check if parsed user has encoding issues in firstName/lastName
          if (user && (
            (user.firstName && hasEncodingIssues(user.firstName)) ||
            (user.lastName && hasEncodingIssues(user.lastName))
          )) {
            console.warn('User name has encoding issues, clearing localStorage')
            storageUtils.clear()
            return {
              accessToken: null,
              refreshToken: null,
              user: null,
              company: null,
              isAuthenticated: false,
            }
          }
        } catch (e) {
          console.error('Failed to parse user data:', e)
          storageUtils.clear()
          user = null
        }
      }
      
      if (companyJson) {
        try {
          company = JSON.parse(companyJson)
        } catch (e) {
          console.error('Failed to parse company data:', e)
          company = null
        }
      }
      
      // Always restore session tokens if they exist and not expired
      if (accessToken && user && !isTokenExpired(accessToken)) {
        return {
          accessToken,
          refreshToken,
          user,
          company,
          isAuthenticated: true,
        }
      }
      
      // If token is expired, clear it
      if (accessToken && isTokenExpired(accessToken)) {
        console.log('Token expired, clearing storage')
        storageUtils.clear()
      }
      
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        company: null,
        isAuthenticated: false,
      }
    } catch (error) {
      console.error('Error loading tokens from storage:', error)
      return {
        accessToken: null,
        refreshToken: null,
        user: null,
        company: null,
        isAuthenticated: false,
      }
    }
  }
  
  return {
    accessToken: null,
    refreshToken: null,
    user: null,
    company: null,
    isAuthenticated: false,
  }
}

const initialState: AuthState = {
  ...loadTokensFromStorage(),
  loading: false,
  error: null,
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials: (state, action: PayloadAction<AuthResponse>) => {
      state.user = action.payload.user
      state.company = action.payload.company
      state.accessToken = action.payload.tokens.accessToken
      state.refreshToken = action.payload.tokens.refreshToken
      state.isAuthenticated = true
      state.error = null
      
      // Always save tokens to localStorage for current session
      if (typeof window !== 'undefined') {
        storageUtils.setString('accessToken', action.payload.tokens.accessToken)
        storageUtils.setString('refreshToken', action.payload.tokens.refreshToken)
        storageUtils.setString('user', JSON.stringify(action.payload.user))
        storageUtils.setString('company', JSON.stringify(action.payload.company))
      }
    },
    
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        storageUtils.setString('accessToken', action.payload.accessToken)
        storageUtils.setString('refreshToken', action.payload.refreshToken)
      }
    },
    
    logout: (state) => {
      state.user = null
      state.company = null
      state.accessToken = null
      state.refreshToken = null
      state.isAuthenticated = false
      state.error = null
      
      // Clear localStorage
      if (typeof window !== 'undefined') {
        storageUtils.remove('accessToken')
        storageUtils.remove('refreshToken')
        storageUtils.remove('user')
        storageUtils.remove('company')
      }
    },
    
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
    
    clearError: (state) => {
      state.error = null
    },
    
    updateUser: (state, action: PayloadAction<Partial<AuthResponse['user']>>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload }
        
        // Update localStorage
        if (typeof window !== 'undefined') {
          storageUtils.setString('user', JSON.stringify(state.user))
        }
      }
    },
  },
})

export const { setCredentials, setTokens, logout, setLoading, setError, clearError, updateUser } = authSlice.actions
export default authSlice.reducer

