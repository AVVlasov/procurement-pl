import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Provider } from 'react-redux'
import { BrowserRouter } from 'react-router-dom'
import { AIRecommendations } from '../AIRecommendations'
import { store } from '../../../__data__/store'

// Mock react-i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'ai_recommendations.title': 'AI Рекомендации партнеров',
        'ai_recommendations.loading': 'Загрузка рекомендаций...',
        'ai_recommendations.no_recommendations': 'Пока нет рекомендаций',
        'ai_recommendations.view_details': 'Подробнее',
        'ai_recommendations.contact': 'Связаться',
        'ai_recommendations.reason': 'Рекомендовано потому что:'
      }
      return translations[key] || key
    }
  })
}))

// Mock the searchApi
jest.mock('../../../__data__/api/searchApi', () => ({
  useGetRecommendationsQuery: () => ({
    data: [
      {
        id: 'company-1',
        name: 'ООО Московский Строй',
        industry: 'Строительство',
        logo: undefined,
        matchScore: 85,
        reason: 'Matches your search criteria'
      }
    ],
    isLoading: false
  })
}))

// Mock useNavigate
const mockNavigate = jest.fn()
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate
}))

// Mock colors
jest.mock('../../../utils/colorMode', () => ({
  colors: {
    bg: { primary: 'white' },
    border: { primary: 'gray' }
  }
}))

describe('AIRecommendations', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should render recommendations', async () => {
    render(
      <BrowserRouter>
        <Provider store={store}>
          <AIRecommendations />
        </Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ООО Московский Строй')).toBeInTheDocument()
    })
  })

  it('should navigate to company profile when "Подробнее" button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <Provider store={store}>
          <AIRecommendations />
        </Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ООО Московский Строй')).toBeInTheDocument()
    })

    const detailsButton = screen.getByText('Подробнее')
    await user.click(detailsButton)

    expect(mockNavigate).toHaveBeenCalledWith('/company/company-1')
  })

  it('should navigate to messages when "Связаться" button is clicked', async () => {
    const user = userEvent.setup()
    render(
      <BrowserRouter>
        <Provider store={store}>
          <AIRecommendations />
        </Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('ООО Московский Строй')).toBeInTheDocument()
    })

    const contactButton = screen.getByText('Связаться')
    await user.click(contactButton)

    expect(mockNavigate).toHaveBeenCalledWith('/messages?companyId=company-1')
  })

  it('should display recommendation score', async () => {
    render(
      <BrowserRouter>
        <Provider store={store}>
          <AIRecommendations />
        </Provider>
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByText('85%')).toBeInTheDocument()
    })
  })
})
