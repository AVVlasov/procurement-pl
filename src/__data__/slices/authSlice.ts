import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import type { AuthResponse } from '../api/authApi'

interface AuthState {
  user: AuthResponse['user'] | null;
  company: AuthResponse['company'] | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

// Load initial state from localStorage
const loadTokensFromStorage = () => {
  if (typeof window !== 'undefined') {
    const accessToken = localStorage.getItem('accessToken')
    const refreshToken = localStorage.getItem('refreshToken')
    const user = localStorage.getItem('user')
    const company = localStorage.getItem('company')
    
    return {
      accessToken,
      refreshToken,
      user: user ? JSON.parse(user) : null,
      company: company ? JSON.parse(company) : null,
      isAuthenticated: !!accessToken,
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
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.tokens.accessToken)
        localStorage.setItem('refreshToken', action.payload.tokens.refreshToken)
        localStorage.setItem('user', JSON.stringify(action.payload.user))
        localStorage.setItem('company', JSON.stringify(action.payload.company))
      }
    },
    
    setTokens: (state, action: PayloadAction<{ accessToken: string; refreshToken: string }>) => {
      state.accessToken = action.payload.accessToken
      state.refreshToken = action.payload.refreshToken
      
      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', action.payload.accessToken)
        localStorage.setItem('refreshToken', action.payload.refreshToken)
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
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        localStorage.removeItem('user')
        localStorage.removeItem('company')
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
  },
})

export const { setCredentials, setTokens, logout, setLoading, setError, clearError } = authSlice.actions
export default authSlice.reducer

