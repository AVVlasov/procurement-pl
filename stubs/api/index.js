const router = require('express').Router();

const timer = (time = 300) => (req, res, next) => setTimeout(next, time);

// Настройка кодировки UTF-8
router.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  next();
});

router.use(timer());

// Загружаем моки через прямые импорты
const userMocks = require('../mocks/user.json');
const companyMocks = require('../mocks/companies.json');
const productMocks = require('../mocks/products.json');
const searchMocks = require('../mocks/search.json');
const authMocks = require('../mocks/auth.json');


// Вспомогательные функции для генерации динамических данных
const generateTimestamp = () => Date.now();
const generateDate = (daysAgo) => new Date(Date.now() - 86400000 * daysAgo).toISOString();

// Функция для замены плейсхолдеров в данных
const processMockData = (data) => {
  if (data === undefined || data === null) {
    return data;
  }

  const timestamp = generateTimestamp();
  const jsonString = JSON.stringify(data);
  
  if (jsonString === undefined || jsonString === null) {
    return data;
  }

  const processedData = jsonString
    .replace(/{{timestamp}}/g, timestamp)
    .replace(/{{date-(\d+)-days?}}/g, (match, days) => generateDate(parseInt(days)))
    .replace(/{{date-1-day}}/g, generateDate(1))
    .replace(/{{date-2-days}}/g, generateDate(2))
    .replace(/{{date-3-days}}/g, generateDate(3))
    .replace(/{{date-4-days}}/g, generateDate(4))
    .replace(/{{date-5-days}}/g, generateDate(5))
    .replace(/{{date-6-days}}/g, generateDate(6))
    .replace(/{{date-7-days}}/g, generateDate(7))
    .replace(/{{date-8-days}}/g, generateDate(8))
    .replace(/{{date-10-days}}/g, generateDate(10))
    .replace(/{{date-12-days}}/g, generateDate(12))
    .replace(/{{date-15-days}}/g, generateDate(15))
    .replace(/{{date-18-days}}/g, generateDate(18))
    .replace(/{{date-20-days}}/g, generateDate(20))
    .replace(/{{date-21-days}}/g, generateDate(21))
    .replace(/{{date-25-days}}/g, generateDate(25))
    .replace(/{{date-28-days}}/g, generateDate(28))
    .replace(/{{date-30-days}}/g, generateDate(30))
    .replace(/{{date-35-days}}/g, generateDate(35));
  
  try {
    return JSON.parse(processedData);
  } catch (error) {
    return data;
  }
};

// ------------------------------
// In-memory stores (ephemeral)
// ------------------------------
/**
 * Созданные через сидинговую ручку компании. Используются вместе с companyMocks.mockCompanies
 * чтобы быть видимыми в поиске и прочих разделах.
 */
const seededCompanies = [];

/**
 * Опыт компаний: { [companyId]: ExperienceEntry[] }
 * ExperienceEntry: { id, confirmed, customer, subject, volume, contact, comment, createdAt, updatedAt }
 */
const companyExperience = {};

/**
 * Отзывы компаний: { [companyId]: Review[] }
 * Review: { id, author: { name, company }, rating, comment, date, verified }
 */
const companyReviews = {};

/**
 * Документы раздела "Я покупаю"
 * { id, ownerCompanyId, name, type, size, url, acceptedBy: string[], createdAt }
 */
const buyDocs = [];

/**
 * Сообщения (P2P):
 * threads: { id, participants: string[], lastMessageAt, lastMessage, unreadCount? }
 * messages: { [threadId]: Array<{ id, senderCompanyId, text, timestamp }>} 
 */
const messageThreads = [];
const messagesByThread = {};

/**
 * Результаты массовых отправок запросов (для отчёта)
 * Последний результат сохраняем для простоты. Структура вольная для UI.
 */
let lastBulkRequestResult = null;

function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateCompany(idx) {
  const id = 'seed-company-' + generateTimestamp() + '-' + idx;
  const industries = ['Строительство', 'Производство', 'Логистика', 'IT', 'Торговля', 'Услуги'];
  const sizes = ['1-10', '11-50', '51-200', '201-500', '500+'];
  return {
    id,
    inn: String(7700000000 + Math.floor(Math.random() * 100000000)),
    ogrn: String(1027700000000 + Math.floor(Math.random() * 100000000)),
    fullName: `Тестовая Компания №${idx}`,
    shortName: `ТестКом №${idx}`,
    legalForm: 'ООО',
    industry: randomFrom(industries),
    companySize: randomFrom(sizes),
    website: '',
    logo: undefined,
    slogan: 'Мы делаем лучше',
    rating: parseFloat((3 + Math.random() * 2).toFixed(1)),
    verified: Math.random() > 0.3,
  };
}

