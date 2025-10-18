import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Provider as ReduxProvider } from 'react-redux'
import { Provider } from './components/ui/provider'
import { Toaster } from './components/ui/toaster'
import { store } from './__data__/store'
import './i18n'

// Pages
import { DashboardPage } from './pages/dashboard/dashboard'
import { Login } from './pages/auth/login/login'
import { Register } from './pages/auth/register/register'
import { ForgotPasswordPage } from './pages/auth/forgot-password/ForgotPassword'
import { CompanyProfile } from './pages/company/CompanyProfile'
import { SearchPage } from './pages/search/search'
import { MessagesPage } from './pages/messages/messages'
import { RequestsPage } from './pages/requests/requests'
import { SettingsPage } from './pages/settings/settings'
import { ProtectedRoute } from './components/ProtectedRoute'
import { ErrorBoundary } from './components/ErrorBoundary'

const App = () => {
  return (
    <ReduxProvider store={store}>
      <BrowserRouter basename="/procurement-pl">
        <Provider>
          {/* <ErrorBoundary> */}
            <Toaster />
              <Routes>
                {/* Public routes */}
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPasswordPage />} />
                
                {/* Protected routes */}
                <Route path="/" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <DashboardPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/company/profile" element={
                  <ProtectedRoute>
                    <CompanyProfile />
                  </ProtectedRoute>
                } />
                
                <Route path="/search" element={
                  <ProtectedRoute>
                    <SearchPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <MessagesPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/requests" element={
                  <ProtectedRoute>
                    <RequestsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/settings" element={
                  <ProtectedRoute>
                    <SettingsPage />
                  </ProtectedRoute>
                } />
                
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
          {/* </ErrorBoundary> */}
        </Provider>
      </BrowserRouter>
    </ReduxProvider>
  )
}

export default App
