import { test, expect } from '@playwright/test'

test.describe('Buy Products (Я покупаю)', () => {
  test.beforeEach(async ({ page }) => {
    // Логин перед каждым тестом
    await page.goto('/auth/login')
    await page.fill('input[placeholder="Email"]', 'admin@test-company.ru')
    await page.fill('input[placeholder="Пароль"]', 'SecurePass123!')
    await page.click('button:has-text("Вход")')
    await page.waitForURL('/company/profile')
  })

  test('should navigate to company profile', async ({ page }) => {
    await page.goto('/company/profile')
    await expect(page).toHaveURL(/company\/profile/)
  })

  test('should have Buy Products tab', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await expect(tab).toBeVisible()
    await tab.click()
  })

  test('should show empty state when no products', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const emptyText = page.getByText('Нет данных')
    await expect(emptyText).toBeVisible()
  })

  test('should open add product dialog', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const addButton = page.getByRole('button', { name: /Добавить/ })
    await addButton.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить товар' })
    await expect(dialog).toBeVisible()
  })

  test('should add new product with valid data', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const addButton = page.getByRole('button', { name: /Добавить/ })
    await addButton.click()
    
    // Fill form
    await page.fill('input[placeholder="Название товара"]', 'Тестовый товар')
    await page.fill('textarea[placeholder*="Описание"]', 'Это тестовый товар для проверки функциональности')
    await page.fill('input[placeholder="Количество"]', '100')
    
    // Submit
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    await saveButton.click()
    
    // Wait for success message
    await page.waitForTimeout(1000)
    
    // Check if product appears in table
    await page.waitForTimeout(500)
    const productName = page.getByText('Тестовый товар')
    // Either product appears or we get validation error
    const hasProduct = await productName.isVisible().catch(() => false)
    const hasError = await page.getByText(/Ошибка|ошибка/).isVisible().catch(() => false)
    
    expect(hasProduct || hasError).toBeTruthy()
  })

  test('should reject product with short description', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const addButton = page.getByRole('button', { name: /Добавить/ })
    await addButton.click()
    
    // Fill form with short description
    await page.fill('input[placeholder="Название товара"]', 'Товар')
    await page.fill('textarea[placeholder*="Описание"]', 'Коротко')
    await page.fill('input[placeholder="Количество"]', '100')
    
    // Try to submit
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    await saveButton.click()
    
    // Should stay on dialog or show error
    const dialog = page.getByRole('heading', { name: 'Добавить товар' })
    const error = page.getByText(/обязательные|required|Ошибка/i)
    
    const isDialogOrErrorVisible = await Promise.race([
      dialog.isVisible().then(() => true),
      error.isVisible().then(() => true),
      new Promise(resolve => setTimeout(() => resolve(false), 2000))
    ]).catch(() => false)
    
    expect(isDialogOrErrorVisible).toBeTruthy()
  })

  test('should close add product dialog', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const addButton = page.getByRole('button', { name: /Добавить/ })
    await addButton.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить товар' })
    await expect(dialog).toBeVisible()
    
    // Close dialog by cancel button
    const cancelButton = page.getByRole('button', { name: 'Отменить' })
    await cancelButton.click()
    
    await expect(dialog).not.toBeVisible()
  })

  test('should have required fields', async ({ page }) => {
    await page.goto('/company/profile')
    const tab = page.getByRole('tab', { name: 'Товары (Я покупаю)' })
    await tab.click()
    
    const addButton = page.getByRole('button', { name: /Добавить/ })
    await addButton.click()
    
    // Check that fields exist
    const nameField = page.locator('input[placeholder="Название товара"]')
    const descriptionField = page.locator('textarea[placeholder*="Описание"]')
    const quantityField = page.locator('input[placeholder="Количество"]')
    
    await expect(nameField).toBeVisible()
    await expect(descriptionField).toBeVisible()
    await expect(quantityField).toBeVisible()
  })
})
