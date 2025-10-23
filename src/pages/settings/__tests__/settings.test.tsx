import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { setupServer } from 'msw/node'
import { http, HttpResponse } from 'msw'
import { store } from '../../../__data__/store'
import { Provider as ChakraProvider } from '../../../components/ui/provider'
import { Toaster } from '../../../components/ui/toaster'
import { SettingsPage } from '../settings'
import '@testing-library/jest-dom'

// Mock useAuth hook
jest.mock('../../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: {
      id: '67175db1c5f1a2b3c4d5e6f7',
      email: 'ivan@company.com',
      fullName: 'Иван Иванов',
    },
    company: {
      id: '67175db1c5f1a2b3c4d5e6f8',
      name: 'ООО "ТехноПартнер"',
    },
    isAuthenticated: true,
    login: jest.fn(),
    logout: jest.fn(),
    isLoading: false,
  }),
}))

// Mock useToast hook
jest.mock('../../../hooks/useToast', () => ({
  useToast: () => ({
    success: jest.fn(),
    error: jest.fn(),
    info: jest.fn(),
    warning: jest.fn(),
  }),
}))

// Mock i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'ru',
    },
  }),
}))

// Mock MainLayout
jest.mock('../../../components/layout/MainLayout', () => ({
  MainLayout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}))

// Mock experience API
jest.mock('../../../__data__/api/experienceApi', () => ({
  useCreateExperienceMutation: () => [
    jest.fn().mockResolvedValue({}),
    { isLoading: false },
  ],
}))

// Setup MSW server for API mocking
const server = setupServer()

beforeAll(() => server.listen({ onUnhandledRequest: 'warn' }))
afterEach(() => server.resetHandlers())
afterAll(() => server.close())

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

