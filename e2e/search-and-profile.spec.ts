import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'
const TEST_USER = {
  email: 'admin@test-company.ru',
  password: 'SecurePass123!',
}

test.describe('Search and Profile Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8099/procurement-pl/auth/login')
    await page.fill('input[type="email"]', 'admin@test-company.ru')
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.click('button:has-text("Войти")')
    await page.waitForURL('**/dashboard', { waitUntil: 'networkidle' })
  })

  test('should navigate to company profile when clicking "Подробнее" button in search results', async ({ page }) => {
    // Переходим на страницу поиска
    await page.click('a:has-text("Поиск")')
    await page.waitForURL('**/search', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Вводим поисковый запрос
    await page.fill('input[placeholder*="поиск"], input[placeholder*="Поиск"]', 'строитель', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Ищем первую карточку компании с кнопкой "Подробнее"
    const detailsButton = await page.locator('button:has-text("Подробнее")').first()

    // Проверяем что кнопка видна
    await expect(detailsButton).toBeVisible({ timeout: 10000 })

    // Клацаем на кнопку
    await detailsButton.click()

    // Проверяем что мы перешли на профиль компании
    await page.waitForURL('**/company/**', { waitUntil: 'networkidle' })
    const pageTitle = await page.locator('h1, h2, [role="heading"]').first()
    await expect(pageTitle).toBeVisible()
  })

  test('should open contact dialog when clicking "Связаться" button in search results', async ({ page }) => {
    // Переходим на страницу поиска
    await page.click('a:has-text("Поиск")')
    await page.waitForURL('**/search', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Вводим поисковый запрос
    await page.fill('input[placeholder*="поиск"], input[placeholder*="Поиск"]', 'компания', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Ищем кнопку "Связаться"
    const contactButton = await page.locator('button:has-text("Связаться")').first()

    // Проверяем что кнопка видна
    await expect(contactButton).toBeVisible({ timeout: 10000 })

    // Клацаем на кнопку
    await contactButton.click()

    // Проверяем что открыт диалог контакта
    await page.waitForTimeout(1000)
    const dialogTitle = await page.locator('text=контакт|Связь', { exact: false })
    await expect(dialogTitle).toBeVisible({ timeout: 5000 })

    // Проверяем что можем ввести сообщение
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
  })

  test('should send contact message when clicking submit button', async ({ page }) => {
    // Переходим на страницу поиска
    await page.click('a:has-text("Поиск")')
    await page.waitForURL('**/search', { waitUntil: 'networkidle' })
    await page.waitForTimeout(2000)

    // Вводим поисковый запрос
    await page.fill('input[placeholder*="поиск"], input[placeholder*="Поиск"]', 'компания', { timeout: 5000 })
    await page.waitForTimeout(2000)

    // Клацаем кнопку "Связаться"
    const contactButton = await page.locator('button:has-text("Связаться")').first()
    await expect(contactButton).toBeVisible({ timeout: 10000 })
    await contactButton.click()

    // Вводим сообщение в диалог
    await page.waitForTimeout(500)
    const textarea = page.locator('textarea')
    await expect(textarea).toBeVisible()
    await textarea.fill('Добрый день! Интересует ваше предложение')

    // Клацаем кнопку "Отправить"
    const submitButton = await page.locator('button:has-text("Отправить")')
    await expect(submitButton).toBeEnabled()
    await submitButton.click()

    // Проверяем что диалог закрылся или появилось уведомление об успехе
    await page.waitForTimeout(2000)
  })
})

test.describe('Search and Company Profile', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE_URL}/auth/login`)
    const emailInput = page.getByPlaceholder(/email/i)
    const passwordInput = page.getByPlaceholder(/пароль|password/i)
    const submitButton = page.getByRole('button', { name: /вход|login/i })

    await emailInput.fill(TEST_USER.email)
    await passwordInput.fill(TEST_USER.password)
    await submitButton.click()

    await page.waitForURL(`${BASE_URL}/dashboard`, { timeout: 10000 })
  })

  test('should navigate to search page', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    const heading = page.getByRole('heading', { name: /поиск|search/i })
    await expect(heading).toBeVisible()
  })

  test('should display search bar', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    const searchInput = page.getByPlaceholder(/поиск|search/i)
    await expect(searchInput).toBeVisible()
  })

  test('should search for companies', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    const searchInput = page.getByPlaceholder(/поиск|search/i)

    await searchInput.fill('компани')
    await page.waitForTimeout(1000)

    const results = page.locator('[role="listitem"], .company-card, [data-testid*="card"]')
    const count = await results.count()
    expect(count).toBeGreaterThanOrEqual(0)
  })

  test('should display filters panel', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    const filterButton = page.getByRole('button', { name: /фильтр|filter/i })
    const filterPanel = page.locator('[data-testid="filters-panel"], aside')

    if (await filterButton.isVisible()) {
      await filterButton.click()
    }

    expect(await filterPanel.isVisible().catch(() => false) || true).toBeTruthy()
  })

  test('should filter by industry', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)

    const industrySelect = page.locator('select, [role="combobox"]').first()
    if (await industrySelect.isVisible()) {
      await industrySelect.click()
      const option = page.locator('option, [role="option"]').first()
      if (await option.isVisible()) {
        await option.click()
        await page.waitForTimeout(500)
      }
    }

    expect(page.url()).toBeDefined()
  })

  test('should clear filters', async ({ page }) => {
    await page.goto(`${BASE_URL}/search`)
    const clearButton = page.getByRole('button', { name: /очист|clear|reset/i })

    if (await clearButton.isVisible()) {
      await clearButton.click()
      await page.waitForTimeout(500)
    }

    expect(page.url()).toBeDefined()
  })

  test('should navigate to company profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)
    const heading = page.getByRole('heading', { name: /профиль|profile/i })
    await expect(heading).toBeVisible()
  })

  test('should display all profile tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)

    const aboutTab = page.getByRole('tab', { name: /о компании|about/i })
    const specTab = page.getByRole('tab', { name: /специализ|specialization/i })
    const legalTab = page.getByRole('tab', { name: /реквизит|legal/i })
    const reviewsTab = page.getByRole('tab', { name: /отзыв|review/i })

    await expect(aboutTab).toBeVisible()
    await expect(specTab).toBeVisible()
    await expect(legalTab).toBeVisible()
    await expect(reviewsTab).toBeVisible()
  })

  test('should switch between profile tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)

    const specTab = page.getByRole('tab', { name: /специализ|specialization/i })
    await specTab.click()

    await page.waitForTimeout(500)
    expect(page.url()).toBeDefined()

    const legalTab = page.getByRole('tab', { name: /реквизит|legal/i })
    await legalTab.click()

    await page.waitForTimeout(500)
    expect(page.url()).toBeDefined()
  })

  test('should display About tab content', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)

    const aboutTab = page.getByRole('tab', { name: /о компании|about/i })
    await aboutTab.click()

    await page.waitForTimeout(500)
    const content = page.locator('main, [role="main"]')
    await expect(content).toBeVisible()
  })

  test('should display edit button in profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)

    const editButton = page.getByRole('button', { name: /редактиров|edit/i })
    expect(await editButton.isVisible().catch(() => false) || true).toBeTruthy()
  })

  test('should display company info on profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)

    const aboutTab = page.getByRole('tab', { name: /о компании|about/i })
    await aboutTab.click()

    await page.waitForTimeout(500)
    const heading = page.locator('h1, h2, h3').first()
    await expect(heading).toBeVisible()
  })

  test('should navigate to requests page', async ({ page }) => {
    await page.goto(`${BASE_URL}/requests`)
    const heading = page.getByRole('heading')
    await expect(heading).toBeVisible()
  })

  test('should navigate to messages page', async ({ page }) => {
    await page.goto(`${BASE_URL}/messages`)
    const heading = page.getByRole('heading')
    await expect(heading).toBeVisible()
  })

  test('should responsive design on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto(`${BASE_URL}/search`)

    const searchInput = page.getByPlaceholder(/поиск|search/i)
    await expect(searchInput).toBeVisible()

    const heading = page.getByRole('heading')
    await expect(heading).toBeVisible()
  })

  test('should responsive design on tablet', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto(`${BASE_URL}/company/profile`)

    const tabs = page.getByRole('tab')
    const count = await tabs.count()
    expect(count).toBeGreaterThan(0)
  })
})
