import React from 'react'
import { render, screen } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../../__data__/store'
import { ProtectedRoute } from '../ProtectedRoute'

// Mock useAuth
jest.mock('../../hooks/useAuth', () => ({
  useAuth: jest.fn(),
}))

import { useAuth } from '../../hooks/useAuth'

const mockUseAuth = useAuth as jest.MockedFunction<typeof useAuth>

const TestComponent: React.FC = () => <div>Protected Content</div>

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <Provider store={store}>
      <BrowserRouter basename="/procurement-pl">
        {component}
      </BrowserRouter>
    </Provider>
  )
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render protected content when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should redirect when not authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    // Should not render protected content
    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('should show loading state while checking authentication', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: true,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('should pass children correctly', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    const ChildComponent: React.FC = () => <p>Child content</p>

    renderWithProviders(
      <ProtectedRoute>
        <ChildComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Child content')).toBeInTheDocument()
  })

  test('should handle multiple children', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <div>First</div>
        <div>Second</div>
      </ProtectedRoute>
    )

    expect(screen.getByText('First')).toBeInTheDocument()
    expect(screen.getByText('Second')).toBeInTheDocument()
  })

  test('should handle authenticated user with token', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '123',
        email: 'test@example.com',
        token: 'valid-token',
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should handle unauthenticated user without token', () => {
    mockUseAuth.mockReturnValue({
      user: null,
      isAuthenticated: false,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument()
  })

  test('should handle route with deeply nested children', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <div>
          <div>
            <div>
              <p>Nested content</p>
            </div>
          </div>
        </div>
      </ProtectedRoute>
    )

    expect(screen.getByText('Nested content')).toBeInTheDocument()
  })

  test('should preserve component state when authenticated', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    const StatefulComponent: React.FC = () => {
      const [count, setCount] = React.useState(0)
      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      )
    }

    renderWithProviders(
      <ProtectedRoute>
        <StatefulComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Count: 0')).toBeInTheDocument()
  })

  test('should handle different user types', () => {
    mockUseAuth.mockReturnValue({
      user: {
        id: '456',
        email: 'admin@example.com',
        role: 'admin',
      },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should update when auth state changes', () => {
    const { rerender } = renderWithProviders(
      <ProtectedRoute>
        <TestComponent />
      </ProtectedRoute>
    )

    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    rerender(
      <Provider store={store}>
        <BrowserRouter basename="/procurement-pl">
          <ProtectedRoute>
            <TestComponent />
          </ProtectedRoute>
        </BrowserRouter>
      </Provider>
    )

    expect(screen.getByText('Protected Content')).toBeInTheDocument()
  })

  test('should handle empty children', () => {
    mockUseAuth.mockReturnValue({
      user: { id: '123', email: 'test@example.com' },
      isAuthenticated: true,
      login: jest.fn(),
      logout: jest.fn(),
      isLoading: false,
    })

    const { container } = renderWithProviders(
      <ProtectedRoute>
        {null}
      </ProtectedRoute>
    )

    expect(container).toBeInTheDocument()
  })
})

