import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// Import translation files
import commonRu from '../locales/ru/common.json'
import authRu from '../locales/ru/auth.json'
import dashboardRu from '../locales/ru/dashboard.json'
import companyRu from '../locales/ru/company.json'
import searchRu from '../locales/ru/search.json'

import commonEn from '../locales/en/common.json'
import authEn from '../locales/en/auth.json'
import dashboardEn from '../locales/en/dashboard.json'
import companyEn from '../locales/en/company.json'
import searchEn from '../locales/en/search.json'

const resources = {
  ru: {
    common: commonRu,
    auth: authRu,
    dashboard: dashboardRu,
    company: companyRu,
    search: searchRu,
  },
  en: {
    common: commonEn,
    auth: authEn,
    dashboard: dashboardEn,
    company: companyEn,
    search: searchEn,
  },
}

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'ru',
    defaultNS: 'common',
    ns: ['common', 'auth', 'dashboard', 'company', 'search'],
    
    interpolation: {
      escapeValue: false, // React already escapes
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })

export default i18n

