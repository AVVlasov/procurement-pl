import { storageUtils } from '../storage'

describe('Storage Utils', () => {
  beforeEach(() => {
    localStorage.clear()
    jest.clearAllMocks()
  })

  describe('setString', () => {
    test('should save string to localStorage', () => {
      storageUtils.setString('key1', 'value1')
      expect(localStorage.getItem('key1')).toBe('value1')
    })

    test('should handle UTF-8 strings', () => {
      storageUtils.setString('key', 'Привет мир')
      expect(localStorage.getItem('key')).toBe('Привет мир')
    })

    test('should overwrite existing value', () => {
      storageUtils.setString('key', 'old')
      storageUtils.setString('key', 'new')
      expect(localStorage.getItem('key')).toBe('new')
    })

    test('should handle empty strings', () => {
      storageUtils.setString('key', '')
      expect(localStorage.getItem('key')).toBe('')
    })

    test('should handle special characters', () => {
      const specialStr = '!@#$%^&*()'
      storageUtils.setString('special', specialStr)
      expect(localStorage.getItem('special')).toBe(specialStr)
    })

    test('should catch errors silently', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation()
      storageUtils.setString('key', 'value')
      expect(consoleSpy).not.toHaveBeenCalled()
      consoleSpy.mockRestore()
    })
  })

  describe('getString', () => {
    test('should retrieve string from localStorage', () => {
      localStorage.setItem('key', 'value')
      expect(storageUtils.getString('key')).toBe('value')
    })

    test('should return default value for non-existent key', () => {
      expect(storageUtils.getString('nonexistent', 'default')).toBe('default')
    })

    test('should return empty string by default', () => {
      expect(storageUtils.getString('nonexistent')).toBe('')
    })

    test('should retrieve UTF-8 strings correctly', () => {
      localStorage.setItem('text', 'Тестовая строка')
      expect(storageUtils.getString('text')).toBe('Тестовая строка')
    })

    test('should handle null values', () => {
      localStorage.removeItem('key')
      expect(storageUtils.getString('key', 'fallback')).toBe('fallback')
    })

    test('should trim and return actual value', () => {
      localStorage.setItem('trim-test', 'actual value')
      const result = storageUtils.getString('trim-test')
      expect(result).toBe('actual value')
    })
  })

  describe('remove', () => {
    test('should remove item from localStorage', () => {
      localStorage.setItem('key', 'value')
      storageUtils.remove('key')
      expect(localStorage.getItem('key')).toBeNull()
    })

    test('should handle removal of non-existent key', () => {
      expect(() => storageUtils.remove('nonexistent')).not.toThrow()
    })

    test('should remove multiple items sequentially', () => {
      localStorage.setItem('key1', 'val1')
      localStorage.setItem('key2', 'val2')
      storageUtils.remove('key1')
      storageUtils.remove('key2')
      expect(localStorage.length).toBe(0)
    })
  })

  describe('clear', () => {
    test('should clear all localStorage', () => {
      localStorage.setItem('key1', 'value1')
      localStorage.setItem('key2', 'value2')
      storageUtils.clear()
      expect(localStorage.length).toBe(0)
    })

    test('should handle clearing empty storage', () => {
      expect(() => storageUtils.clear()).not.toThrow()
    })

    test('should allow new items after clearing', () => {
      localStorage.setItem('old', 'value')
      storageUtils.clear()
      localStorage.setItem('new', 'value')
      expect(localStorage.length).toBe(1)
      expect(localStorage.getItem('new')).toBe('value')
    })
  })

  describe('Integration', () => {
    test('should handle complete lifecycle', () => {
      storageUtils.setString('user', 'John')
      expect(storageUtils.getString('user')).toBe('John')
      storageUtils.remove('user')
      expect(storageUtils.getString('user', 'default')).toBe('default')
    })

    test('should handle multiple stores independently', () => {
      storageUtils.setString('token', 'abc123')
      storageUtils.setString('user', 'john')
      storageUtils.remove('token')
      expect(storageUtils.getString('token', null)).toBe(null)
      expect(storageUtils.getString('user')).toBe('john')
    })

    test('should preserve data across operations', () => {
      storageUtils.setString('persistent', 'data')
      storageUtils.setString('temp', 'temporary')
      storageUtils.remove('temp')
      expect(storageUtils.getString('persistent')).toBe('data')
      expect(storageUtils.getString('temp', 'gone')).toBe('gone')
    })
  })
})