// Auth endpoints
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks?.errorMessages?.validationFailed || 'Email и пароль обязательны' 
    });
  }
  
  // Имитация неверных учетных данных
  if (password === 'wrong') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: authMocks?.errorMessages?.invalidCredentials || 'Неверный email или пароль' 
    });
  }
  
  if (!authMocks?.mockAuthResponse) {
    return res.status(500).json({ 
      error: 'Internal Server Error',
      message: 'Ошибка загрузки данных аутентификации',
      details: {
        authMocksExists: !!authMocks,
        authMocksType: typeof authMocks,
        authMocksKeys: authMocks ? Object.keys(authMocks) : null
      }
    });
  }
  
  const authResponse = processMockData(authMocks.mockAuthResponse);
  res.status(200).json(authResponse);
});

router.post('/auth/register', (req, res) => {
  const { email, password, inn, agreeToTerms } = req.body;
  
  if (!email || !password || !inn) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.validationFailed || 'Заполните все обязательные поля' 
    });
  }
  
  if (!agreeToTerms) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.termsRequired || 'Необходимо принять условия использования' 
    });
  }
  
  // Создаем нового пользователя с данными из регистрации
  const newUser = {
    id: 'user-' + generateTimestamp(),
    email: email,
    firstName: req.body.firstName || 'Иван',
    lastName: req.body.lastName || 'Петров',
    position: req.body.position || 'Директор'
  };
  
  const newCompany = {
    id: 'company-' + generateTimestamp(),
    name: req.body.fullName || companyMocks.mockCompany?.name,
    inn: req.body.inn,
    ogrn: req.body.ogrn || companyMocks.mockCompany?.ogrn,
    fullName: req.body.fullName || companyMocks.mockCompany?.fullName,
    shortName: req.body.shortName,
    legalForm: req.body.legalForm || 'ООО',
    industry: req.body.industry || 'Другое',
    companySize: req.body.companySize || '1-10',
    website: req.body.website || '',
    verified: false,
    rating: 0
  };
  
  res.status(201).json({
    user: newUser,
    company: newCompany,
    tokens: {
      accessToken: 'mock-access-token-' + generateTimestamp(),
      refreshToken: 'mock-refresh-token-' + generateTimestamp()
    }
  });
});

router.post('/auth/logout', (req, res) => {
  res.status(200).json({ 
    message: authMocks.successMessages?.logoutSuccess || 'Успешный выход' 
  });
});

router.post('/auth/refresh', (req, res) => {
  const { refreshToken } = req.body;
  
  if (!refreshToken) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: authMocks.errorMessages?.refreshTokenRequired || 'Refresh token обязателен' 
    });
  }
  
  res.status(200).json({
    accessToken: 'mock-access-token-refreshed-' + generateTimestamp(),
    refreshToken: 'mock-refresh-token-refreshed-' + generateTimestamp()
  });
});

router.get('/auth/verify-email/:token', (req, res) => {
  res.status(200).json({ 
    message: authMocks.successMessages?.emailVerified || 'Email успешно подтвержден' 
  });
});

router.post('/auth/request-password-reset', (req, res) => {
  const { email } = req.body;
  
  if (!email) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.emailRequired || 'Email обязателен' 
    });
  }
  
  res.status(200).json({ 
    message: authMocks.successMessages?.passwordResetSent || 'Письмо для восстановления пароля отправлено' 
  });
});

router.post('/auth/reset-password', (req, res) => {
  const { token, newPassword } = req.body;
  
  if (!token || !newPassword) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.validationFailed || 'Token и новый пароль обязательны' 
    });
  }
  
  res.status(200).json({ 
    message: authMocks.successMessages?.passwordResetSuccess || 'Пароль успешно изменен' 
  });
});

// --------------------------------
// Seed: массовое создание компаний
// --------------------------------
router.post('/__seed/companies', (req, res) => {
  const count = Math.min(Math.max(parseInt(req.query.count || req.body?.count || '20', 10) || 20, 1), 50);
  const created = [];
  for (let i = 1; i <= count; i++) {
    const c = generateCompany(i);
    seededCompanies.push(c);
    created.push(c);
  }
  res.status(201).json({ createdCount: created.length, items: created });
});

