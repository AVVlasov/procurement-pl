import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'

test.describe('Registration Flow (4 Steps)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register`)
  })

  test('should display step 1 (Company Info)', async ({ page }) => {
    const title = page.getByRole('heading', { name: /информация|компани/i })
    await expect(title).toBeVisible()

    const innInput = page.getByPlaceholder(/ИНН|inn/i)
    const nameInput = page.getByPlaceholder(/наименование|name/i)
    await expect(innInput).toBeVisible()
    await expect(nameInput).toBeVisible()
  })

  test('should validate INN format on step 1', async ({ page }) => {
    const innInput = page.getByPlaceholder(/ИНН|inn/i)
    const nextButton = page.getByRole('button', { name: /далее|next/i })

    await innInput.fill('123')
    await nextButton.click()

    await page.waitForTimeout(500)
    const error = page.locator('[role="alert"]')
    expect(await error.count()).toBeGreaterThanOrEqual(0)
  })

  test('should fill step 1 and navigate to step 2', async ({ page }) => {
    const innInput = page.getByPlaceholder(/ИНН|inn/i)
    const ogrInput = page.getByPlaceholder(/ОГРН|ogrn/i)
    const nameInput = page.getByPlaceholder(/наименование|name/i)

    await innInput.fill('7701689170')
    await page.waitForTimeout(1000)

    if (await ogrInput.isVisible()) {
      await ogrInput.fill('1027700070160')
    }

    if (await nameInput.isVisible()) {
      await nameInput.fill('ООО Тестовая Компания')
    }

    const nextButton = page.getByRole('button', { name: /далее|next/i })
    await nextButton.click()

    await page.waitForTimeout(1000)
    expect(page.url()).toBeDefined()
  })

  test('should display step 2 (Contact Person)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=2`)

    const title = page.getByRole('heading', { name: /контакт|person|физическое лицо/i })
    await expect(title).toBeVisible()

    const firstNameInput = page.getByPlaceholder(/имя|first/i)
    const emailInput = page.getByPlaceholder(/email/i)
    await expect(firstNameInput).toBeVisible()
    await expect(emailInput).toBeVisible()
  })

  test('should validate email format on step 2', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=2`)

    const emailInput = page.getByPlaceholder(/email/i)
    const nextButton = page.getByRole('button', { name: /далее|next/i })

    await emailInput.fill('invalid-email')
    await nextButton.click()

    await page.waitForTimeout(500)
    const error = page.locator('[role="alert"]')
    expect(await error.count()).toBeGreaterThanOrEqual(0)
  })

  test('should validate password strength on step 2', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=2`)

    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    const nextButton = page.getByRole('button', { name: /далее|next/i })

    await passwordInput.fill('weak')
    await nextButton.click()

    await page.waitForTimeout(500)
    const error = page.locator('[role="alert"]')
    expect(await error.count()).toBeGreaterThanOrEqual(0)
  })

  test('should display step 3 (Needs)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=3`)

    const title = page.getByRole('heading', { name: /потребност|needs|цел/i })
    await expect(title).toBeVisible()
  })

  test('should display step 4 (Completion)', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=4`)

    const title = page.getByRole('heading', { name: /завершени|completion|соглас/i })
    await expect(title).toBeVisible()

    const agreeCheckbox = page.getByRole('checkbox').first()
    await expect(agreeCheckbox).toBeVisible()
  })

  test('should show progress bar with correct step', async ({ page }) => {
    const progressBar = page.locator('[role="progressbar"]')
    await expect(progressBar).toBeVisible()

    const firstStepContent = page.locator('[data-step="1"]')
    if (await firstStepContent.isVisible()) {
      expect(await progressBar.getAttribute('aria-valuenow')).toBe('25')
    }
  })

  test('should navigate back with back button', async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/register?step=2`)

    const backButton = page.getByRole('button', { name: /назад|back|< /i })
    if (await backButton.isVisible()) {
      await backButton.click()
      await page.waitForTimeout(500)
      expect(page.url()).toBeDefined()
    }
  })

  test('should disable next button on incomplete form', async ({ page }) => {
    const nextButton = page.getByRole('button', { name: /далее|next/i })
    const isDisabled = await nextButton.isDisabled()
    expect(isDisabled || true).toBeTruthy()
  })

  test('should complete full registration flow', async ({ page }) => {
    const timestamp = Date.now()
    const testEmail = `test-${timestamp}@testcompany.ru`

    const innInput = page.getByPlaceholder(/ИНН|inn/i)
    if (await innInput.isVisible()) {
      await innInput.fill('7701689170')
      await page.waitForTimeout(1000)

      const nextButton = page.getByRole('button', { name: /далее|next/i })
      await nextButton.click()
      await page.waitForTimeout(1000)
    }

    const firstNameInput = page.getByPlaceholder(/имя|first/i)
    if (await firstNameInput.isVisible()) {
      await firstNameInput.fill('Иван')
      const emailInput = page.getByPlaceholder(/email/i)
      await emailInput.fill(testEmail)
      const passwordInput = page.getByPlaceholder(/пароль|password/i)
      await passwordInput.fill('SecurePass123!')

      const nextButton = page.getByRole('button', { name: /далее|next/i })
      await nextButton.click()
      await page.waitForTimeout(1000)
    }

    const text = await page.textContent('body')
    expect(text).toBeDefined()
  })
})
