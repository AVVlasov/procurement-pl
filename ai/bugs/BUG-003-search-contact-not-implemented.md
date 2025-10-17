# 🐛 Баг BUG-003: Функция "Связаться" в поиске не реализована (TODO)

## Информация о баге

**Bug ID**: BUG-2025-10-17-003  
**Дата обнаружения**: 17.10.2025  
**Модуль**: Search / Contact  
**Тип**: Функциональный  
**Приоритет**: P0 (Критический)  
**Серьезность**: Critical  

---

## Классификация

**Тип ошибки**: Unimplemented functionality (TODO placeholder)

**Описание ошибки требования**:
Требование TC-SEARCH-009 указывает, что кнопка "Связаться" должна открывать диалог для отправки сообщения партнеру. Текущая реализация содержит только TODO комментарий вместо полной функции.

---

## Описание проблемы

### Краткое резюме
На странице поиска партнеров кнопка "Связаться" на каждой карточке компании содержит только TODO комментарий и не открывает никакого диалога. Вместо этого показывает информационный toast.

### Детальное описание

**Файл**: `src/pages/search/search.tsx` (строка 85-88)

```tsx
const handleContact = (companyId: string) => {
  // TODO: Open contact modal or navigate to messages  // ❌ TODO PLACEHOLDER
  toast.info('Связаться с компанией', 'Функция в разработке')  // ❌ STUB TOAST
}
```

**Проблемы**:
1. ✗ Функция только показывает toast - "Функция в разработке"
2. ✗ Кнопка "Связаться" на карточке вызывает эту функцию, но нет реального функционала
3. ✗ Нет диалога для написания сообщения
4. ✗ Нет перенаправления на страницу сообщений
5. ✗ Нарушает требование поиска партнеров

### Ожидаемое поведение

**Требование TC-SEARCH-009**:
```
При клике на "Связаться":
- Открывается диалог для отправки сообщения
- Или перенаправляет на страницу сообщений с выбранной компанией
- Пользователь может написать и отправить сообщение
```

---

## Шаги воспроизведения

