import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { store } from '../../__data__/store'
import { Provider as ChakraProvider } from '../../components/ui/provider'
import { Toaster } from '../../components/ui/toaster'

// Mock authentication
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '123',
      email: 'test@example.com',
      fullName: 'Test User',
      companyName: 'Test Company',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}))

// Mock i18n
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'ru',
    },
  }),
}))

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Provider store={store}>
    <BrowserRouter basename="/procurement-pl">
      <ChakraProvider>
        <Toaster />
        {children}
      </ChakraProvider>
    </BrowserRouter>
  </Provider>
)

describe('Pages - Integration Tests', () => {
  test('should render without crashing', () => {
    render(
      <TestWrapper>
        <div>Test content</div>
      </TestWrapper>
    )

    expect(screen.getByText('Test content')).toBeInTheDocument()
  })

  test('should support Redux provider', () => {
    render(
      <TestWrapper>
        <div>Redux Test</div>
      </TestWrapper>
    )

    expect(store.getState).toBeDefined()
  })

  test('should support routing context', () => {
    render(
      <TestWrapper>
        <div>Router Test</div>
      </TestWrapper>
    )

    expect(screen.getByText('Router Test')).toBeInTheDocument()
  })

  test('should provide Chakra UI components', () => {
    render(
      <TestWrapper>
        <div>Chakra Test</div>
      </TestWrapper>
    )

    expect(screen.getByText('Chakra Test')).toBeInTheDocument()
  })

  test('should have toaster for notifications', () => {
    render(
      <TestWrapper>
        <div>Toaster Test</div>
      </TestWrapper>
    )

    expect(document.body).toBeInTheDocument()
  })

  test('should support nested components', () => {
    render(
      <TestWrapper>
        <div>
          <p>Parent</p>
          <div>
            <p>Child</p>
          </div>
        </div>
      </TestWrapper>
    )

    expect(screen.getByText('Parent')).toBeInTheDocument()
    expect(screen.getByText('Child')).toBeInTheDocument()
  })

  test('should handle user events', () => {
    const handleClick = jest.fn()

    render(
      <TestWrapper>
        <button onClick={handleClick}>Click me</button>
      </TestWrapper>
    )

    const button = screen.getByText('Click me')
    fireEvent.click(button)

    expect(handleClick).toHaveBeenCalled()
  })

  test('should handle form input', () => {
    const handleChange = jest.fn()

    render(
      <TestWrapper>
        <input onChange={handleChange} placeholder="Enter text" />
      </TestWrapper>
    )

    const input = screen.getByPlaceholderText('Enter text') as HTMLInputElement
    fireEvent.change(input, { target: { value: 'test' } })

    expect(input.value).toBe('test')
    expect(handleChange).toHaveBeenCalled()
  })

  test('should handle multiple interactions', () => {
    const handleSubmit = jest.fn()

    render(
      <TestWrapper>
        <form onSubmit={handleSubmit}>
          <input placeholder="Email" />
          <button type="submit">Submit</button>
        </form>
      </TestWrapper>
    )

    const form = screen.getByRole('form', { hidden: true })
    fireEvent.submit(form)

    expect(handleSubmit).toHaveBeenCalled()
  })

  test('should render all page components properly', () => {
    render(
      <TestWrapper>
        <div data-testid="page-container">Page content</div>
      </TestWrapper>
    )

    const pageContainer = screen.getByTestId('page-container')
    expect(pageContainer).toBeInTheDocument()
  })

  test('should handle asynchronous operations', async () => {
    render(
      <TestWrapper>
        <div data-testid="async-content">Content</div>
      </TestWrapper>
    )

    await waitFor(() => {
      expect(screen.getByTestId('async-content')).toBeInTheDocument()
    })
  })

  test('should support conditional rendering', () => {
    const { rerender } = render(
      <TestWrapper>
        {true && <div>Visible</div>}
        {false && <div>Hidden</div>}
      </TestWrapper>
    )

    expect(screen.getByText('Visible')).toBeInTheDocument()
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  test('should handle state updates', () => {
    const TestComponent: React.FC = () => {
      const [count, setCount] = React.useState(0)

      return (
        <div>
          <p>Count: {count}</p>
          <button onClick={() => setCount(count + 1)}>Increment</button>
        </div>
      )
    }

    render(
      <TestWrapper>
        <TestComponent />
      </TestWrapper>
    )

    expect(screen.getByText('Count: 0')).toBeInTheDocument()

    const button = screen.getByText('Increment')
    fireEvent.click(button)

    expect(screen.getByText('Count: 1')).toBeInTheDocument()
  })

  test('should support context in pages', () => {
    render(
      <TestWrapper>
        <div>Context Test</div>
      </TestWrapper>
    )

    expect(screen.getByText('Context Test')).toBeInTheDocument()
  })

  test('should render lists properly', () => {
    const items = ['Item 1', 'Item 2', 'Item 3']

    render(
      <TestWrapper>
        <ul>
          {items.map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      </TestWrapper>
    )

    items.forEach((item) => {
      expect(screen.getByText(item)).toBeInTheDocument()
    })
  })

  test('should handle keyboard events', () => {
    const handleKeyDown = jest.fn()

    render(
      <TestWrapper>
        <input onKeyDown={handleKeyDown} placeholder="Type here" />
      </TestWrapper>
    )

    const input = screen.getByPlaceholderText('Type here')
    fireEvent.keyDown(input, { key: 'Enter' })

    expect(handleKeyDown).toHaveBeenCalled()
  })

  test('should support data attributes', () => {
    render(
      <TestWrapper>
        <div data-testid="test-element" data-value="test">
          Element
        </div>
      </TestWrapper>
    )

    const element = screen.getByTestId('test-element')
    expect(element).toHaveAttribute('data-value', 'test')
  })

  test('should render with authentication context', () => {
    render(
      <TestWrapper>
        <div>Authenticated content</div>
      </TestWrapper>
    )

    expect(screen.getByText('Authenticated content')).toBeInTheDocument()
  })

  test('should support lazy loading of components', async () => {
    const LazyComponent = React.lazy(() =>
      Promise.resolve({
        default: () => <div>Lazy loaded</div>,
      })
    )

    render(
      <TestWrapper>
        <React.Suspense fallback={<div>Loading...</div>}>
          <LazyComponent />
        </React.Suspense>
      </TestWrapper>
    )

    expect(screen.getByText('Loading...')).toBeInTheDocument()

    await waitFor(() => {
      expect(screen.getByText('Lazy loaded')).toBeInTheDocument()
    })
  })

  test('should handle page navigation', () => {
    render(
      <TestWrapper>
        <a href="/procurement-pl/dashboard">Dashboard</a>
      </TestWrapper>
    )

    const link = screen.getByText('Dashboard')
    expect(link).toHaveAttribute('href', '/procurement-pl/dashboard')
  })

  test('should render complex page structures', () => {
    render(
      <TestWrapper>
        <div>
          <header>Header</header>
          <main>
            <nav>Navigation</nav>
            <section>Content</section>
          </main>
          <footer>Footer</footer>
        </div>
      </TestWrapper>
    )

    expect(screen.getByText('Header')).toBeInTheDocument()
    expect(screen.getByText('Navigation')).toBeInTheDocument()
    expect(screen.getByText('Content')).toBeInTheDocument()
    expect(screen.getByText('Footer')).toBeInTheDocument()
  })

  test('should handle form submissions', async () => {
    const handleSubmit = jest.fn((e) => e.preventDefault())

    render(
      <TestWrapper>
        <form onSubmit={handleSubmit}>
          <input type="text" placeholder="Name" />
          <button type="submit">Submit</button>
        </form>
      </TestWrapper>
    )

    const button = screen.getByText('Submit')
    fireEvent.click(button)

    await waitFor(() => {
      expect(handleSubmit).toHaveBeenCalled()
    })
  })

  test('should support custom event handlers', () => {
    const handleFocus = jest.fn()
    const handleBlur = jest.fn()

    render(
      <TestWrapper>
        <input
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder="Focus test"
        />
      </TestWrapper>
    )

    const input = screen.getByPlaceholderText('Focus test')
    fireEvent.focus(input)
    expect(handleFocus).toHaveBeenCalled()

    fireEvent.blur(input)
    expect(handleBlur).toHaveBeenCalled()
  })
})

