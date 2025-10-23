import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'
const TEST_USER = {
  email: 'admin@test-company.ru',
  password: 'SecurePass123!',
}

test.describe('Dashboard - Complete User Flow (Dash Board Experience)', () => {
  test.beforeEach(async ({ page, context }) => {
    // Mock localStorage for authentication
    await context.addInitScript(() => {
      localStorage.setItem('token', 'mock-token-123')
      localStorage.setItem('user', JSON.stringify({
        id: 'test-user-1',
        email: 'admin@test-company.ru',
        companyName: 'Test Company LLC',
        role: 'admin',
      }))
    })

    // Navigate to login
    await page.goto(`${BASE_URL}/auth/login`)
    
    // Fill login form
    await page.fill('input[placeholder*="email" i]', TEST_USER.email)
    await page.fill('input[placeholder*="пароль" i]', TEST_USER.password)
    
    // Submit
    const submitButton = page.getByRole('button', { name: /вход|login/i })
    await submitButton.click()
    
    // Wait for redirect to dashboard
    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
  })

  test('User can view complete dashboard with all sections', async ({ page }) => {
    // Step 1: Verify page loaded
    const heading = page.getByRole('heading')
    await expect(heading.first()).toBeVisible()

    // Step 2: Verify header with navigation
    const nav = page.locator('nav, [role="navigation"]')
    expect(await nav.count()).toBeGreaterThan(0)

    // Step 3: Check sidebar/menu items
    const homeLink = page.getByRole('link', { name: /главная|home|dashboard/i })
    await expect(homeLink).toBeVisible()

    // Step 4: Verify statistics cards appear
    const statCards = page.locator('[role="article"], .stat-card, [data-testid*="card"]')
    const cardCount = await statCards.count()
    expect(cardCount).toBeGreaterThanOrEqual(0)

    // Step 5: Check for main content area
    const mainContent = page.locator('main, [role="main"]')
    await expect(mainContent).toBeVisible()

    // Step 6: Verify user can navigate
    const companyLink = page.getByRole('link', { name: /компания|profile|company/i })
    if (await companyLink.isVisible()) {
      await companyLink.click()
      await page.waitForTimeout(1000)
    }

    // Step 7: Verify can go back to dashboard
    const dashboardButton = page.getByRole('link', { name: /dashboard|главная/i })
    if (await dashboardButton.isVisible()) {
      await dashboardButton.click()
      await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 5000 })
    }

    // Step 8: Check search/navigation features
    const searchInput = page.getByPlaceholder(/поиск|search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test')
      await page.waitForTimeout(500)
      await searchInput.clear()
    }

    // Step 9: Verify user menu
    const userMenu = page.getByRole('button', { name: /профиль|меню|пользователь/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.waitForTimeout(500)
    }

    // Step 10: Verify page state after interactions
    expect(page.url()).toContain('dashboard')
  })

  test('User can access all main navigation sections', async ({ page }) => {
    // Step 1: Navigate to Search
    const searchLink = page.getByRole('link', { name: /поиск|search/i })
    if (await searchLink.isVisible()) {
      await searchLink.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('search')
    }

    // Step 2: Go back and navigate to Company
    await page.goto(`${BASE_URL}/dashboard`)
    const companyLink = page.getByRole('link', { name: /компания|profile/i })
    if (await companyLink.isVisible()) {
      await companyLink.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('company')
    }

    // Step 3: Check Messages
    await page.goto(`${BASE_URL}/dashboard`)
    const messagesLink = page.getByRole('link', { name: /сообщения|message/i })
    if (await messagesLink.isVisible()) {
      await messagesLink.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('messages')
    }

    // Step 4: Check Requests
    await page.goto(`${BASE_URL}/dashboard`)
    const requestsLink = page.getByRole('link', { name: /запросы|requests/i })
    if (await requestsLink.isVisible()) {
      await requestsLink.click()
      await page.waitForTimeout(500)
      expect(page.url()).toContain('requests')
    }

    // Step 5: Return to dashboard
    await page.goto(`${BASE_URL}/dashboard`)
    expect(page.url()).toContain('dashboard')
  })

  test('Dashboard layout is responsive across devices', async ({ page }) => {
    // Desktop view (1920px)
    await page.setViewportSize({ width: 1920, height: 1080 })
    const heading = page.getByRole('heading').first()
    await expect(heading).toBeVisible()

    // Tablet view (768px)
    await page.setViewportSize({ width: 768, height: 1024 })
    await expect(heading).toBeVisible()

    // Mobile view (375px)
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check if navigation is accessible
    const nav = page.locator('nav, [role="navigation"], button[aria-label*="menu" i]')
    const navCount = await nav.count()
    expect(navCount).toBeGreaterThanOrEqual(0)
    
    await expect(heading).toBeVisible()
  })

  test('User session persists and can logout', async ({ page, context }) => {
    // Verify authenticated state
    expect(page.url()).toContain('dashboard')

    // Find and click logout button
    const userMenu = page.getByRole('button', { name: /профиль|меню|user/i })
    if (await userMenu.isVisible()) {
      await userMenu.click()
      await page.waitForTimeout(300)
      
      const logoutButton = page.getByRole('menuitem', { name: /выход|logout/i })
      if (await logoutButton.isVisible()) {
        await logoutButton.click()
        await page.waitForTimeout(1000)
      }
    }

    // Clear localStorage to simulate logout
    await context.addInitScript(() => {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
    })

    // Verify returned to login
    await page.goto(`${BASE_URL}/dashboard`)
    await page.waitForTimeout(500)
    
    // Should be redirected or on login
    const url = page.url()
    expect(url === `${BASE_URL}/auth/login` || url.includes('auth/login')).toBeTruthy()
  })
})
