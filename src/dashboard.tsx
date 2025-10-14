import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'

import { URLs } from './__data__/urls'
import { DashboardPage } from './pages/dashboard/dashboard'

const PageWrapper = ({ children }: React.PropsWithChildren) => (
  <Suspense fallback={<div>Loading...</div>}>{children}</Suspense>
)

export const Dashboard = () => {
  return (
    <Routes>
      <Route
        path="/"
        element={
          <PageWrapper>
            <DashboardPage />
          </PageWrapper>
        }
      />
    </Routes>
  )
}