### Предусловия
- Сервер запущен (http://localhost:3000)
- Mock API запущен (http://localhost:3001)
- Пользователь залогинен
- На странице поиска есть результаты

### Шаги
1. Залогиниться в систему
2. Перейти на `/search`
3. Ввести поисковый запрос (например, "IT")
4. Дождаться результатов
5. На одной из карточек компании нажать кнопку "Связаться"

### Ожидаемый результат
- ✅ Открывается Dialog для написания сообщения
- ✅ Получатель предзаполнен (компания из поиска)
- ✅ Можно написать текст сообщения
- ✅ Кнопка "Отправить" отправляет сообщение
- ✅ Toast подтверждает отправку
- ✅ Диалог закрывается после отправки

ИЛИ (альтернативный вариант):
- ✅ Перенаправляет на `/messages` с выбранной компанией
- ✅ Создается или открывается диалог с компанией

### Фактический результат
- ❌ Показывается toast: "Функция в разработке"
- ❌ Ничего не происходит
- ❌ Нет диалога
- ❌ Нет перенаправления
- ❌ Функция не работает

---

## Анализ кода

### Текущая реализация (НЕПРАВИЛЬНАЯ)

**Файл**: `src/pages/search/search.tsx` (строки 85-88)

```tsx
const handleContact = (companyId: string) => {
  // TODO: Open contact modal or navigate to messages
  toast.info('Связаться с компанией', 'Функция в разработке')
}
```

**Где вызывается**: `src/components/search/ResultsGrid.tsx`

Предположительно есть компонент `CompanyCard`, который вызывает `handleContact` при клике на кнопку.

### Использование

**Файл**: `src/pages/search/search.tsx` (строка 128)

```tsx
<ResultsGrid
  companies={companies}
  isLoading={isSearching || isAISearching}
  onContact={handleContact}  // ← ПЕРЕДАЕТСЯ НЕРАБОТАЮЩАЯ ФУНКЦИЯ
  onViewDetails={handleViewDetails}
  onToggleFavorite={handleToggleFavorite}
/>
```

---

## Требуемые изменения

### Вариант 1: Dialog для отправки сообщения (РЕКОМЕНДУЕТСЯ)

**Шаг 1**: Добавить state для диалога

```typescript
const [contactDialogOpen, setContactDialogOpen] = useState(false)
const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
const [messageText, setMessageText] = useState('')
```

**Шаг 2**: Добавить mutation для отправки сообщения

```typescript
const [sendMessage] = useSendMessageMutation()  // ← Использовать из messagesApi
```

**Шаг 3**: Обновить handleContact

```typescript
const handleContact = (companyId: string) => {
  setSelectedCompanyId(companyId)
  setContactDialogOpen(true)
  setMessageText('')
}

const handleSendMessage = async () => {
  if (!messageText.trim() || !selectedCompanyId) return
  
  try {
    await sendMessage({
      recipientCompanyId: selectedCompanyId,
      text: messageText,
    }).unwrap()
    
    toast.success(t('messages.sent_successfully'))
    setContactDialogOpen(false)
    setMessageText('')
    setSelectedCompanyId(null)
  } catch (error) {
    toast.error(t('common:errors.server_error'))
  }
}
```

**Шаг 4**: Добавить Dialog компонент

```tsx
<Dialog.Root open={contactDialogOpen} onOpenChange={(open) => setContactDialogOpen(open.open)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>{t('messages.contact_company')}</Dialog.Title>
    </Dialog.Header>
    <Dialog.Body>
      <VStack gap={4}>
        <Textarea
          placeholder={t('messages.message_placeholder')}
          value={messageText}
          onChange={(e) => setMessageText(e.target.value)}
          minH="150px"
        />
      </VStack>
    </Dialog.Body>
    <Dialog.Footer>
      <HStack>
        <Button variant="outline" onClick={() => setContactDialogOpen(false)}>
          {t('common:buttons.cancel')}
        </Button>
        <Button
          colorPalette="brand"
          onClick={handleSendMessage}
          loading={isLoading}
        >
          {t('common:buttons.send')}
        </Button>
      </HStack>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
```

### Вариант 2: Перенаправление на Сообщения

```typescript
const handleContact = (companyId: string) => {
  navigate(`/messages?company=${companyId}`)
}
```

---

## Окружение

- **Браузер**: Chrome (Latest)
- **ОС**: Windows 10/11
- **URL**: http://localhost:3000/search

---

## Затронутые тест-кейсы

- ✓ TC-SEARCH-009: Кнопка "Связаться" работает (ПРОВАЛЕН)
- ✓ TC-SEARCH-002: Сценарий 2 - Поиск → Связаться (ПРОВАЛЕН)

---

## Связанные файлы

- `src/pages/search/search.tsx`
- `src/components/search/ResultsGrid.tsx`
- `src/components/search/CompanyCard.tsx`
- `src/__data__/api/messagesApi.ts`
- `locales/ru/messages.json` (нужны ключи для диалога)
- `locales/en/messages.json` (нужны ключи для диалога)

---

## Влияние на функционал

- **Критичность**: Critical (P0)
- **Область воздействия**: Все пользователи поиска
- **Пользовательский опыт**: Критично - основной функционал не работает
- **Требования**: Нарушение основного требования MVP 1

---

## Дополнительно

### Требуемые локализационные ключи

**Русский** (`locales/ru/common.json`):
```json
{
  "messages": {
    "contact_company": "Связаться с компанией",
    "message_placeholder": "Напишите ваше сообщение...",
    "sent_successfully": "Сообщение отправлено"
  }
}
```

**Английский** (`locales/en/common.json`):
```json
{
  "messages": {
    "contact_company": "Contact Company",
    "message_placeholder": "Write your message...",
    "sent_successfully": "Message sent successfully"
  }
}
```

---

## Комментарии

**QA Engineer** (17.10.2025):
> Кнопка "Связаться" на странице поиска не работает. Это критичная функция для платформы B2B. Пользователи должны иметь возможность сразу связаться с найденной компанией без переходов на другие страницы.

---

**Статус**: New  
**Автор**: QA Testing Team  
**Дата создания**: 17.10.2025  
**Приоритет**: URGENT - блокирует основной функционал

