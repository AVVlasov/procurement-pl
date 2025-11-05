const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const Company = require('../models/Company');

// Функция для логирования с проверкой DEV переменной
const log = (message, data = '') => {
  if (process.env.DEV === 'true') {
    if (data) {
      console.log(message, data);
    } else {
      console.log(message);
    }
  }
};

// GET /search/recommendations - получить рекомендации компаний (ДОЛЖЕН быть ПЕРЕД /*)
router.get('/recommendations', verifyToken, async (req, res) => {
  try {
    // Получить компанию пользователя, чтобы исключить её из результатов
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    let filter = {};
    if (user && user.companyId) {
      filter._id = { $ne: user.companyId };
    }

    const companies = await Company.find(filter)
      .sort({ rating: -1 })
      .limit(5);

    const recommendations = companies.map(company => ({
      id: company._id.toString(),
      name: company.fullName || company.shortName,
      industry: company.industry,
      logo: company.logo,
      matchScore: Math.floor(Math.random() * 30 + 70), // 70-100
      reason: 'Matches your search criteria'
    }));

    log('[Search] Returned recommendations:', recommendations.length);

    res.json(recommendations);
  } catch (error) {
    console.error('[Search] Recommendations error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

// GET /search - Поиск компаний
router.get('/', verifyToken, async (req, res) => {
  try {
    console.log('[Search] === NEW VERSION WITH FIXED SIZE FILTER ===');
    
    const { 
      query = '', 
      page = 1, 
      limit = 10,
      offset, // Добавляем поддержку offset для точной пагинации
      industries,
      companySize,
      geography,
      minRating = 0,
      hasReviews,
      hasAcceptedDocs,
      sortBy = 'relevance',
      sortOrder = 'desc',
      minEmployees, // Кастомный фильтр: минимум сотрудников
      maxEmployees  // Кастомный фильтр: максимум сотрудников
    } = req.query;
    
    console.log('[Search] Filters:', { minEmployees, maxEmployees, companySize });

    // Получить компанию пользователя, чтобы исключить её из результатов
    const User = require('../models/User');
    const user = await User.findById(req.userId);
    
    log('[Search] Request params:', { query, industries, companySize, geography, minRating, hasReviews, hasAcceptedDocs, sortBy, sortOrder });
    
    // Маппинг кодов фильтров на значения в БД
    const industryMap = {
      'it': 'IT',
      'finance': 'Финансы',
      'manufacturing': 'Производство',
      'construction': 'Строительство',
      'retail': 'Розничная торговля',
      'wholesale': 'Оптовая торговля',
      'logistics': 'Логистика',
      'healthcare': 'Здравоохранение',
      'education': 'Образование',
      'consulting': 'Консалтинг',
      'marketing': 'Маркетинг',
      'realestate': 'Недвижимость',
      'food': 'Пищевая промышленность',
      'agriculture': 'Сельское хозяйство',
      'energy': 'Энергетика',
      'telecom': 'Телекоммуникации',
      'media': 'Медиа'
    };
    
    // Начальный фильтр: исключить собственную компанию
    let filters = [];
    
    if (user && user.companyId) {
      filters.push({ _id: { $ne: user.companyId } });
    }

    // Текстовый поиск
    if (query && query.trim()) {
      const q = query.toLowerCase();
      filters.push({
        $or: [
          { fullName: { $regex: q, $options: 'i' } },
          { shortName: { $regex: q, $options: 'i' } },
          { slogan: { $regex: q, $options: 'i' } },
          { industry: { $regex: q, $options: 'i' } }
        ]
      });
    }

    // Фильтр по отраслям - преобразуем коды в значения БД
    if (industries) {
      const industryList = Array.isArray(industries) ? industries : [industries];
      if (industryList.length > 0) {
        const dbIndustries = industryList
          .map(code => industryMap[code])
          .filter(val => val !== undefined);
        
        log('[Search] Raw industries param:', industries);
        log('[Search] Industry codes:', industryList, 'Mapped to:', dbIndustries);
        
        if (dbIndustries.length > 0) {
          filters.push({ industry: { $in: dbIndustries } });
          log('[Search] Added industry filter:', { industry: { $in: dbIndustries } });
        } else {
          log('[Search] No industries mapped! Codes were:', industryList);
        }
      }
    }

    // Функция для парсинга диапазона из строки вида "51-250" или "500+"
    const parseEmployeeRange = (sizeStr) => {
      if (sizeStr.includes('+')) {
        const min = parseInt(sizeStr.replace('+', ''));
        return { min, max: Infinity };
      }
      const parts = sizeStr.split('-');
      return {
        min: parseInt(parts[0]),
        max: parts[1] ? parseInt(parts[1]) : parseInt(parts[0])
      };
    };

    // Функция для проверки пересечения двух диапазонов
    const rangesOverlap = (range1, range2) => {
      return range1.min <= range2.max && range1.max >= range2.min;
    };

    // Фильтр по размеру компании (чекбоксы) или кастомный диапазон
    // Важно: этот фильтр должен получить все компании для корректной работы пересечения диапазонов
    let sizeFilteredIds = null;
    if ((companySize && companySize.length > 0) || minEmployees || maxEmployees) {
      // Получаем все компании (без других фильтров, так как размер компании - это property-based фильтр)
      const allCompanies = await Company.find({});
      
      log('[Search] Employee size filter - checking companies:', allCompanies.length);
      
      let matchingIds = [];
      
      // Если есть кастомный диапазон - используем его
      if (minEmployees || maxEmployees) {
        const customRange = {
          min: minEmployees ? parseInt(minEmployees, 10) : 0,
          max: maxEmployees ? parseInt(maxEmployees, 10) : Infinity
        };
        
        log('[Search] Custom employee range filter:', customRange);
        
        matchingIds = allCompanies
          .filter(company => {
            if (!company.companySize) {
              log('[Search] Company has no size:', company.fullName);
              return false;
            }
            
            const companyRange = parseEmployeeRange(company.companySize);
            const overlaps = rangesOverlap(companyRange, customRange);
            
            log('[Search] Checking overlap:', { 
              company: company.fullName, 
              companyRange, 
              customRange, 
              overlaps 
            });
            
            return overlaps;
          })
          .map(c => c._id);
        
        log('[Search] Matching companies by custom range:', matchingIds.length);
      } 
      // Иначе используем чекбоксы
      else if (companySize && companySize.length > 0) {
        const sizeList = Array.isArray(companySize) ? companySize : [companySize];
        
        log('[Search] Company size checkboxes filter:', sizeList);
        
        matchingIds = allCompanies
          .filter(company => {
            if (!company.companySize) {
              return false;
            }
            
            const companyRange = parseEmployeeRange(company.companySize);
            
            // Проверяем пересечение с любым из выбранных диапазонов
            const matches = sizeList.some(selectedSize => {
              const filterRange = parseEmployeeRange(selectedSize);
              const overlaps = rangesOverlap(companyRange, filterRange);
              log('[Search] Check:', company.fullName, companyRange, 'vs', filterRange, '=', overlaps);
              return overlaps;
            });
            
            return matches;
          })
          .map(c => c._id);
        
        log('[Search] Matching companies by size checkboxes:', matchingIds.length);
      }
      
      // Сохраняем ID для дальнейшей фильтрации
      sizeFilteredIds = matchingIds;
      log('[Search] Size filtered IDs count:', sizeFilteredIds.length);
    }

    // Фильтр по географии
    if (geography) {
      const geoList = Array.isArray(geography) ? geography : [geography];
      if (geoList.length > 0) {
        filters.push({ partnerGeography: { $in: geoList } });
        log('[Search] Geography filter:', { partnerGeography: { $in: geoList } });
      }
    }

    // Фильтр по рейтингу
    if (minRating) {
      const rating = parseFloat(minRating);
      if (rating > 0) {
        filters.push({ rating: { $gte: rating } });
      }
    }

    // Фильтр по отзывам
    if (hasReviews === 'true') {
      filters.push({ verified: true });
    }

    // Фильтр по акцептам
    if (hasAcceptedDocs === 'true') {
      filters.push({ verified: true });
    }

    // Применяем фильтр по размеру компании (если был задан)
    if (sizeFilteredIds !== null) {
      if (sizeFilteredIds.length > 0) {
        filters.push({ _id: { $in: sizeFilteredIds } });
        log('[Search] Applied size filter, IDs:', sizeFilteredIds.length);
      } else {
        // Если нет подходящих компаний по размеру, возвращаем пустой результат
        filters.push({ _id: null });
        log('[Search] No companies match size criteria');
      }
    }

    // Комбинировать все фильтры
    let filter = filters.length > 0 ? { $and: filters } : {};

    // Пагинация - используем offset если передан, иначе вычисляем из page
    const limitNum = parseInt(limit) || 10;
    const skip = offset !== undefined ? parseInt(offset) : ((parseInt(page) || 1) - 1) * limitNum;
    const pageNum = offset !== undefined ? Math.floor(skip / limitNum) + 1 : parseInt(page) || 1;

    // Сортировка
    let sortOptions = {};
    if (sortBy === 'name') {
      sortOptions.fullName = sortOrder === 'asc' ? 1 : -1;
    } else {
      sortOptions.rating = sortOrder === 'asc' ? 1 : -1;
    }

    log('[Search] Final MongoDB filter:', JSON.stringify(filter, null, 2));

    let filterDebug = filters.length > 0 ? { $and: filters } : {};
    const allCompanies = await Company.find({});
    log('[Search] All companies in DB:', allCompanies.map(c => ({ name: c.fullName, geography: c.partnerGeography, industry: c.industry })));

    const total = await Company.countDocuments(filter);
    const companies = await Company.find(filter)
      .sort(sortOptions)
      .skip(skip)
      .limit(limitNum);

    const paginatedResults = companies.map(c => ({
      ...c.toObject(),
      id: c._id
    }));

    log('[Search] Query:', query, 'Industries:', industries, 'Size:', companySize, 'Geo:', geography);
    log('[Search] Total found:', total, 'Returning:', paginatedResults.length, 'companies');
    log('[Search] Company details:', paginatedResults.map(c => ({ name: c.fullName, industry: c.industry })));

    res.json({
      companies: paginatedResults,
      total,
      page: pageNum,
      totalPages: Math.ceil(total / limitNum),
      _debug: {
        filter: JSON.stringify(filter),
        industriesReceived: industries
      }
    });
  } catch (error) {
    console.error('[Search] Error:', error.message);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
});

module.exports = router;


