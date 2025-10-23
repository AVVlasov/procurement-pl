import { test, expect } from '@playwright/test'

const TEST_USER_EMAIL = 'admin@test-company.ru'
const TEST_USER_PASSWORD = 'SecurePass123!'

test.describe('Product Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:8099/procurement-pl')
    
    // Login
    await page.fill('input[type="email"]', TEST_USER_EMAIL)
    await page.fill('input[type="password"]', TEST_USER_PASSWORD)
    await page.click('button:has-text("Вход")')
    
    // Wait for redirect to dashboard
    await page.waitForURL('**/dashboard')
    
    // Navigate to company profile
    await page.click('a:has-text("Профиль компании")')
    await page.waitForLoadState('networkidle')
  })

  test('should show validation errors for product with short description', async ({ page }) => {
    // Click add product button in Specialization tab
    await page.click('button:has-text("Добавить товар")')
    
    // Wait for dialog
    await page.waitForSelector('[role="dialog"]')
    
    // Fill form with invalid data
    await page.fill('input[placeholder*="Название"]', 'Test Product')
    await page.click('select')
    await page.selectOption('select', { label: 'Электроника' })
    await page.fill('textarea', 'Short') // Less than 20 chars
    
    // Click save
    await page.click('button:has-text("Сохранить")')
    
    // Check for error message
    const errorText = await page.locator('text=Минимум 20 символов').isVisible()
    expect(errorText).toBeTruthy()
  })

  test('should show validation error for empty description', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Добавить товар")')
    await page.waitForSelector('[role="dialog"]')
    
    // Fill only required fields except description
    await page.fill('input[placeholder*="Название"]', 'Test Product')
    await page.click('select')
    await page.selectOption('select', { label: 'Электроника' })
    
    // Click save without filling description
    await page.click('button:has-text("Сохранить")')
    
    // Check for error
    const errorText = await page.locator('text=Описание обязательно').isVisible()
    expect(errorText).toBeTruthy()
  })

  test('should display character counter for description', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Добавить товар")')
    await page.waitForSelector('[role="dialog"]')
    
    // Check if character counter is visible
    const counter = await page.locator('text=/\\d+\\/500/').isVisible()
    expect(counter).toBeTruthy()
    
    // Type in description
    const textarea = page.locator('textarea')
    await textarea.fill('This is a valid product description with at least 20 characters.')
    
    // Check counter updates
    const counterText = await page.locator('text=/\\d+\\/500/').textContent()
    expect(counterText).toContain('60/500')
  })

  test('should show error for description exceeding max length', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Добавить товар")')
    await page.waitForSelector('[role="dialog"]')
    
    // Fill form with description exceeding max length
    await page.fill('input[placeholder*="Название"]', 'Test Product')
    await page.click('select')
    await page.selectOption('select', { label: 'Электроника' })
    
    // Create string with 501 characters
    const longText = 'a'.repeat(501)
    await page.fill('textarea', longText)
    
    // Click save
    await page.click('button:has-text("Сохранить")')
    
    // Check for error message
    const errorText = await page.locator('text=Максимум 500 символов').isVisible()
    expect(errorText).toBeTruthy()
  })

  test('should allow valid product creation', async ({ page }) => {
    // Click add product button
    await page.click('button:has-text("Добавить товар")')
    await page.waitForSelector('[role="dialog"]')
    
    // Fill form with valid data
    await page.fill('input[placeholder*="Название"]', 'Valid Test Product')
    await page.click('select')
    await page.selectOption('select', { label: 'Электроника' })
    await page.fill('textarea', 'This is a valid product description with more than 20 characters.')
    
    // Click save
    await page.click('button:has-text("Сохранить")')
    
    // Wait for success and dialog to close
    await page.waitForTimeout(1000)
    const isDialogOpen = await page.locator('[role="dialog"]').isVisible().catch(() => false)
    expect(isDialogOpen).toBeFalsy()
  })

  test('should validate buy products with same rules', async ({ page }) => {
    // Navigate to buy products tab
    await page.click('button:has-text("Я покупаю")')
    await page.waitForLoadState('networkidle')
    
    // Click add button
    await page.click('button:has-text("Добавить товар")')
    await page.waitForSelector('[role="dialog"]')
    
    // Fill with short description
    await page.fill('input[placeholder*="Название"]', 'Buy Product')
    await page.fill('textarea', 'Short')
    
    // Click save
    await page.click('button:has-text("Сохранить")')
    
    // Check for error
    const errorText = await page.locator('text=Минимум 20 символов').isVisible()
    expect(errorText).toBeTruthy()
  })
})
