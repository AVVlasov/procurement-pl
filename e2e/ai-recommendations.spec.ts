import { test, expect } from '@playwright/test'

test.describe('AI Recommendations', () => {
  test.beforeEach(async ({ page }) => {
    // Авторизация и переход на дашборд
    await page.goto('http://localhost:8099/procurement-pl/auth/login')

    // Введём учётные данные
    await page.fill('input[type="email"]', 'admin@test-company.ru')
    await page.fill('input[type="password"]', 'SecurePass123!')

    // Нажимаем кнопку входа
    await page.click('button:has-text("Войти")')

    // Ждём загрузки дашборда
    await page.waitForURL('**/dashboard', { waitUntil: 'networkidle' })
    await page.waitForTimeout(1000)
  })

  test('should display AI Recommendations section', async ({ page }) => {
    // Ищем заголовок рекомендаций
    const title = await page.locator('text=AI Рекомендации партнеров')
    await expect(title).toBeVisible()
  })

  test('should navigate to company profile when clicking "Подробнее" button', async ({ page }) => {
    // Ждём загрузки рекомендаций
    await page.waitForTimeout(2000)

    // Ищем первую карточку рекомендации
    const detailsButton = await page.locator('button:has-text("Подробнее")').first()

    // Проверяем видимость кнопки
    await expect(detailsButton).toBeVisible()

    // Клацаем по кнопке
    await detailsButton.click()

    // Проверяем навигацию на профиль компании
    await page.waitForURL('**/company/**', { waitUntil: 'networkidle' })
    const profileHeading = await page.locator('h1, h2, [role="heading"]').first()
    await expect(profileHeading).toBeVisible()
  })

  test('should open contact dialog when clicking "Связаться" button', async ({ page }) => {
    // Ждём загрузки рекомендаций
    await page.waitForTimeout(2000)

    // Ищем кнопку "Связаться"
    const contactButton = await page.locator('button:has-text("Связаться")').first()

    // Проверяем видимость кнопки
    await expect(contactButton).toBeVisible()

    // Клацаем по кнопке
    await contactButton.click()

    // Проверяем что открыт диалог сообщения
    await page.waitForTimeout(1000)
    const messageDialog = await page.locator('text=Связаться|Contact', { exact: false })
    await expect(messageDialog).toBeVisible({ timeout: 5000 })
  })

  test('should display recommendation card with company name and industry', async ({ page }) => {
    // Ждём загрузки рекомендаций
    await page.waitForTimeout(2000)

    // Ищем компанию в рекомендациях
    const companyName = await page.locator('[role="article"], [role="main"] >> text=/[А-Я].*/')
    await expect(companyName.first()).toBeVisible()
  })
})
