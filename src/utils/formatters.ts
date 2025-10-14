import { format, formatDistanceToNow } from 'date-fns'
import { ru, enUS } from 'date-fns/locale'

/**
 * Format phone number to Russian format
 * @param phone - Phone number string
 * @returns Formatted phone number
 */
export const formatPhone = (phone: string): string => {
  const cleaned = phone.replace(/\D/g, '')
  
  if (cleaned.length === 11 && cleaned.startsWith('7')) {
    return `+7 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7, 9)}-${cleaned.slice(9, 11)}`
  }
  
  if (cleaned.length === 10) {
    return `+7 (${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6, 8)}-${cleaned.slice(8, 10)}`
  }
  
  return phone
}

/**
 * Format INN
 * @param inn - INN string
 * @returns Formatted INN
 */
export const formatINN = (inn: string): string => {
  const cleaned = inn.replace(/\D/g, '')
  
  if (cleaned.length === 10) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 10)}`
  }
  
  if (cleaned.length === 12) {
    return `${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 10)} ${cleaned.slice(10, 12)}`
  }
  
  return inn
}

/**
 * Format OGRN
 * @param ogrn - OGRN string
 * @returns Formatted OGRN
 */
export const formatOGRN = (ogrn: string): string => {
  const cleaned = ogrn.replace(/\D/g, '')
  
  if (cleaned.length === 13) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 10)} ${cleaned.slice(10, 13)}`
  }
  
  if (cleaned.length === 15) {
    return `${cleaned.slice(0, 1)} ${cleaned.slice(1, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 10)} ${cleaned.slice(10, 15)}`
  }
  
  return ogrn
}

/**
 * Format date to localized string
 * @param date - Date string or Date object
 * @param formatString - Format string (default: 'dd.MM.yyyy')
 * @param locale - Locale (default: 'ru')
 * @returns Formatted date
 */
export const formatDate = (
  date: string | Date,
  formatString: string = 'dd.MM.yyyy',
  locale: string = 'ru'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const localeObj = locale === 'ru' ? ru : enUS
  
  return format(dateObj, formatString, { locale: localeObj })
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param date - Date string or Date object
 * @param locale - Locale (default: 'ru')
 * @returns Relative time string
 */
export const formatRelativeTime = (
  date: string | Date,
  locale: string = 'ru'
): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date
  const localeObj = locale === 'ru' ? ru : enUS
  
  return formatDistanceToNow(dateObj, { addSuffix: true, locale: localeObj })
}

/**
 * Format currency to Russian Ruble
 * @param amount - Amount in rubles
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount)
}

/**
 * Format large numbers with K, M, B suffixes
 * @param num - Number to format
 * @returns Formatted number string
 */
export const formatCompactNumber = (num: number): string => {
  if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(1)}B`
  }
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(1)}K`
  }
  return num.toString()
}

/**
 * Truncate text to specified length
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export const truncateText = (
  text: string,
  maxLength: number,
  suffix: string = '...'
): string => {
  if (text.length <= maxLength) {
    return text
  }
  
  return text.slice(0, maxLength - suffix.length) + suffix
}

/**
 * Get initials from full name
 * @param firstName - First name
 * @param lastName - Last name
 * @returns Initials
 */
export const getInitials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase()
}

/**
 * Format file size
 * @param bytes - File size in bytes
 * @returns Formatted file size
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`
}

/**
 * Validate and format INN
 * @param inn - INN to validate
 * @returns Object with isValid and formatted INN
 */
export const validateINN = (inn: string): { isValid: boolean; formatted: string } => {
  const cleaned = inn.replace(/\D/g, '')
  
  if (cleaned.length !== 10 && cleaned.length !== 12) {
    return { isValid: false, formatted: inn }
  }
  
  return { isValid: true, formatted: formatINN(cleaned) }
}

/**
 * Validate and format OGRN
 * @param ogrn - OGRN to validate
 * @returns Object with isValid and formatted OGRN
 */
export const validateOGRN = (ogrn: string): { isValid: boolean; formatted: string } => {
  const cleaned = ogrn.replace(/\D/g, '')
  
  if (cleaned.length !== 13 && cleaned.length !== 15) {
    return { isValid: false, formatted: ogrn }
  }
  
  return { isValid: true, formatted: formatOGRN(cleaned) }
}

