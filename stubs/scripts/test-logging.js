#!/usr/bin/env node

/**
 * Скрипт для тестирования логирования
 * 
 * Использование:
 * node stubs/scripts/test-logging.js          # Логи скрыты (DEV не установлена)
 * DEV=true node stubs/scripts/test-logging.js # Логи видны
 */

// Функция логирования из маршрутов
const log = (message, data = '') => {
  if (process.env.DEV === 'true') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

console.log('');
console.log('='.repeat(60));
console.log('TEST: Логирование с переменной окружения DEV');
console.log('='.repeat(60));
console.log('');

console.log('Значение DEV:', process.env.DEV || '(не установлена)');
console.log('');

// Тестируем различные логи
log('[Auth] Token verified - userId: 68fe2ccda3526c303ca06799 companyId: 68fe2ccda3526c303ca06796');
log('[Auth] Generating token for userId:', '68fe2ccda3526c303ca06799');
log('[BuyProducts] Found', 0, 'products for company 68fe2ccda3526c303ca06796');
log('[Products] GET Fetching products for companyId:', '68fe2ccda3526c303ca06799');
log('[Products] Found', 1, 'products');
log('[Reviews] Returned', 0, 'reviews for company 68fe2ccda3526c303ca06796');
log('[Messages] Fetching threads for companyId:', '68fe2ccda3526c303ca06796');
log('[Messages] Found', 4, 'messages for company');
log('[Messages] Returned', 3, 'unique threads');
log('[Search] Request params:', { query: '', page: 1 });

console.log('');
console.log('='.repeat(60));
console.log('РЕЗУЛЬТАТ:');
console.log('='.repeat(60));

if (process.env.DEV === 'true') {
  console.log('✅ DEV=true - логи ВИДНЫ выше');
} else {
  console.log('❌ DEV не установлена или != "true" - логи СКРЫТЫ');
  console.log('');
  console.log('Для включения логов запустите:');
  console.log('  export DEV=true && npm start (Linux/Mac)');
  console.log('  $env:DEV = "true"; npm start (PowerShell)');
  console.log('  set DEV=true && npm start (CMD)');
}

console.log('');
console.log('='.repeat(60));
console.log('');
