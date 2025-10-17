# 📑 Навигация по тестовой модели

## 🎯 Быстрый доступ

### Начать тестирование
👉 **[TESTING_GUIDE.md](TESTING_GUIDE.md)** - С чего начать

### Итоговый отчет
👉 **[IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md)** - Полная информация о модели

---

## 📚 Основные документы

### 📖 Общие руководства

| Файл | Описание | Для кого |
|------|----------|----------|
| [README.md](README.md) | Главный файл модели, описание, структура, метрики | Все |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Краткое практическое руководство | QA, Dev |
| [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) | Итоговый отчет о модели | PM, Tech Lead |
| [INDEX.md](INDEX.md) | Этот файл - навигация | Все |

---

## 🧪 Модульное тестирование

### Тест-кейсы по модулям

| № | Модуль | Файл | Приоритет | Тест-кейсов | Время |
|---|--------|------|-----------|-------------|-------|
| 1 | **Аутентификация** | [01-authentication-tests.md](01-authentication-tests.md) | P0 | 15 | 1-2 ч |
| 2 | **Регистрация** | [02-registration-tests.md](02-registration-tests.md) | P0 | 20 | 2-3 ч |
| 3 | **Dashboard** | [03-dashboard-tests.md](03-dashboard-tests.md) | P1 | 19 | 1-2 ч |
| 4 | **Профиль компании** | [04-company-profile-tests.md](04-company-profile-tests.md) | P1 | 21 | 2-3 ч |
| 5 | **Поиск партнеров** | [05-search-tests.md](05-search-tests.md) | P1 | 29 | 2-3 ч |

**Всего**: 104 тест-кейса  
**Общее время**: 8-13 часов

---

## 🎭 Сквозное тестирование (E2E)

| Сценарий | Файл | Описание | Время |
|----------|------|----------|-------|
| **E2E Scenarios** | [test-scenarios.md](test-scenarios.md) | 6 полных user flows | 6-12 ч |

### Содержание test-scenarios.md

1. **Регистрация → Первый вход → Заполнение профиля** (2ч)
   - Полный цикл от регистрации до заполненного профиля
   
2. **Поиск партнера → Связаться → Сообщение** (1ч)
   - Поиск с фильтрами + отправка сообщения
   
3. **Массовая рассылка → Получение ответов → Формирование отчета** (2ч)
   - Создание запроса на 15 адресатов + отчет
   
4. **Получение отзыва от партнера** (1ч)
   - Взаимодействие двух компаний
   
5. **Загрузка документов и получение акцептов** (2ч)
   - Документы в "Я покупаю" + акцепты
   
6. **Полная проверка локализации (ru ↔ en)** (2ч)
   - Переключение языка на всех страницах

---

## ✅ Чек-листы и шаблоны

| Файл | Описание | Использование |
|------|----------|---------------|
| [test-checklist.md](test-checklist.md) | Полный чек-лист (200+ пунктов) | Ручное тестирование перед релизом |
| [bug-report-template.md](bug-report-template.md) | Шаблон для баг-репортов | Копировать для каждого бага |

---

## 🗂️ Организация по типам тестирования

### 🔐 Безопасность и Аутентификация
- [01-authentication-tests.md](01-authentication-tests.md)
- [test-checklist.md](test-checklist.md) → Секция "Безопасность"

### 📝 Регистрация и Onboarding
- [02-registration-tests.md](02-registration-tests.md)
- [test-scenarios.md](test-scenarios.md) → Сценарий #1

### 🎨 UI/UX и Layout
- [03-dashboard-tests.md](03-dashboard-tests.md)
- [test-checklist.md](test-checklist.md) → Секция "UI/UX"

### 🏢 Профиль и CRUD операции
- [04-company-profile-tests.md](04-company-profile-tests.md)
- [test-scenarios.md](test-scenarios.md) → Сценарий #4, #5

### 🔍 Поиск и Фильтрация
- [05-search-tests.md](05-search-tests.md)
- [test-scenarios.md](test-scenarios.md) → Сценарий #2

### 📧 Коммуникация
- [test-checklist.md](test-checklist.md) → Секция "Сообщения"
- [test-scenarios.md](test-scenarios.md) → Сценарий #2

### 📊 Отчеты и Документы
- [test-checklist.md](test-checklist.md) → Секции "Документы", "Отчеты"
- [test-scenarios.md](test-scenarios.md) → Сценарий #3, #5

### 🌐 Локализация
- [test-checklist.md](test-checklist.md) → Секция "Интернационализация"
- [test-scenarios.md](test-scenarios.md) → Сценарий #6

### 📱 Responsive дизайн
- Все модульные тесты содержат секцию "Responsive"
- [test-checklist.md](test-checklist.md) → Секция "Responsive дизайн"

---

## 🎯 Рекомендуемый порядок тестирования

### Для нового релиза (Полное тестирование)

#### Неделя 1: Критические модули (P0)
**День 1-2**: Аутентификация
- [ ] [01-authentication-tests.md](01-authentication-tests.md)
- [ ] Время: 1-2 часа

**День 2-3**: Регистрация
- [ ] [02-registration-tests.md](02-registration-tests.md)
- [ ] Время: 2-3 часа

**День 3**: E2E Регистрация
- [ ] [test-scenarios.md](test-scenarios.md) → Сценарий #1
- [ ] Время: 2 часа