// Companies endpoints
router.get('/companies/my/stats', (req, res) => {
  res.status(200).json({
    profileViews: 142,
    profileViewsChange: 12,
    sentRequests: 8,
    sentRequestsChange: 2,
    receivedRequests: 15,
    receivedRequestsChange: 5,
    newMessages: 3,
    rating: 4.5
  });
});

router.get('/companies/:id', (req, res) => {
  const company = processMockData(companyMocks.mockCompany);
  res.status(200).json(company);
});

router.patch('/companies/:id', (req, res) => {
  const updatedCompany = {
    ...processMockData(companyMocks.mockCompany),
    ...req.body,
    id: req.params.id
  };
  
  res.status(200).json(updatedCompany);
});

router.get('/companies/:id/stats', (req, res) => {
  res.status(200).json({
    profileViews: 142,
    profileViewsChange: 12,
    sentRequests: 8,
    sentRequestsChange: 2,
    receivedRequests: 15,
    receivedRequestsChange: 5,
    newMessages: 3,
    rating: 4.5
  });
});

router.post('/companies/:id/logo', (req, res) => {
  res.status(200).json({
    logoUrl: 'https://via.placeholder.com/200x200/4299E1/FFFFFF?text=Logo'
  });
});

// ------------------------------
// Company Experience (CRUD)
// ------------------------------
router.get('/companies/:id/experience', (req, res) => {
  const { id } = req.params;
  const items = companyExperience[id] || [];
  res.status(200).json(items);
});

router.post('/companies/:id/experience', (req, res) => {
  const { id } = req.params;
  const payload = req.body || {};
  const exp = {
    id: 'exp-' + generateTimestamp(),
    confirmed: !!payload.confirmed,
    customer: payload.customer || '',
    subject: payload.subject || '',
    volume: payload.volume || '',
    contact: payload.contact || '',
    comment: payload.comment || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  companyExperience[id] = companyExperience[id] || [];
  companyExperience[id].push(exp);
  res.status(201).json(exp);
});

router.put('/companies/:id/experience/:expId', (req, res) => {
  const { id, expId } = req.params;
  const list = companyExperience[id] || [];
  const idx = list.findIndex(e => e.id === expId);
  if (idx === -1) return res.status(404).json({ error: 'Not Found' });
  const updated = {
    ...list[idx],
    ...req.body,
    updatedAt: new Date().toISOString(),
  };
  list[idx] = updated;
  companyExperience[id] = list;
  res.status(200).json(updated);
});

router.delete('/companies/:id/experience/:expId', (req, res) => {
  const { id, expId } = req.params;
  const list = companyExperience[id] || [];
  const next = list.filter(e => e.id !== expId);
  companyExperience[id] = next;
  res.status(204).send();
});

// ------------------------------
// Company Reviews (list only)
// ------------------------------
router.get('/companies/:id/reviews', (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 10, sortBy = 'date', sortOrder = 'desc' } = req.query;
  const all = companyReviews[id] || [];
  const sorted = [...all].sort((a, b) => {
    let cmp = 0;
    if (sortBy === 'rating') cmp = a.rating - b.rating;
    else cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
    return sortOrder === 'asc' ? cmp : -cmp;
  });
  const start = (parseInt(page) - 1) * parseInt(limit);
  const slice = sorted.slice(start, start + parseInt(limit));
  res.status(200).json({ items: slice, total: all.length, page: parseInt(page) });
});

router.get('/companies/check-inn/:inn', (req, res) => {
  const inn = req.params.inn;
  
  // Имитация проверки ИНН
  if (inn.length !== 10 && inn.length !== 12) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.innValidation || 'ИНН должен содержать 10 или 12 цифр' 
    });
  }
  
  const mockINNData = companyMocks.mockINNData || {};
  const companyData = mockINNData[inn] || {
    name: 'ОБЩЕСТВО С ОГРАНИЧЕННОЙ ОТВЕТСТВЕННОСТЬЮ "ТЕСТОВАЯ КОМПАНИЯ ' + inn + '"',
    ogrn: '10277' + inn,
    legal_form: 'ООО'
  };
  
  res.status(200).json({ data: companyData });
});

// Products endpoints
router.get('/products/my', (req, res) => {
  const products = processMockData(productMocks.mockProducts);
  res.status(200).json(products);
});

router.get('/products', (req, res) => {
  const products = processMockData(productMocks.mockProducts);
  res.status(200).json({
    items: products,
    total: products.length,
    page: 1,
    pageSize: 20
  });
});

