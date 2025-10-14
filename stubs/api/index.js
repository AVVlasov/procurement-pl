const router = require('express').Router();
const fs = require('fs');
const path = require('path');

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

// Загружаем моки из JSON файлов
const loadMockData = (filename) => {
  try {
    const filePath = path.join(__dirname, '..', 'mocks', filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error(`Ошибка загрузки ${filename}:`, error);
    return {};
  }
};

// Загружаем все моки
const userMocks = loadMockData('user.json');
const companyMocks = loadMockData('companies.json');
const productMocks = loadMockData('products.json');
const searchMocks = loadMockData('search.json');
const authMocks = loadMockData('auth.json');

// Логируем загруженные данные для отладки
console.log('SearchMocks loaded:', searchMocks);
console.log('Suggestions:', searchMocks.suggestions);

// Вспомогательные функции для генерации динамических данных
const generateTimestamp = () => Date.now();
const generateDate = (daysAgo) => new Date(Date.now() - 86400000 * daysAgo).toISOString();

// Функция для замены плейсхолдеров в данных
const processMockData = (data) => {
  const timestamp = generateTimestamp();
  const processedData = JSON.stringify(data)
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
  
  return JSON.parse(processedData);
};

// Auth endpoints
router.post('/auth/login', (req, res) => {
  const { email, password } = req.body;
  
  if (!email || !password) {
    return res.status(400).json({ 
      error: 'Validation failed',
      message: authMocks.errorMessages?.validationFailed || 'Email и пароль обязательны' 
    });
  }
  
  // Имитация неверных учетных данных
  if (password === 'wrong') {
    return res.status(401).json({ 
      error: 'Unauthorized',
      message: authMocks.errorMessages?.invalidCredentials || 'Неверный email или пароль' 
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
router.get('/search', (req, res) => {
  const { 
    query, 
    industries, 
    companySize,
    geography,
    minRating, 
    type,
    sortBy = 'relevance',
    sortOrder = 'desc',
    page = 1, 
    limit = 20 
  } = req.query;
  
  console.log('Search query:', query);
  console.log('Search params:', req.query);
  
  const companies = processMockData(companyMocks.mockCompanies);
  console.log('Companies loaded:', companies.length);
  console.log('First company:', companies[0]);
  
  let filtered = [...companies];
  
  // Поиск по тексту
  if (query) {
    const q = query.toLowerCase().trim();
    console.log('Searching for:', q);
    
    filtered = filtered.filter(c => {
      const fullName = (c.fullName || '').toLowerCase();
      const shortName = (c.shortName || '').toLowerCase();
      const industry = (c.industry || '').toLowerCase();
      const slogan = (c.slogan || '').toLowerCase();
      const legalAddress = (c.legalAddress || '').toLowerCase();
      
      const matches = fullName.includes(q) ||
                     shortName.includes(q) ||
                     industry.includes(q) ||
                     slogan.includes(q) ||
                     legalAddress.includes(q);
      
      if (matches) {
        console.log('Found match:', c.shortName, 'in', { fullName, shortName, industry, slogan, legalAddress });
      }
      
      return matches;
    });
    
    console.log('Filtered results:', filtered.length);
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
  console.log('Suggestions loaded:', suggestions);
  console.log('Query:', q);
  
  const filtered = q 
    ? suggestions.filter(s => s.toLowerCase().includes(q.toLowerCase()))
    : suggestions.slice(0, 10); // Показываем только первые 10 если нет запроса
  
  console.log('Filtered suggestions:', filtered);
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

module.exports = router;