#### Неделя 2: Важные модули (P1)
**День 4**: Dashboard
- [ ] [03-dashboard-tests.md](03-dashboard-tests.md)
- [ ] Время: 1-2 часа

**День 5-6**: Профиль компании
- [ ] [04-company-profile-tests.md](04-company-profile-tests.md)
- [ ] Время: 2-3 часа

**День 6-7**: Поиск партнеров
- [ ] [05-search-tests.md](05-search-tests.md)
- [ ] Время: 2-3 часа

#### Неделя 3: E2E и интеграция
**День 8-10**: Остальные E2E сценарии
- [ ] [test-scenarios.md](test-scenarios.md) → Сценарии #2-6
- [ ] Время: 6-8 часов

**День 11**: Полный чек-лист
- [ ] [test-checklist.md](test-checklist.md)
- [ ] Время: 4-6 часов

**День 12**: Регрессионное тестирование
- [ ] Повторить P0 тесты
- [ ] Проверить исправленные баги
- [ ] Время: 2-3 часа

---

### Для hotfix (Smoke testing)

**30 минут**:
1. Логин/Logout
2. Регистрация (1 полный цикл)
3. Dashboard загружается
4. Профиль открывается
5. Поиск работает
6. Нет ошибок в консоли

**Файлы**: Секции "TC-XXX-001" (первые тесты) из каждого модуля

---

### Для фичи (Feature testing)

**Зависит от фичи**:
1. Определить затронутые модули
2. Выполнить тесты из соответствующих файлов
3. Smoke test остальных модулей
4. Проверить релевантные E2E сценарии

---

## 📊 Трекинг прогресса

### Шаблон отчета о прогрессе

```markdown
# Отчет тестирования - [Дата]

## Модули
- [ ] Аутентификация: __ / 15
- [ ] Регистрация: __ / 20
- [ ] Dashboard: __ / 19
- [ ] Профиль: __ / 21
- [ ] Поиск: __ / 29

## E2E Сценарии
- [ ] Сценарий 1: Регистрация → Профиль
- [ ] Сценарий 2: Поиск → Сообщение
- [ ] Сценарий 3: Массовая рассылка
- [ ] Сценарий 4: Отзывы
- [ ] Сценарий 5: Документы
- [ ] Сценарий 6: Локализация

## Чек-лист
- [ ] Завершен: __ / 200+

## Баги
- P0: __
- P1: __
- P2: __
- P3: __

## Готовность к релизу
[ ] Да / [ ] Нет
```

---

## 🔍 Поиск по модели

### По приоритету

**P0 (Критические)**:
- [01-authentication-tests.md](01-authentication-tests.md)
- [02-registration-tests.md](02-registration-tests.md)

**P1 (Высокие)**:
- [03-dashboard-tests.md](03-dashboard-tests.md)
- [04-company-profile-tests.md](04-company-profile-tests.md)
- [05-search-tests.md](05-search-tests.md)

**P2-P3 (Средние/Низкие)**:
- Косметические проверки в [test-checklist.md](test-checklist.md)

---

### По функциональности (MVP)

**MVP 1 (tasks-ui)**:
- Аутентификация → [01-authentication-tests.md](01-authentication-tests.md)
- Регистрация → [02-registration-tests.md](02-registration-tests.md)
- Dashboard → [03-dashboard-tests.md](03-dashboard-tests.md)
- Профиль (4 таба) → [04-company-profile-tests.md](04-company-profile-tests.md)
- Поиск → [05-search-tests.md](05-search-tests.md)

**MVP 2 (tasks-ui2)**:
- Опыт работы → [test-checklist.md](test-checklist.md) #7
- Документы и акцепты → [test-checklist.md](test-checklist.md) #8, [test-scenarios.md](test-scenarios.md) #5
- Сообщения → [test-checklist.md](test-checklist.md) #6, [test-scenarios.md](test-scenarios.md) #2
- Массовая рассылка → [test-checklist.md](test-checklist.md) #9, [test-scenarios.md](test-scenarios.md) #3
- Отчеты → [test-checklist.md](test-checklist.md) #10, [test-scenarios.md](test-scenarios.md) #3

---

## 🆘 Помощь

### Вопросы?

**По структуре модели**:
→ [README.md](README.md)

**По процессу тестирования**:
→ [TESTING_GUIDE.md](TESTING_GUIDE.md)

**По созданию баг-репортов**:
→ [bug-report-template.md](bug-report-template.md)

**По конкретному модулю**:
→ Соответствующий файл 01-05

---

## 📞 Контакты

**Вопросы по тестированию**:
- QA Team
- Slack: #qa-channel

**Обновление модели**:
- Tech Lead
- GitHub: создать PR

---

## 🔄 Версионирование

**Текущая версия**: 1.0  
**Дата создания**: 17 октября 2025  
**Последнее обновление**: 17 октября 2025  
**Статус**: ✅ Готово к использованию

### История изменений

| Версия | Дата | Изменения |
|--------|------|-----------|
| 1.0 | 17.10.2025 | Первая версия тестовой модели |

---

## 📈 Статистика модели

- **Файлов**: 10
- **Тест-кейсов**: 104
- **E2E сценариев**: 6
- **Чек-лист пунктов**: 200+
- **Общее время тестирования**: 20-30 часов (полное)
- **Smoke test время**: 30 минут

---

**Желаем успешного тестирования! 🚀**