router.post('/products', (req, res) => {
  const newProduct = {
    id: 'prod-' + generateTimestamp(),
    ...req.body,
    companyId: 'company-123',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
  
  res.status(201).json(newProduct);
});

router.get('/products/:id', (req, res) => {
  const products = processMockData(productMocks.mockProducts);
  const product = products.find(p => p.id === req.params.id);
  
  if (product) {
    res.status(200).json(product);
  } else {
    res.status(200).json({
      id: req.params.id,
      name: 'Продукт ' + req.params.id,
      description: 'Описание продукта',
      category: 'Категория',
      type: 'sell',
      companyId: 'company-123',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
});

router.patch('/products/:id', (req, res) => {
  const products = processMockData(productMocks.mockProducts);
  const product = products.find(p => p.id === req.params.id);
  
  const updatedProduct = {
    ...(product || {}),
    ...req.body,
    id: req.params.id,
    updatedAt: new Date().toISOString()
  };
  
  res.status(200).json(updatedProduct);
});

router.delete('/products/:id', (req, res) => {
  res.status(204).send();
});

// Тестовый endpoint для проверки данных
router.get('/test-data', (req, res) => {
  res.status(200).json({
    companiesCount: companyMocks.mockCompanies?.length || 0,
    suggestionsCount: searchMocks.suggestions?.length || 0,
    firstCompany: companyMocks.mockCompanies?.[0] || null,
    firstSuggestion: searchMocks.suggestions?.[0] || null,
    allSuggestions: searchMocks.suggestions || []
  });
});

// ------------------------------
// Buy Docs ("Я покупаю")
// ------------------------------
router.get('/buy/docs', (req, res) => {
  const { ownerCompanyId } = req.query;
  const items = ownerCompanyId ? buyDocs.filter(d => d.ownerCompanyId === ownerCompanyId) : buyDocs;
  res.status(200).json(items);
});

router.post('/buy/docs', (req, res) => {
  const { ownerCompanyId, name, type } = req.body || {};
  if (!ownerCompanyId || !name) return res.status(400).json({ error: 'Validation failed', message: 'ownerCompanyId и name обязательны' });
  if (!['xlsx', 'docx'].includes((type || '').toLowerCase())) {
    return res.status(400).json({ error: 'Validation failed', message: 'Допустимые типы: xlsx, docx' });
  }
  const doc = {
    id: 'buydoc-' + generateTimestamp(),
    ownerCompanyId,
    name,
    type: type.toLowerCase(),
    size: Math.floor(50_000 + Math.random() * 500_000),
    url: `https://example.com/docs/${encodeURIComponent(name)}`,
    acceptedBy: [],
    createdAt: new Date().toISOString(),
  };
  buyDocs.push(doc);
  res.status(201).json(doc);
});

router.post('/buy/docs/:id/accept', (req, res) => {
  const { id } = req.params;
  const { companyId } = req.body || {};
  const doc = buyDocs.find(d => d.id === id);
  if (!doc) return res.status(404).json({ error: 'Not Found' });
  if (!companyId) return res.status(400).json({ error: 'Validation failed', message: 'companyId обязателен' });
  if (!doc.acceptedBy.includes(companyId)) doc.acceptedBy.push(companyId);
  res.status(200).json({ id: doc.id, acceptedBy: doc.acceptedBy });
});
router.get('/search', (req, res) => {
  const { 
    query, 
    industries, 
    companySize,
    geography,
    minRating, 
    hasReviews,
    hasAcceptedDocs,
    type,
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1, 
    limit = 20 
  } = req.query;
  
  const companies = [
    ...processMockData(companyMocks.mockCompanies),
    ...seededCompanies,
  ];
  let filtered = [...companies];
  
  if (query) {
    const q = query.toLowerCase().trim();
    
    filtered = filtered.filter(c => {
      const fullName = (c.fullName || '').toLowerCase();
      const shortName = (c.shortName || '').toLowerCase();
      const industry = (c.industry || '').toLowerCase();
      const slogan = (c.slogan || '').toLowerCase();
      const legalAddress = (c.legalAddress || '').toLowerCase();
      
      return fullName.includes(q) ||
             shortName.includes(q) ||
             industry.includes(q) ||
             slogan.includes(q) ||
             legalAddress.includes(q);
    });
  }
  
  // Фильтр по отраслям
  if (industries && industries.length > 0) {
    const industriesArray = Array.isArray(industries) ? industries : [industries];
    filtered = filtered.filter(c => industriesArray.includes(c.industry));
  }
  
  // Фильтр по размеру компании
  if (companySize && companySize.length > 0) {
    const sizeArray = Array.isArray(companySize) ? companySize : [companySize];
    filtered = filtered.filter(c => sizeArray.includes(c.companySize));
  }
  
  // Фильтр по рейтингу
  if (minRating) {
    filtered = filtered.filter(c => c.rating >= parseFloat(minRating));
  }

  // Фильтр по наличию отзывов
  if (hasReviews === 'true') {
    filtered = filtered.filter(c => (companyReviews[c.id] || []).length > 0);
  }

  // Фильтр по факту акцептов документации (компания ставила акцепты)
  if (hasAcceptedDocs === 'true') {
    filtered = filtered.filter(c => buyDocs.some(d => d.acceptedBy.includes(c.id)));
  }
  
  // Сортировка
  filtered.sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'rating':
        comparison = a.rating - b.rating;
        break;
      case 'name':
        comparison = (a.shortName || a.fullName).localeCompare(b.shortName || b.fullName);
        break;
      case 'relevance':
      default:
        // Для релевантности используем рейтинг как основной критерий
        comparison = a.rating - b.rating;
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });
  
  const total = filtered.length;
  const totalPages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + parseInt(limit);
  const paginatedResults = filtered.slice(startIndex, endIndex);
  
  res.status(200).json({
    companies: paginatedResults,
    total,
    page: parseInt(page),
    totalPages
  });
});

router.post('/search/ai', (req, res) => {
  const { query } = req.body;
  
  // Простая логика AI поиска на основе ключевых слов
  const companies = processMockData(companyMocks.mockCompanies);
  let aiResults = [...companies];
  const q = query.toLowerCase();
  
  // Определяем приоритетные отрасли на основе запроса
  if (q.includes('строитель') || q.includes('строй') || q.includes('дом') || q.includes('здание')) {
    aiResults = aiResults.filter(c => c.industry === 'Строительство');
  } else if (q.includes('металл') || q.includes('сталь') || q.includes('производств') || q.includes('завод')) {
    aiResults = aiResults.filter(c => c.industry === 'Производство');
  } else if (q.includes('логистик') || q.includes('доставк') || q.includes('транспорт')) {
    aiResults = aiResults.filter(c => c.industry === 'Логистика');
  } else if (q.includes('торговл') || q.includes('продаж') || q.includes('снабжени')) {
    aiResults = aiResults.filter(c => c.industry === 'Торговля');
  } else if (q.includes('it') || q.includes('программ') || q.includes('технолог') || q.includes('софт')) {
    aiResults = aiResults.filter(c => c.industry === 'IT');
  } else if (q.includes('услуг') || q.includes('консалт') || q.includes('помощь')) {
    aiResults = aiResults.filter(c => c.industry === 'Услуги');
  }
  
  // Сортируем по рейтингу и берем топ-5
  aiResults.sort((a, b) => b.rating - a.rating);
  const topResults = aiResults.slice(0, 5);
  
  // Генерируем AI предложение
  let aiSuggestion = `На основе вашего запроса "${query}" мы нашли ${topResults.length} подходящих партнеров. `;
  
  if (topResults.length > 0) {
    const industries = [...new Set(topResults.map(c => c.industry))];
    aiSuggestion += `Рекомендуем обратить внимание на компании в сфере ${industries.join(', ')}. `;
    aiSuggestion += `Все предложенные партнеры имеют высокий рейтинг (от ${Math.min(...topResults.map(c => c.rating)).toFixed(1)} до ${Math.max(...topResults.map(c => c.rating)).toFixed(1)}) и подтвержденный статус.`;
  } else {
    aiSuggestion += 'Попробуйте изменить формулировку запроса или использовать фильтры для более точного поиска.';
  }
  
  res.status(200).json({
    companies: topResults,
    total: topResults.length,
    page: 1,
    totalPages: 1,
    aiSuggestion
  });
});

router.get('/search/suggestions', (req, res) => {
  const { q } = req.query;
  
  const suggestions = searchMocks.suggestions || [];
  
  const filtered = q 
    ? suggestions.filter(s => s.toLowerCase().includes(q.toLowerCase()))
    : suggestions.slice(0, 10);
  
  res.status(200).json(filtered);
});

router.get('/search/recommendations', (req, res) => {
  // Динамически генерируем рекомендации на основе топовых компаний
  const companies = processMockData(companyMocks.mockCompanies);
  const topCompanies = companies
    .filter(c => c.verified && c.rating >= 4.5)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);
  
  const recommendations = topCompanies.map(company => ({
    id: company.id,
    name: company.shortName || company.fullName,
    industry: company.industry,
    logo: company.logo,
    matchScore: Math.floor(company.rating * 20), // Конвертируем рейтинг в проценты
    reason: getRecommendationReason(company, searchMocks.recommendationReasons)
  }));
  
  res.status(200).json(recommendations);
});

// Вспомогательная функция для генерации причин рекомендаций
function getRecommendationReason(company, reasons) {
  return reasons?.[company.industry] || 'Проверенный партнер с высоким рейтингом';
}

router.get('/search/history', (req, res) => {
  const history = processMockData(searchMocks.searchHistory);
  res.status(200).json(history);
});

router.get('/search/saved', (req, res) => {
  const savedSearches = processMockData(searchMocks.savedSearches);
  res.status(200).json(savedSearches);
});

router.post('/search/saved', (req, res) => {
  const { name, params } = req.body;
  
  res.status(201).json({
    id: 'saved-' + generateTimestamp(),
    name,
    params,
    createdAt: new Date().toISOString()
  });
});

router.delete('/search/saved/:id', (req, res) => {
  res.status(204).send();
});

router.post('/search/favorites/:companyId', (req, res) => {
  res.status(200).json({ 
    message: authMocks.successMessages?.addedToFavorites || 'Добавлено в избранное' 
  });
});

router.delete('/search/favorites/:companyId', (req, res) => {
  res.status(204).send();
});

// ------------------------------
// Messages (P2P)
// ------------------------------
router.get('/messages/threads', (req, res) => {
  // Для простоты возвращаем все
  res.status(200).json(messageThreads);
});

router.get('/messages/:threadId', (req, res) => {
  const { threadId } = req.params;
  const items = messagesByThread[threadId] || [];
  res.status(200).json(items);
});

router.post('/messages/:threadId', (req, res) => {
  const { threadId } = req.params;
  const { senderCompanyId, text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Validation failed', message: 'text обязателен' });
  if (!messageThreads.find(t => t.id === threadId)) {
    messageThreads.push({ id: threadId, participants: [], lastMessage: text, lastMessageAt: new Date().toISOString() });
  }
  messagesByThread[threadId] = messagesByThread[threadId] || [];
  const msg = { id: 'msg-' + generateTimestamp(), senderCompanyId: senderCompanyId || 'company-123', text, timestamp: new Date().toISOString() };
  messagesByThread[threadId].push(msg);
  res.status(201).json(msg);
});

// ------------------------------
// Bulk requests (до 20)
// ------------------------------
router.post('/requests/bulk', (req, res) => {
  const { text, recipientCompanyIds = [], files = [] } = req.body || {};
  if (!text) return res.status(400).json({ error: 'Validation failed', message: 'text обязателен' });
  if (!Array.isArray(recipientCompanyIds) || recipientCompanyIds.length === 0) {
    return res.status(400).json({ error: 'Validation failed', message: 'recipientCompanyIds обязателен' });
  }
  if (recipientCompanyIds.length > 20) {
    return res.status(400).json({ error: 'Validation failed', message: 'Максимум 20 получателей' });
  }
  const result = recipientCompanyIds.map((id) => ({ companyId: id, success: Math.random() > 0.1, message: 'OK' }));
  lastBulkRequestResult = { id: 'bulk-' + generateTimestamp(), text, files: files.map(f => ({ name: f.name, type: f.type, size: f.size })), result, createdAt: new Date().toISOString() };
  res.status(200).json(lastBulkRequestResult);
});

// ------------------------------
// Reports & Home aggregates
// ------------------------------
router.get('/reports/last', (req, res) => {
  if (!lastBulkRequestResult) return res.status(404).json({ error: 'Not Found' });
  res.status(200).json(lastBulkRequestResult);
});

router.get('/home/aggregates', (req, res) => {
  const docsCount = buyDocs.length;
  const acceptsCount = buyDocs.reduce((sum, d) => sum + d.acceptedBy.length, 0);
  const requestsCount = lastBulkRequestResult ? (lastBulkRequestResult.result?.length || 0) : 0;
  res.status(200).json({ docsCount, acceptsCount, requestsCount });
});


module.exports = router;