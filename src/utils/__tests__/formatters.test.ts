import {
  formatPhone,
  formatINN,
  formatOGRN,
  formatDate,
  formatRelativeTime,
  formatCurrency,
  formatCompactNumber,
  truncateText,
  getInitials,
  formatFileSize,
  validateINN,
  validateOGRN,
} from '../formatters'

describe('formatters', () => {
  describe('formatPhone', () => {
    test('should format 11-digit number with leading 7', () => {
      expect(formatPhone('79991234567')).toBe('+7 (999) 123-45-67')
    })

    test('should format 10-digit number', () => {
      expect(formatPhone('9991234567')).toBe('+7 (999) 123-45-67')
    })

    test('should return original if invalid length', () => {
      expect(formatPhone('123')).toBe('123')
    })

    test('should handle phone with special characters', () => {
      expect(formatPhone('+7 (999) 123-45-67')).toBe('+7 (999) 123-45-67')
    })

    test('should handle empty string', () => {
      expect(formatPhone('')).toBe('')
    })
  })

  describe('formatINN', () => {
    test('should format 10-digit INN', () => {
      expect(formatINN('7712345678')).toBe('77 12 345678')
    })

    test('should format 12-digit INN', () => {
      expect(formatINN('771234567890')).toBe('77 12 345678 90')
    })

    test('should return original if invalid length', () => {
      expect(formatINN('123')).toBe('123')
    })

    test('should handle INN with spaces', () => {
      expect(formatINN('77 12 345678')).toBe('77 12 345678')
    })
  })

  describe('formatOGRN', () => {
    test('should format 13-digit OGRN', () => {
      expect(formatOGRN('1234567890123')).toBe('1 23 45 67890 123')
    })

    test('should format 15-digit OGRN', () => {
      expect(formatOGRN('123456789012345')).toBe('1 23 45 67890 12345')
    })

    test('should return original if invalid length', () => {
      expect(formatOGRN('123')).toBe('123')
    })
  })

  describe('formatDate', () => {
    test('should format date with default format', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date)
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    })

    test('should format string date', () => {
      const result = formatDate('2024-01-15')
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    })

    test('should use custom format string', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'yyyy-MM-dd')
      expect(result).toContain('2024')
    })

    test('should handle different locale', () => {
      const date = new Date('2024-01-15')
      const result = formatDate(date, 'dd.MM.yyyy', 'en')
      expect(result).toMatch(/\d{2}\.\d{2}\.\d{4}/)
    })
  })

  describe('formatRelativeTime', () => {
    test('should format relative time', () => {
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)
      const result = formatRelativeTime(yesterday)
      expect(result).toContain('назад')
    })

    test('should handle string date', () => {
      const now = new Date().toISOString()
      const result = formatRelativeTime(now)
      expect(result).toBeTruthy()
    })
  })

  describe('formatCurrency', () => {
    test('should format currency with RUB symbol', () => {
      const result = formatCurrency(1000)
      expect(result).toContain('1')
      expect(result).toContain('000')
    })

    test('should format zero', () => {
      const result = formatCurrency(0)
      expect(result).toContain('0')
    })

    test('should format large numbers', () => {
      const result = formatCurrency(1000000)
      expect(result).toBeTruthy()
    })

    test('should handle decimal values', () => {
      const result = formatCurrency(1000.50)
      expect(result).toBeTruthy()
    })
  })

  describe('formatCompactNumber', () => {
    test('should format billions', () => {
      expect(formatCompactNumber(1500000000)).toBe('1.5B')
    })

    test('should format millions', () => {
      expect(formatCompactNumber(1500000)).toBe('1.5M')
    })

    test('should format thousands', () => {
      expect(formatCompactNumber(1500)).toBe('1.5K')
    })

    test('should return number as string if less than 1000', () => {
      expect(formatCompactNumber(500)).toBe('500')
    })

    test('should handle zero', () => {
      expect(formatCompactNumber(0)).toBe('0')
    })
  })

  describe('truncateText', () => {
    test('should truncate long text', () => {
      const text = 'This is a very long text that should be truncated'
      expect(truncateText(text, 10)).toBe('This is...')
    })

    test('should not truncate short text', () => {
      const text = 'Short'
      expect(truncateText(text, 10)).toBe('Short')
    })

    test('should use custom suffix', () => {
      const text = 'This is a very long text'
      expect(truncateText(text, 10, '>>>')).toBe('This is>>>')
    })

    test('should handle exact length', () => {
      const text = 'Hello'
      expect(truncateText(text, 5)).toBe('Hello')
    })

    test('should handle empty string', () => {
      expect(truncateText('', 10)).toBe('')
    })
  })

  describe('getInitials', () => {
    test('should get initials from names', () => {
      expect(getInitials('John', 'Doe')).toBe('JD')
    })

    test('should uppercase initials', () => {
      expect(getInitials('john', 'doe')).toBe('JD')
    })

    test('should handle single character names', () => {
      expect(getInitials('A', 'B')).toBe('AB')
    })

    test('should handle long names', () => {
      expect(getInitials('Alexander', 'Pushkin')).toBe('AP')
    })
  })

  describe('formatFileSize', () => {
    test('should format zero bytes', () => {
      expect(formatFileSize(0)).toBe('0 Bytes')
    })

    test('should format bytes', () => {
      expect(formatFileSize(512)).toContain('Bytes')
    })

    test('should format kilobytes', () => {
      const result = formatFileSize(1024)
      expect(result).toContain('KB')
    })

    test('should format megabytes', () => {
      const result = formatFileSize(1024 * 1024)
      expect(result).toContain('MB')
    })

    test('should format gigabytes', () => {
      const result = formatFileSize(1024 * 1024 * 1024)
      expect(result).toContain('GB')
    })
  })

  describe('validateINN', () => {
    test('should validate 10-digit INN', () => {
      const result = validateINN('7712345678')
      expect(result.isValid).toBe(true)
      expect(result.formatted).toBe('77 12 345678')
    })

    test('should validate 12-digit INN', () => {
      const result = validateINN('771234567890')
      expect(result.isValid).toBe(true)
      expect(result.formatted).toBe('77 12 345678 90')
    })

    test('should invalidate wrong length', () => {
      const result = validateINN('123')
      expect(result.isValid).toBe(false)
    })

    test('should handle INN with non-digits', () => {
      const result = validateINN('77-123-456-78')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateOGRN', () => {
    test('should validate 13-digit OGRN', () => {
      const result = validateOGRN('1234567890123')
      expect(result.isValid).toBe(true)
      expect(result.formatted).toBe('1 23 45 67890 123')
    })

    test('should validate 15-digit OGRN', () => {
      const result = validateOGRN('123456789012345')
      expect(result.isValid).toBe(true)
      expect(result.formatted).toBe('1 23 45 67890 12345')
    })

    test('should invalidate wrong length', () => {
      const result = validateOGRN('123')
      expect(result.isValid).toBe(false)
    })

    test('should handle OGRN with non-digits', () => {
      const result = validateOGRN('1-23-45-67890-123')
      expect(result.isValid).toBe(true)
    })
  })
})
