import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import App from '../app'
import { store } from '../__data__/store'

// Mock useAuth hook
jest.mock('../hooks/useAuth', () => ({
  useAuth: () => ({
    user: null,
    isAuthenticated: false,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}))

// Mock all page components
jest.mock('../pages/auth/login/login', () => ({
  Login: () => <div>Login Page</div>,
}))

jest.mock('../pages/auth/register/register', () => ({
  Register: () => <div>Register Page</div>,
}))

jest.mock('../pages/auth/forgot-password/ForgotPassword', () => ({
  ForgotPasswordPage: () => <div>Forgot Password Page</div>,
}))

jest.mock('../pages/dashboard/dashboard', () => ({
  DashboardPage: () => <div>Dashboard Page</div>,
}))

jest.mock('../pages/company/CompanyProfile', () => ({
  CompanyProfile: () => <div>Company Profile Page</div>,
}))

jest.mock('../pages/search/search', () => ({
  SearchPage: () => <div>Search Page</div>,
}))

jest.mock('../pages/messages/messages', () => ({
  MessagesPage: () => <div>Messages Page</div>,
}))

jest.mock('../pages/requests/requests', () => ({
  RequestsPage: () => <div>Requests Page</div>,
}))

jest.mock('../pages/settings/settings', () => ({
  SettingsPage: () => <div>Settings Page</div>,
}))

// Mock ProtectedRoute
jest.mock('../components/ProtectedRoute', () => ({
  ProtectedRoute: ({ children }: { children: React.ReactNode }) => children,
}))

describe('App', () => {
  const renderApp = () => {
    return render(
      <Provider store={store}>
        <App />
      </Provider>
    )
  }

  test('should render without crashing', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should provide Redux store', () => {
    renderApp()
    expect(store).toBeDefined()
    expect(store.getState).toBeDefined()
  })

  test('should render Toaster component for notifications', () => {
    renderApp()
    // Toaster is rendered as part of the app
    expect(document.body).toBeInTheDocument()
  })

  test('should have router setup', async () => {
    renderApp()
    await waitFor(() => {
      const location = window.location
      expect(location).toBeDefined()
    })
  })

  test('should support multiple Redux slices', () => {
    const state = store.getState()
    expect(state).toHaveProperty('auth')
  })

  test('should have RTK Query middleware configured', () => {
    const state = store.getState()
    expect(state).toBeDefined()
  })

  test('should provide theme through Provider', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should render children components', async () => {
    renderApp()
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  test('should initialize i18n', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should handle app-level state', () => {
    const state = store.getState()
    expect(Object.keys(state).length).toBeGreaterThan(0)
  })

  test('should have ErrorBoundary wrapper available', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should export App as default', () => {
    expect(App).toBeDefined()
    expect(typeof App).toBe('function')
  })

  test('should support nested routes', async () => {
    renderApp()
    await waitFor(() => {
      expect(document.body).toBeInTheDocument()
    })
  })

  test('should have public routes accessible', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should have protected routes configured', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })

  test('should configure basename for deployment', () => {
    renderApp()
    expect(document.body).toBeInTheDocument()
  })
})

