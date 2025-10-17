# 🐛 Баг BUG-002: Hardcoded строки в компоненте Messages вместо локализации

## Информация о баге

**Bug ID**: BUG-2025-10-17-002  
**Дата обнаружения**: 17.10.2025  
**Модуль**: Messaging  
**Тип**: Интернационализация (i18n)  
**Приоритет**: P1 (Высокий)  
**Серьезность**: Major  

---

## Классификация

**Тип ошибки**: Отсутствие локализации

**Описание ошибки требования**:
В требованиях указано, что все текстовые строки должны быть локализованы через i18next (ru/en). Hardcoded строки нарушают требование полной многоязычной поддержки.

---

## Описание проблемы

### Краткое резюме
В компоненте `MessagesPage` присутствуют hardcoded (жестко закодированные) русские строки, которые не переводятся при переключении на английский язык.

### Детальное описание

**Файл**: `src/pages/messages/messages.tsx`

**Найденные hardcoded строки**:

1. **Строка 36**: Кнопка "Новое сообщение"
```tsx
<Text ml={2}>Новое сообщение</Text>  // ❌ HARDCODED
```

2. **Строка 70**: Empty state текст
```tsx
<Text fontWeight="bold">{activeThread ? activeThread.id : t('labels.no_data')}</Text>
// Проблема: при activeThread === null выводит ID вместо названия компании
```

3. **Строка 92**: Placeholder для Input
```tsx
<Input placeholder={t('messages.placeholder', 'Напишите сообщение...')} ... />
// ❌ Fallback 'Напишите сообщение...' не переведен на English
```

4. **Строка 95**: Текст на кнопке отправки
```tsx
<Text ml={2}>{t('messages.newMessage', 'Отправить')}</Text>
// ❌ Fallback 'Отправить' не переведен на English
```

### Проблема с интеграцией

**Файл**: `locales/ru/common.json`

Существует, но нет соответствующих ключей:
- `messages.placeholder` - есть fallback, но нет в JSON
- `messages.newMessage` - есть fallback, но нет в JSON

**Файл**: `locales/en/common.json`

Полностью отсутствуют ключи для Messages модуля.

---

## Шаги воспроизведения

### Предусловия
- Сервер запущен (http://localhost:3000)
- Mock API запущен
- Пользователь залогинен
- Есть диалоги в системе

### Шаги
1. Залогиниться в систему
2. Открыть `/messages`
3. Проверить текст на странице (все на русском)
4. Переключить язык на English (в header language selector)
5. Обновить страницу или вернуться на Messages

### Ожидаемый результат
- ✅ Все текст на английском языке
- ✅ "New Message" вместо "Новое сообщение"
- ✅ "Write a message..." вместо "Напишите сообщение..."
- ✅ "Send" вместо "Отправить"

### Фактический результат
- ❌ Текст остается на русском
- ❌ Button text: "Новое сообщение" (should be "New Message")
- ❌ Placeholder: "Напишите сообщение..." (should be "Write a message...")
- ❌ Send button text: "Отправить" (should be "Send")

---

## Анализ кода

### Текущая реализация (НЕПРАВИЛЬНАЯ)

**Файл**: `src/pages/messages/messages.tsx` (строка 36)

```tsx
<Button colorPalette="blue" size="sm">
  <FiSend />
  <Text ml={2}>Новое сообщение</Text>  // ❌ HARDCODED
</Button>
```

**Файл**: `src/pages/messages/messages.tsx` (строка 92)

```tsx
<Input 
  placeholder={t('messages.placeholder', 'Напишите сообщение...')}  // ❌ Fallback HARDCODED
  value={text} 
  onChange={(e) => setText(e.target.value)} 
  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }} 
/>
```

**Файл**: `src/pages/messages/messages.tsx` (строка 95)

```tsx
<Button colorPalette="blue" onClick={handleSend} disabled={!text.trim()} loading={isLoading}>
  <FiSend />
  <Text ml={2}>{t('messages.newMessage', 'Отправить')}</Text>  // ❌ Fallback HARDCODED
</Button>
```

### Локализационные файлы (НЕПОЛНЫЕ)

**Файл**: `locales/ru/common.json`

```json
{
  // ... существующие ключи ...
  "nav": {
    "messages": "Сообщения"
  }
  // ❌ Отсутствуют:
  // "messages.placeholder": "Напишите сообщение..."
  // "messages.newMessage": "Отправить"
  // "messages.newMessageButton": "Новое сообщение"
}
```

**Файл**: `locales/en/common.json`

```json
{
  // ... existing keys ...
  // ❌ ПОЛНОСТЬЮ ОТСУТСТВУЮТ КЛЮЧИ ДЛЯ MESSAGES
}
```

---

## Требуемые изменения

### 1. Обновить `locales/ru/common.json`

```json
{
  "messages": {
    "title": "Сообщения",
    "newMessageButton": "Новое сообщение",
    "newMessageTitle": "Новое сообщение",
    "newMessage": "Отправить",
    "placeholder": "Напишите сообщение...",
    "noData": "Нет сообщений",
    "noThreads": "Нет диалогов"
  }
}
```

### 2. Обновить `locales/en/common.json`

```json
{
  "messages": {
    "title": "Messages",
    "newMessageButton": "New Message",
    "newMessageTitle": "New Message",
    "newMessage": "Send",
    "placeholder": "Write a message...",
    "noData": "No messages",
    "noThreads": "No conversations"
  }
}
```

### 3. Обновить компонент `src/pages/messages/messages.tsx`

**Строка 36**:
```tsx
// ❌ БЫЛО:
<Text ml={2}>Новое сообщение</Text>

// ✅ СТАЛО:
<Text ml={2}>{t('messages.newMessageButton')}</Text>
```

**Строка 92**:
```tsx
// ❌ БЫЛО:
placeholder={t('messages.placeholder', 'Напишите сообщение...')}

// ✅ СТАЛО:
placeholder={t('messages.placeholder')}
```

**Строка 95**:
```tsx
// ❌ БЫЛО:
<Text ml={2}>{t('messages.newMessage', 'Отправить')}</Text>

// ✅ СТАЛО:
<Text ml={2}>{t('messages.newMessage')}</Text>
```

### 4. Добавить проверку в i18n конфиг

Убедиться, что в `src/i18n.ts` подключены оба языковых файла:

```typescript
import messagesRu from '../locales/ru/common.json'
import messagesEn from '../locales/en/common.json'

i18n.addResourceBundle('ru', 'common', messagesRu, true, true)
i18n.addResourceBundle('en', 'common', messagesEn, true, true)
```

---

## Окружение

- **Браузер**: Chrome (Latest)
- **ОС**: Windows 10/11
- **URL**: http://localhost:3000/messages

---

## Затронутые тест-кейсы

- ✓ TC-MESSAGES-001-006: Все тесты сообщений (ЛОКАЛИЗАЦИЯ ПРОВАЛЕНА)

---

## Связанные файлы

- `src/pages/messages/messages.tsx`
- `locales/ru/common.json`
- `locales/en/common.json`
- `src/i18n.ts`

---

## Влияние на функционал

- **Критичность**: High (P1)
- **Область воздействия**: Все пользователи английской локали
- **Пользовательский опыт**: Плохой - смешивание языков в одном компоненте
- **Требования**: Нарушение требования полной i18n поддержки

---

## Комментарии

**QA Engineer** (17.10.2025):
> При переключении на английский язык, страница Сообщений остается частично на русском. Это нарушает требование полной локализации и портит пользовательский опыт для англоязычных пользователей.

---

**Статус**: New  
**Автор**: QA Testing Team  
**Дата создания**: 17.10.2025

