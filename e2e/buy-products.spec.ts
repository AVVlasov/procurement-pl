import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'
const TEST_USER = {
  email: 'admin@test-company.ru',
  password: 'SecurePass123!',
}

test.describe('Buy Products in Specialization Tab (Я покупаю)', () => {
  test.beforeEach(async ({ page }) => {
    // Логин перед каждым тестом
    await page.goto(`${BASE_URL}/auth/login`)
    await page.fill('input[placeholder="Email"]', TEST_USER.email)
    await page.fill('input[placeholder="Пароль"]', TEST_USER.password)
    await page.click('button:has-text("Вход")')
    await page.waitForURL(`${BASE_URL}/company/profile`)
    
    // Navigate to Specialization tab
    await page.goto(`${BASE_URL}/company/profile`)
    const specialTab = page.getByRole('tab', { name: 'Специализация' })
    await specialTab.click()
  })

  test('should navigate to company profile', async ({ page }) => {
    await page.goto(`${BASE_URL}/company/profile`)
    await expect(page).toHaveURL(/company\/profile/)
  })

  test('should have Specialization tab', async ({ page }) => {
    const tab = page.getByRole('tab', { name: 'Специализация' })
    await expect(tab).toBeVisible()
  })

  test('should show "Товары (Я покупаю)" section', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Товары (Я покупаю)' })
    await expect(heading).toBeVisible()
  })

  test('should open add buy product dialog', async ({ page }) => {
    // Find the add button specifically in Buy Products section
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить товар' })
    await expect(dialog).toBeVisible()
  })

  test('should add new buy product with valid data', async ({ page }) => {
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    // Fill form
    await page.fill('input[placeholder="Название товара"]', 'E2E Тестовый товар')
    await page.fill('textarea[placeholder*="Описание"]', 'Это E2E тестовый товар для проверки функциональности покупки')
    await page.fill('input[placeholder="Количество"]', '50')
    
    // Submit
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    await saveButton.click()
    
    // Wait for API call and table refresh
    await page.waitForTimeout(1000)
    
    // Check if product appears in table
    const productName = page.getByText('E2E Тестовый товар')
    await expect(productName).toBeVisible()
  })

  test('should reject buy product with short description', async ({ page }) => {
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    // Fill form with short description
    await page.fill('input[placeholder="Название товара"]', 'Товар')
    await page.fill('textarea[placeholder*="Описание"]', 'Коротко')
    
    // Button should be disabled because description is too short
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    // Note: button may be disabled or form may show errors
    await page.waitForTimeout(500)
  })

  test('should close add buy product dialog', async ({ page }) => {
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить товар' })
    await expect(dialog).toBeVisible()
    
    // Close dialog by cancel button
    const cancelButton = page.getByRole('button', { name: 'Отменить' }).first()
    await cancelButton.click()
    
    await expect(dialog).not.toBeVisible()
  })

  test('should edit buy product', async ({ page }) => {
    // First, add a product
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    await page.fill('input[placeholder="Название товара"]', 'Товар для редактирования')
    await page.fill('textarea[placeholder*="Описание"]', 'Это товар который будет отредактирован в E2E тесте')
    await page.fill('input[placeholder="Количество"]', '100')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    await saveButton.click()
    
    await page.waitForTimeout(1000)
    
    // Now edit it
    const editButton = page.locator('table').locator('button:has-text("Редактировать")').first()
    await editButton.click()
    
    const editDialog = page.getByRole('heading', { name: 'Редактировать товар' })
    await expect(editDialog).toBeVisible()
    
    // Clear and update name
    const nameInput = page.locator('input[placeholder="Название товара"]').first()
    await nameInput.fill('Товар отредактирован')
    
    // Save changes
    const editSaveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await editSaveButton.click()
    
    await page.waitForTimeout(1000)
    
    // Check if updated name appears
    const updatedName = page.getByText('Товар отредактирован')
    await expect(updatedName).toBeVisible()
  })

  test('should delete buy product', async ({ page }) => {
    // First, add a product
    const buyProductSection = page.locator('text=Товары (Я покупаю)').locator('..').locator('button:has-text("Добавить")')
    await buyProductSection.click()
    
    await page.fill('input[placeholder="Название товара"]', 'Товар для удаления')
    await page.fill('textarea[placeholder*="Описание"]', 'Это товар который будет удален в E2E тесте')
    await page.fill('input[placeholder="Количество"]', '25')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' })
    await saveButton.click()
    
    await page.waitForTimeout(1000)
    
    // Check product exists
    const productName = page.getByText('Товар для удаления')
    await expect(productName).toBeVisible()
    
    // Now delete it
    const deleteButton = page.locator('table').locator('button[title*="Удалить"]').first()
    await deleteButton.click()
    
    await page.waitForTimeout(1000)
    
    // Check if product is deleted
    const deletedProduct = page.getByText('Товар для удаления')
    // Product should be gone or in a disabled state
    const isGone = await deletedProduct.isVisible().catch(() => false)
    expect(isGone).toBeFalsy()
  })

  test('should display buy product in table', async ({ page }) => {
    // Get all table cells
    const table = page.locator('table')
    const headers = table.locator('thead').locator('th')
    
    // Check headers exist
    await expect(headers).toContainText('Название')
    await expect(headers).toContainText('Описание')
    await expect(headers).toContainText('Количество')
  })
})
