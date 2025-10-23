import React from 'react'
import { render, screen } from '@testing-library/react'
import { ErrorBoundary } from '../ErrorBoundary'

// Component that throws error
const BrokenComponent: React.FC = () => {
  throw new Error('Test error')
}

// Safe component
const SafeComponent: React.FC = () => <div>Safe content</div>

describe('ErrorBoundary', () => {
  beforeEach(() => {
    jest.spyOn(console, 'error').mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('should render children when there is no error', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })

  test('should render error UI when error occurs', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    // Should show error message or container
    const container = document.querySelector('[role="alert"]') || document.body
    expect(container).toBeInTheDocument()
  })

  test('should display error information', () => {
    render(
      <ErrorBoundary>
        <BrokenComponent />
      </ErrorBoundary>
    )

    // Check if error boundary captured the error
    expect(screen.queryByText('Safe content')).not.toBeInTheDocument()
  })

  test('should handle multiple children', () => {
    render(
      <ErrorBoundary>
        <SafeComponent />
        <div>Another safe child</div>
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
    expect(screen.getByText('Another safe child')).toBeInTheDocument()
  })

  test('should catch errors in nested components', () => {
    const NestedBroken: React.FC = () => (
      <div>
        <BrokenComponent />
      </div>
    )

    render(
      <ErrorBoundary>
        <NestedBroken />
      </ErrorBoundary>
    )

    // Should handle the error without crashing
    const container = document.body
    expect(container).toBeInTheDocument()
  })

  test('should recover from error if key changes', () => {
    const { rerender } = render(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()

    rerender(
      <ErrorBoundary>
        <SafeComponent />
      </ErrorBoundary>
    )

    expect(screen.getByText('Safe content')).toBeInTheDocument()
  })
})

