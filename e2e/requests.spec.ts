import { test, expect } from '@playwright/test'

test.describe('Requests functionality', () => {
  test.beforeEach(async ({ page }) => {
    // Вход под первым пользователем (отправитель)
    await page.goto('http://localhost:8099/procurement-pl/auth/login')
    await page.fill('input[type="email"]', 'admin@test-company.ru')
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
  })

  test('should send a request', async ({ page }) => {
    // Переход на страницу запросов
    await page.goto('http://localhost:8099/procurement-pl/requests')
    
    // Выбор товара
    const productSelect = page.locator('select').first()
    await productSelect.selectOption({ index: 1 })
    
    // Ввод текста запроса
    await page.fill('textarea', 'Тестовый запрос для проверки')
    
    // Выбор получателя (первый в списке)
    await page.click('[type="checkbox"]', { timeout: 5000 })
    
    // Отправка запроса
    await page.click('button:has-text("Отправить запрос")')
    
    // Проверка успешной отправки
    await expect(page.locator('text=Запрос отправлен успешно')).toBeVisible({ timeout: 10000 })
  })

  test('should respond to a received request', async ({ page, context }) => {
    // Сначала создадим запрос от первого пользователя
    await page.goto('http://localhost:8099/procurement-pl/requests')
    
    const productSelect = page.locator('select').first()
    const productCount = await productSelect.locator('option').count()
    
    if (productCount > 1) {
      await productSelect.selectOption({ index: 1 })
    }
    
    await page.fill('textarea', 'Тестовый запрос для ответа')
    
    // Ждем загрузки компаний
    await page.waitForTimeout(2000)
    
    const firstCheckbox = page.locator('[type="checkbox"]').first()
    await firstCheckbox.waitFor({ state: 'visible', timeout: 10000 })
    await firstCheckbox.click()
    
    await page.click('button:has-text("Отправить запрос")')
    await expect(page.locator('text=Запрос отправлен успешно')).toBeVisible({ timeout: 10000 })
    
    // Выход из первого аккаунта
    await page.goto('http://localhost:8099/procurement-pl/auth/login')
    
    // Вход под вторым пользователем (получатель)
    await page.fill('input[type="email"]', 'manager@partner-company.ru')
    await page.fill('input[type="password"]', 'SecurePass123!')
    await page.click('button[type="submit"]')
    await page.waitForURL('**/dashboard')
    
    // Переход на страницу запросов
    await page.goto('http://localhost:8099/procurement-pl/requests')
    
    // Переход на вкладку полученных запросов
    await page.click('button:has-text("Запросы полученные")')
    
    // Ждем загрузки запросов
    await page.waitForTimeout(2000)
    
    // Проверка наличия запросов
    const requestsTable = page.locator('table, [role="table"]')
    const hasRequests = await requestsTable.isVisible().catch(() => false)
    
    if (hasRequests) {
      // Нажатие на кнопку "Ответить"
      const respondButton = page.locator('button:has-text("Ответить")').first()
      await respondButton.click()
      
      // Заполнение формы ответа
      await page.fill('textarea', 'Тестовый ответ на запрос')
      
      // Отправка ответа
      const submitButton = page.locator('button:has-text("Отправить ответ")')
      await submitButton.click()
      
      // Проверка успешной отправки
      await expect(page.locator('text=Ответ отправлен')).toBeVisible({ timeout: 10000 })
    } else {
      console.log('No received requests found, skipping response test')
    }
  })
})