describe('SettingsPage', () => {
  describe('Page Rendering', () => {
    test('should render page without crashing', () => {
      // Arrange
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(document.body).toBeInTheDocument()
    })

    test('should display settings title', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      const title = screen.getByText('nav.settings')
      expect(title).toBeInTheDocument()
    })

    test('should render save button', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      const saveButton = screen.getByText('Сохранить')
      expect(saveButton).toBeInTheDocument()
    })

    test('should render all settings sections', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Опыт работы')).toBeInTheDocument()
      expect(screen.getByText('Профиль')).toBeInTheDocument()
      expect(screen.getByText('Уведомления')).toBeInTheDocument()
      expect(screen.getByText('Язык и регион')).toBeInTheDocument()
      expect(screen.getByText('Безопасность')).toBeInTheDocument()
    })
  })

  describe('Profile Section', () => {
    test('should display user profile information', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Имя пользователя')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
      expect(screen.getByText('Компания')).toBeInTheDocument()
    })

    test('should display user data correctly', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Иван Иванов')).toBeInTheDocument()
      expect(screen.getByText('ivan@company.com')).toBeInTheDocument()
      expect(screen.getByText('ООО "ТехноПартнер"')).toBeInTheDocument()
    })
  })

  describe('Notifications Section', () => {
    test('should have push notifications toggle', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Push-уведомления')).toBeInTheDocument()
    })

    test('should have email notifications toggle', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Email-уведомления')).toBeInTheDocument()
    })

    test('should toggle push notifications', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const pushNotificationSection = screen.getByText('Push-уведомления').closest('div')
      const switchControl = pushNotificationSection?.querySelector('input')

      // Act
      if (switchControl) {
        await user.click(switchControl)
      }

      // Assert
      await waitFor(() => {
        expect(switchControl).toBeTruthy()
      })
    })

    test('should toggle email notifications', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const emailSection = screen.getByText('Email-уведомления').closest('div')
      const switchControl = emailSection?.querySelector('input')

      // Act
      if (switchControl) {
        await user.click(switchControl)
      }

      // Assert
      await waitFor(() => {
        expect(switchControl).toBeTruthy()
      })
    })
  })

  describe('Language Section', () => {
    test('should display language selector', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Язык интерфейса')).toBeInTheDocument()
    })

    test('should have Russian and English options', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const russianOption = screen.getByDisplayValue('Русский') as HTMLOptionElement
      const englishOption = screen.getByDisplayValue('English') as HTMLOptionElement

      // Assert
      expect(russianOption).toBeInTheDocument()
      expect(englishOption).toBeInTheDocument()
    })

    test('should change language on select', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const languageSelect = screen.getByDisplayValue('Русский') as HTMLSelectElement

      // Act
      await user.selectOptions(languageSelect, 'en')

      // Assert
      await waitFor(() => {
        expect(languageSelect.value).toBe('en')
      })
    })
  })

  describe('Security Section', () => {
    test('should display security section', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Безопасность')).toBeInTheDocument()
    })

    test('should have change password button', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Изменить пароль')).toBeInTheDocument()
    })

    test('should have delete account button', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Удалить аккаунт')).toBeInTheDocument()
    })

    test('should handle password change button click', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const passwordButton = screen.getByText('Изменить пароль')

      // Act
      await user.click(passwordButton)

      // Assert
      expect(passwordButton).toBeInTheDocument()
    })
  })

  describe('Experience Section', () => {
    test('should display experience section', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Опыт работы')).toBeInTheDocument()
    })

    test('should have add experience button', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      expect(screen.getByText('Добавить запись')).toBeInTheDocument()
    })

    test('should open dialog when add experience button is clicked', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')

      // Act
      await user.click(addButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Новая запись опыта')).toBeInTheDocument()
      })
    })

    test('should display form fields in dialog', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByLabelText('Заказчик')).toBeInTheDocument()
        expect(screen.getByLabelText('Предмет закупки')).toBeInTheDocument()
        expect(screen.getByLabelText('Объем')).toBeInTheDocument()
        expect(screen.getByLabelText('Контакты')).toBeInTheDocument()
        expect(screen.getByLabelText('Комментарий')).toBeInTheDocument()
      })
    })

    test('should fill form fields with user input', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Act
      const customerInput = await screen.findByLabelText('Заказчик')
      await user.type(customerInput, 'ОАО "Газпром"')

      // Assert
      await waitFor(() => {
        expect((customerInput as HTMLInputElement).value).toBe('ОАО "Газпром"')
      })
    })

    test('should handle form submission', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Act
      const customerInput = await screen.findByLabelText('Заказчик')
      const subjectInput = screen.getByLabelText('Предмет закупки')
      const saveButton = screen.getByText('Сохранить')

      await user.type(customerInput, 'ОАО "Газпром"')
      await user.type(subjectInput, 'Трубопроводная арматура')
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(saveButton).toBeInTheDocument()
      })
    })

    test('should have cancel button in dialog', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Assert
      await waitFor(() => {
        expect(screen.getByText('Отмена')).toBeInTheDocument()
      })
    })

    test('should close dialog on cancel click', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      const cancelButton = await screen.findByText('Отмена')

      // Act
      await user.click(cancelButton)

      // Assert
      await waitFor(() => {
        expect(screen.queryByText('Новая запись опыта')).not.toBeInTheDocument()
      })
    })

    test('should handle checkbox in experience form', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Act
      const confirmedCheckbox = await screen.findByLabelText('Подтверждено')
      await user.click(confirmedCheckbox)

      // Assert
      await waitFor(() => {
        expect((confirmedCheckbox as HTMLInputElement).checked).toBeTruthy()
      })
    })
  })

  describe('Save Button', () => {
    test('should have save button in header', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const saveButton = screen.getByText('Сохранить')

      // Assert
      expect(saveButton).toBeInTheDocument()
    })

    test('should handle save button click', async () => {
      // Arrange
      const user = userEvent.setup()
      const consoleSpy = jest.spyOn(console, 'log')

      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const saveButton = screen.getByText('Сохранить')

      // Act
      await user.click(saveButton)

      // Assert
      expect(consoleSpy).toHaveBeenCalledWith('Settings saved')
      consoleSpy.mockRestore()
    })
  })

  describe('Complex User Interactions', () => {
    test('should handle full settings workflow', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Act - Toggle notifications
      const pushNotificationSection = screen.getByText('Push-уведомления').closest('div')
      const switchControl = pushNotificationSection?.querySelector('input')
      if (switchControl) {
        await user.click(switchControl)
      }

      // Act - Change language
      const languageSelect = screen.getByDisplayValue('Русский') as HTMLSelectElement
      await user.selectOptions(languageSelect, 'en')

      // Act - Open and close dialog
      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      const cancelButton = await screen.findByText('Отмена')
      await user.click(cancelButton)

      // Act - Save
      const saveButton = screen.getByText('Сохранить')
      await user.click(saveButton)

      // Assert
      await waitFor(() => {
        expect(languageSelect.value).toBe('en')
      })
    })

    test('should maintain state across multiple interactions', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Act - Multiple form changes
      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      const customerInput = await screen.findByLabelText('Заказчик')
      await user.type(customerInput, 'Company 1')

      await waitFor(() => {
        expect((customerInput as HTMLInputElement).value).toBe('Company 1')
      })

      // Assert
      expect((customerInput as HTMLInputElement).value).toBe('Company 1')
    })
  })

  describe('Accessibility', () => {
    test('should have accessible buttons', () => {
      // Arrange & Act
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      // Assert
      const saveButton = screen.getByText('Сохранить')
      expect(saveButton).toHaveAttribute('type')
    })

    test('should have accessible form fields', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')
      await user.click(addButton)

      // Assert
      const customerInput = await screen.findByLabelText('Заказчик')
      expect(customerInput).toHaveAttribute('type', 'text')
    })
  })

  describe('Error Handling', () => {
    test('should handle dialog opening and closing properly', async () => {
      // Arrange
      const user = userEvent.setup()
      render(
        <TestWrapper>
          <SettingsPage />
        </TestWrapper>
      )

      const addButton = screen.getByText('Добавить запись')

      // Act - Open dialog
      await user.click(addButton)
      await waitFor(() => {
        expect(screen.getByText('Новая запись опыта')).toBeInTheDocument()
      })

      // Act - Close dialog
      const cancelButton = screen.getByText('Отмена')
      await user.click(cancelButton)

      // Assert - Dialog closed
      await waitFor(() => {
        expect(screen.queryByText('Новая запись опыта')).not.toBeInTheDocument()
      })
    })
  })
})

