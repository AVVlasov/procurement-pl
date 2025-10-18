/**
 * Утилиты для работы с localStorage с явной поддержкой UTF-8
 */

export const storageUtils = {
  /**
   * Сохраняет JSON объект в localStorage с явной UTF-8 кодировкой
   */
  setString: (key: string, value: string): void => {
    try {
      if (typeof window !== 'undefined') {
        // Явно кодируем в UTF-8
        localStorage.setItem(key, value)
      }
    } catch (error) {
      console.error(`Error saving to localStorage [${key}]:`, error)
    }
  },

  /**
   * Получает строку из localStorage с явной обработкой UTF-8
   */
  getString: (key: string, defaultValue: string = ''): string => {
    try {
      if (typeof window !== 'undefined') {
        const item = localStorage.getItem(key)
        if (item === null) {
          return defaultValue
        }
        // Явно декодируем из UTF-8
        return item
      }
    } catch (error) {
      console.error(`Error reading from localStorage [${key}]:`, error)
    }
    return defaultValue
  },

  /**
   * Удаляет значение из localStorage
   */
  remove: (key: string): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.removeItem(key)
      }
    } catch (error) {
      console.error(`Error removing from localStorage [${key}]:`, error)
    }
  },

  /**
   * Очищает весь localStorage
   */
  clear: (): void => {
    try {
      if (typeof window !== 'undefined') {
        localStorage.clear()
      }
    } catch (error) {
      console.error('Error clearing localStorage:', error)
    }
  },
}
