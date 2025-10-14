// Industries / Отрасли
export const INDUSTRIES = [
  { value: 'it', label: 'IT и Технологии' },
  { value: 'finance', label: 'Финансы и Банки' },
  { value: 'manufacturing', label: 'Производство' },
  { value: 'construction', label: 'Строительство' },
  { value: 'retail', label: 'Розничная торговля' },
  { value: 'wholesale', label: 'Оптовая торговля' },
  { value: 'logistics', label: 'Логистика и Транспорт' },
  { value: 'healthcare', label: 'Здравоохранение' },
  { value: 'education', label: 'Образование' },
  { value: 'consulting', label: 'Консалтинг' },
  { value: 'marketing', label: 'Маркетинг и Реклама' },
  { value: 'realestate', label: 'Недвижимость' },
  { value: 'food', label: 'Продукты питания' },
  { value: 'agriculture', label: 'Сельское хозяйство' },
  { value: 'energy', label: 'Энергетика' },
  { value: 'telecom', label: 'Телекоммуникации' },
  { value: 'media', label: 'СМИ и Медиа' },
  { value: 'tourism', label: 'Туризм и Гостеприимство' },
  { value: 'legal', label: 'Юридические услуги' },
  { value: 'other', label: 'Другое' },
]

// Company sizes / Размеры компаний
export const COMPANY_SIZES = [
  { value: '1-10', label: '1-10 сотрудников' },
  { value: '11-50', label: '11-50 сотрудников' },
  { value: '51-250', label: '51-250 сотрудников' },
  { value: '251-500', label: '251-500 сотрудников' },
  { value: '500+', label: 'Более 500 сотрудников' },
]

// Legal forms / Организационно-правовые формы
export const LEGAL_FORMS = [
  { value: 'ooo', label: 'ООО (Общество с ограниченной ответственностью)' },
  { value: 'ao', label: 'АО (Акционерное общество)' },
  { value: 'pao', label: 'ПАО (Публичное акционерное общество)' },
  { value: 'ip', label: 'ИП (Индивидуальный предприниматель)' },
  { value: 'zao', label: 'ЗАО (Закрытое акционерное общество)' },
  { value: 'nko', label: 'НКО (Некоммерческая организация)' },
  { value: 'gup', label: 'ГУП (Государственное унитарное предприятие)' },
  { value: 'mup', label: 'МУП (Муниципальное унитарное предприятие)' },
  { value: 'other', label: 'Другое' },
]

// Platform goals / Цели использования платформы
export const PLATFORM_GOALS = [
  { value: 'find_suppliers', label: 'Поиск новых поставщиков' },
  { value: 'find_clients', label: 'Поиск новых клиентов' },
  { value: 'expand_network', label: 'Расширение сети деловых контактов' },
  { value: 'post_offers', label: 'Размещение коммерческих предложений/тендеров' },
  { value: 'market_research', label: 'Изучение рынка' },
  { value: 'other', label: 'Другое' },
]

// Geography options / География
export const GEOGRAPHY_OPTIONS = [
  { value: 'russia_all', label: 'По всей России' },
  { value: 'moscow', label: 'Москва и МО' },
  { value: 'spb', label: 'Санкт-Петербург и ЛО' },
  { value: 'central', label: 'Центральный ФО' },
  { value: 'northwest', label: 'Северо-Западный ФО' },
  { value: 'south', label: 'Южный ФО' },
  { value: 'volga', label: 'Приволжский ФО' },
  { value: 'ural', label: 'Уральский ФО' },
  { value: 'siberia', label: 'Сибирский ФО' },
  { value: 'fareast', label: 'Дальневосточный ФО' },
  { value: 'cis', label: 'СНГ' },
  { value: 'international', label: 'Международные' },
]

// Positions / Должности
export const POSITIONS = [
  { value: 'owner', label: 'Владелец/Учредитель' },
  { value: 'ceo', label: 'Генеральный директор' },
  { value: 'director', label: 'Директор' },
  { value: 'deputy_director', label: 'Заместитель директора' },
  { value: 'head_of_department', label: 'Руководитель отдела' },
  { value: 'procurement_manager', label: 'Менеджер по закупкам' },
  { value: 'sales_manager', label: 'Менеджер по продажам' },
  { value: 'manager', label: 'Менеджер' },
  { value: 'specialist', label: 'Специалист' },
  { value: 'other', label: 'Другое' },
]

// How did you hear about us / Источники
export const SOURCE_OPTIONS = [
  { value: 'search', label: 'Поиск в интернете' },
  { value: 'referral', label: 'Рекомендация коллеги' },
  { value: 'article', label: 'Статья/новость' },
  { value: 'social', label: 'Социальные сети' },
  { value: 'conference', label: 'Конференция/выставка' },
  { value: 'advertising', label: 'Реклама' },
  { value: 'other', label: 'Другое' },
]

// Revenue ranges / Диапазоны выручки
export const REVENUE_RANGES = [
  { value: 'up_to_60m', label: 'До 60 млн ₽' },
  { value: 'up_to_120m', label: 'До 120 млн ₽' },
  { value: 'up_to_2b', label: 'До 2 млрд ₽' },
  { value: '2b_plus', label: 'Более 2 млрд ₽' },
]

// Employee count ranges / Количество сотрудников
export const EMPLOYEE_COUNTS = [
  { value: '1-10', label: '1-10' },
  { value: '11-50', label: '11-50' },
  { value: '51-200', label: '51-200' },
  { value: '201-500', label: '201-500' },
  { value: '500+', label: '500+' },
]

// Product/Service categories / Категории товаров/услуг
export const PRODUCT_CATEGORIES = [
  { value: 'goods', label: 'Товары' },
  { value: 'services', label: 'Услуги' },
  { value: 'software', label: 'Программное обеспечение' },
  { value: 'equipment', label: 'Оборудование' },
  { value: 'materials', label: 'Материалы' },
  { value: 'consumables', label: 'Расходные материалы' },
  { value: 'consulting', label: 'Консалтинг' },
  { value: 'other', label: 'Другое' },
]

// File types for products / Типы файлов для продуктов
export const FILE_TYPES = [
  { value: 'commercial_offer', label: 'Коммерческое предложение' },
  { value: 'technical_specs', label: 'Техническое задание' },
  { value: 'contract', label: 'Проект договора' },
  { value: 'questionnaire', label: 'Анкета' },
  { value: 'other', label: 'Другое' },
]

// Sort options / Параметры сортировки
export const SORT_OPTIONS = [
  { value: 'relevance', label: 'По релевантности' },
  { value: 'rating_desc', label: 'По рейтингу (убыв.)' },
  { value: 'rating_asc', label: 'По рейтингу (возр.)' },
  { value: 'name_asc', label: 'По названию (А-Я)' },
  { value: 'name_desc', label: 'По названию (Я-А)' },
]

// Validation patterns
export const VALIDATION_PATTERNS = {
  INN: /^\d{10}$|^\d{12}$/,
  OGRN: /^\d{13}$|^\d{15}$/,
  PHONE: /^(\+7|8)?[\s-]?\(?\d{3}\)?[\s-]?\d{3}[\s-]?\d{2}[\s-]?\d{2}$/,
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  URL: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&//=]*)$/,
}

