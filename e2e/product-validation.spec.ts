import { test, expect } from '@playwright/test'

const BASE_URL = 'http://localhost:8099/procurement-pl'
const TEST_USER = {
  email: 'admin@test-company.ru',
  password: 'SecurePass123!',
}

test.describe('Specialization Products (Я продаю) - Full CRUD', () => {
  test.beforeEach(async ({ page }) => {
    // Login
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

  test('should display Specialization tab', async ({ page }) => {
    const heading = page.getByRole('heading', { name: 'Специализация и услуги' })
    await expect(heading).toBeVisible()
  })

  test('should open add product dialog', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить продукт/услугу' })
    await expect(dialog).toBeVisible()
  })

  test('should display correct product categories', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    // Check that select has options
    const categorySelect = page.locator('select')
    const options = categorySelect.locator('option')
    
    const count = await options.count()
    expect(count).toBeGreaterThan(1) // More than just "Select category"
    
    // Check for specific categories
    await expect(categorySelect).toContainText('Товары')
    await expect(categorySelect).toContainText('Услуги')
    await expect(categorySelect).toContainText('Консалтинг')
  })

  test('should add new product with valid data', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    // Fill form
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const categorySelect = page.locator('select')
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    const urlInput = page.locator('input[placeholder*="https"]')
    
    await nameInput.fill('E2E Консалтинговые услуги')
    await categorySelect.selectOption('consulting')
    await descriptionInput.fill('Профессиональные консалтинговые услуги по цифровой трансформации и оптимизации бизнес-процессов')
    await urlInput.fill('https://example.com/consulting')
    
    // Submit
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await saveButton.click()
    
    // Wait for API call
    await page.waitForTimeout(1500)
    
    // Check if product appears
    const productName = page.getByText('E2E Консалтинговые услуги')
    await expect(productName).toBeVisible()
  })

  test('should display product category correctly', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const categorySelect = page.locator('select')
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    
    await nameInput.fill('Тестовая услуга')
    await categorySelect.selectOption('services')
    await descriptionInput.fill('Это тестовая услуга для проверки отображения категории')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await saveButton.click()
    
    await page.waitForTimeout(1500)
    
    // Check that category is displayed as text (not code)
    const serviceBadge = page.getByText('Услуги')
    await expect(serviceBadge).toBeVisible()
  })

  test('should edit existing product', async ({ page }) => {
    // Add a product first
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const categorySelect = page.locator('select')
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    
    await nameInput.fill('Продукт для редактирования')
    await categorySelect.selectOption('goods')
    await descriptionInput.fill('Это продукт который будет отредактирован в E2E тесте на протяжении нескольких итераций')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await saveButton.click()
    
    await page.waitForTimeout(1500)
    
    // Now find and click edit button
    const editButton = page.locator('button[title*="Редактировать"]').first()
    await editButton.click()
    
    // Check edit dialog is open
    const editDialog = page.getByRole('heading', { name: 'Редактировать продукт/услугу' })
    await expect(editDialog).toBeVisible()
    
    // Update name
    const editNameInput = page.locator('input[placeholder="Название"]').first()
    await editNameInput.fill('Продукт отредактирован')
    
    // Save
    const editSaveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await editSaveButton.click()
    
    await page.waitForTimeout(1500)
    
    // Verify update
    const updatedName = page.getByText('Продукт отредактирован')
    await expect(updatedName).toBeVisible()
  })

  test('should delete product', async ({ page }) => {
    // Add a product
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const categorySelect = page.locator('select')
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    
    await nameInput.fill('Продукт для удаления')
    await categorySelect.selectOption('materials')
    await descriptionInput.fill('Это продукт который будет удален в E2E тесте проверки функциональности')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await saveButton.click()
    
    await page.waitForTimeout(1500)
    
    // Verify product exists
    const productName = page.getByText('Продукт для удаления')
    await expect(productName).toBeVisible()
    
    // Delete it
    const deleteButton = page.locator('button[title*="Удалить"]').first()
    await deleteButton.click()
    
    await page.waitForTimeout(1500)
    
    // Verify deletion
    const deletedProduct = page.getByText('Продукт для удаления')
    const isGone = await deletedProduct.isVisible().catch(() => false)
    expect(isGone).toBeFalsy()
  })

  test('should display "View Product" link with correct text', async ({ page }) => {
    // Add a product
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    const urlInput = page.locator('input[placeholder*="https"]')
    
    await nameInput.fill('Продукт с ссылкой')
    await descriptionInput.fill('Продукт с ссылкой для проверки локализации текста кнопки просмотра')
    await urlInput.fill('https://example.com/product')
    
    const saveButton = page.getByRole('button', { name: 'Сохранить' }).last()
    await saveButton.click()
    
    await page.waitForTimeout(1500)
    
    // Check that "Перейти на продукт" link is visible (correct localization)
    const viewLink = page.getByText('Перейти на продукт')
    await expect(viewLink).toBeVisible()
  })

  test('should validate description length', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const nameInput = page.locator('input[placeholder="Название"]').first()
    const descriptionInput = page.locator('textarea[placeholder*="Минимум"]')
    
    await nameInput.fill('Товар')
    await descriptionInput.fill('Коротко')
    
    // Description counter should show
    const counter = page.locator('text=/\\d+\\/500/')
    await expect(counter).toBeVisible()
  })

  test('should close dialog with cancel button', async ({ page }) => {
    const addButton = page.getByRole('button', { name: 'Добавить продукт/услугу' })
    await addButton.click()
    
    const dialog = page.getByRole('heading', { name: 'Добавить продукт/услугу' })
    await expect(dialog).toBeVisible()
    
    const cancelButton = page.getByRole('button', { name: 'Отменить' }).first()
    await cancelButton.click()
    
    // Dialog should close
    const closed = await dialog.isVisible().catch(() => false)
    expect(closed).toBeFalsy()
  })
})
