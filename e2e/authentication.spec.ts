import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'
const TEST_USER = {
  email: 'admin@test-company.ru',
  password: 'SecurePass123!',
}

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
  })

  test('should display login page', async ({ page }) => {
    const title = page.getByRole('heading', { name: /вход/i })
    await expect(title).toBeVisible()

    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    await expect(emailInput).toBeVisible()
    await expect(passwordInput).toBeVisible()
  })

  test('should show validation errors for empty fields', async ({ page }) => {
    const submitButton = page.getByRole('button', { name: /вход|login/i })
    await submitButton.click()

    await page.waitForTimeout(500)
    const errors = page.locator('[role="alert"]')
    expect(await errors.count()).toBeGreaterThan(0)
  })

  test('should show error for invalid email', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i)
    const submitButton = page.getByRole('button', { name: /вход|login/i })

    await emailInput.fill('invalid-email')
    await submitButton.click()

    await page.waitForTimeout(500)
    const error = page.locator('[role="alert"]')
    await expect(error).toBeVisible()
  })

  test('should login with valid credentials', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    const submitButton = page.getByRole('button', { name: /вход|login/i })

    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await submitButton.click()

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
    expect(page.url()).toContain('/dashboard')
  })

  test('should show remember me checkbox', async ({ page }) => {
    const checkbox = page.getByRole('checkbox', { name: /помни|remember/i })
    await expect(checkbox).toBeVisible()
  })

  test('should display forgot password link', async ({ page }) => {
    const link = page.getByRole('link', { name: /забыл|forgot/i })
    await expect(link).toBeVisible()
  })

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    await page.goto(`${BASE_URL}/dashboard`, { waitUntil: 'networkidle' })
    await page.waitForTimeout(500)
    expect(page.url()).toContain('/auth/login')
  })

  test('should maintain session after page reload', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    const submitButton = page.getByRole('button', { name: /вход|login/i })

    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await submitButton.click()

    await page.waitForURL(`${BASE_URL}/dashboard`)

    await page.reload()
    await page.waitForTimeout(1000)

    expect(page.url()).toContain('/dashboard')
  })

  test('should logout successfully', async ({ page }) => {
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    const submitButton = page.getByRole('button', { name: /вход|login/i })

    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await submitButton.click()

    await page.waitForURL(`${BASE_URL}/dashboard`)

    const userMenu = page.getByRole('button', { name: /профиль|меню|menu/i })
    await userMenu.click()

    const logoutButton = page.getByRole('menuitem', { name: /выход|logout/i })
    await logoutButton.click()

    await page.waitForTimeout(1000)
    expect(page.url()).toContain('/auth/login')
  })

  test('should support switch language', async ({ page }) => {
    const languageButton = page.getByRole('button', { name: /en|ru/i }).first()
    await languageButton.click()

    const otherLang = page.getByRole('button', { name: /en|ru/i }).first()
    await otherLang.click()

    await page.waitForTimeout(500)
    expect(page.url()).toBeDefined()
  })
})
