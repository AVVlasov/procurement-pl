const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Импорт моделей
const User = require(path.join(__dirname, '..', 'models', 'User'));
const Company = require(path.join(__dirname, '..', 'models', 'Company'));
const Request = require(path.join(__dirname, '..', 'models', 'Request'));

const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
const fallbackUri =
  process.env.MONGODB_AUTH_URI || 'mongodb://admin:password@localhost:27017/procurement_db?authSource=admin';

const connectWithFallback = async () => {
  // Сначала пробуем FALLBACK (с аутентификацией)
  try {
    console.log('\n📡 Подключение к MongoDB (с аутентификацией)...');
    await mongoose.connect(fallbackUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Подключено к MongoDB');
    return;
  } catch (fallbackError) {
    console.log('❌ Ошибка подключения с аутентификацией:', fallbackError.message);
  }

  // Если не получилось, пробуем без аутентификации
  try {
    console.log('\n📡 Подключение к MongoDB (без аутентификации)...');
    await mongoose.connect(primaryUri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('✅ Подключено к MongoDB');
  } catch (primaryError) {
    console.error('❌ Не удалось подключиться к MongoDB:', primaryError.message);
    throw primaryError;
  }
};

const recreateTestUser = async () => {
  try {
    await connectWithFallback();

    const presetCompanyId = new mongoose.Types.ObjectId('68fe2ccda3526c303ca06796');
    const presetUserEmail = 'admin@test-company.ru';
    
    const presetCompanyId2 = new mongoose.Types.ObjectId('68fe2ccda3526c303ca06797');
    const presetUserEmail2 = 'manager@partner-company.ru';

    // Удалить старых тестовых пользователей
    console.log('🗑️  Удаление старых тестовых пользователей...');
    const testEmails = [presetUserEmail, presetUserEmail2];
    
    for (const email of testEmails) {
      const oldUser = await User.findOne({ email });
      if (oldUser) {
        // Удалить связанную компанию
        if (oldUser.companyId) {
          await Company.findByIdAndDelete(oldUser.companyId);
          console.log(`   ✓ Старая компания для ${email} удалена`);
        }
        await User.findByIdAndDelete(oldUser._id);
        console.log(`   ✓ Старый пользователь ${email} удален`);
      } else {
        console.log(`   ℹ️  Пользователь ${email} не найден`);
      }
    }

    // Создать новую компанию с правильной кодировкой UTF-8
    console.log('\n🏢 Создание тестовой компании...');
    const company = await Company.create({
      _id: presetCompanyId,
      fullName: 'ООО "Тестовая Компания"',
      shortName: 'Тестовая Компания',
      inn: '1234567890',
      ogrn: '1234567890123',
      legalForm: 'ООО',
      industry: 'IT',
      companySize: '51-250',
      website: 'https://test-company.ru',
      phone: '+7 (999) 123-45-67',
      email: 'info@test-company.ru',
      description: 'Тестовая компания для разработки',
      legalAddress: 'г. Москва, ул. Тестовая, д. 1',
      actualAddress: 'г. Москва, ул. Тестовая, д. 1',
      foundedYear: 2015,
      employeeCount: '51-250',
      revenue: 'До 120 млн ₽',
      rating: 4.5,
      reviews: 10,
      verified: true,
      partnerGeography: ['moscow', 'russia_all'],
      slogan: 'Ваш надежный партнер в IT',
    });
    console.log('   ✓ Компания создана:', company.fullName);

    // Создать первого пользователя с правильной кодировкой UTF-8
    console.log('\n👤 Создание первого тестового пользователя...');
    const user = await User.create({
      email: presetUserEmail,
      password: 'SecurePass123!',
      firstName: 'Иван',
      lastName: 'Иванов',
      position: 'Директор',
      phone: '+7 (999) 123-45-67',
      companyId: company._id,
    });
    console.log('   ✓ Пользователь создан:', user.firstName, user.lastName);

    // Создать вторую компанию
    console.log('\n🏢 Создание второй тестовой компании...');
    const company2 = await Company.create({
      _id: presetCompanyId2,
      fullName: 'ООО "Партнер"',
      shortName: 'Партнер',
      inn: '9876543210',
      ogrn: '1089876543210',
      legalForm: 'ООО',
      industry: 'Торговля',
      companySize: '11-50',
      website: 'https://partner-company.ru',
      phone: '+7 (495) 987-65-43',
      email: 'info@partner-company.ru',
      description: 'Надежный партнер для бизнеса',
      legalAddress: 'г. Санкт-Петербург, пр. Невский, д. 100',
      actualAddress: 'г. Санкт-Петербург, пр. Невский, д. 100',
      foundedYear: 2018,
      employeeCount: '11-50',
      revenue: 'До 60 млн ₽',
      rating: 4.3,
      reviews: 5,
      verified: true,
      partnerGeography: ['spb', 'russia_all'],
      slogan: 'Качество и надежность',
    });
    console.log('   ✓ Компания создана:', company2.fullName);

    // Создать второго пользователя
    console.log('\n👤 Создание второго тестового пользователя...');
    const user2 = await User.create({
      email: presetUserEmail2,
      password: 'SecurePass123!',
      firstName: 'Петр',
      lastName: 'Петров',
      position: 'Менеджер',
      phone: '+7 (495) 987-65-43',
      companyId: company2._id,
    });
    console.log('   ✓ Пользователь создан:', user2.firstName, user2.lastName);

    // Проверка что данные сохранены правильно
    console.log('\n✅ Проверка данных:');
    console.log('\n   Пользователь 1:');
    console.log('   Email:', user.email);
    console.log('   Имя:', user.firstName);
    console.log('   Фамилия:', user.lastName);
    console.log('   Компания:', company.fullName);
    console.log('   Должность:', user.position);
    
    console.log('\n   Пользователь 2:');
    console.log('   Email:', user2.email);
    console.log('   Имя:', user2.firstName);
    console.log('   Фамилия:', user2.lastName);
    console.log('   Компания:', company2.fullName);
    console.log('   Должность:', user2.position);

    console.log('\n✅ ГОТОВО! Тестовые пользователи созданы с правильной кодировкой UTF-8');
    console.log('\n📋 Данные для входа:');
    console.log('\n   Пользователь 1:');
    console.log('   Email:  admin@test-company.ru');
    console.log('   Пароль: SecurePass123!');
    console.log('\n   Пользователь 2:');
    console.log('   Email:  manager@partner-company.ru');
    console.log('   Пароль: SecurePass123!');
    console.log('');

    // Создать дополнительные тестовые компании для поиска
    console.log('\n🏢 Создание дополнительных тестовых компаний...');
    const testCompanies = [
      {
        fullName: 'ООО "ТехноСтрой"',
        shortName: 'ТехноСтрой',
        inn: '7707083894',
        ogrn: '1077707083894',
        legalForm: 'ООО',
        industry: 'Строительство',
        companySize: '51-250',
        website: 'https://technostroy.ru',
        phone: '+7 (495) 111-22-33',
        email: 'info@technostroy.ru',
        description: 'Строительство промышленных объектов',
        foundedYear: 2010,
        employeeCount: '51-250',
        revenue: 'До 2 млрд ₽',
        rating: 4.2,
        reviews: 15,
        verified: true,
        partnerGeography: ['moscow', 'russia_all'],
        slogan: 'Строим будущее вместе',
      },
      {
        fullName: 'АО "ФинансГрупп"',
        shortName: 'ФинансГрупп',
        inn: '7707083895',
        ogrn: '1077707083895',
        legalForm: 'АО',
        industry: 'Финансы',
        companySize: '500+',
        website: 'https://finansgrupp.ru',
        phone: '+7 (495) 222-33-44',
        email: 'contact@finansgrupp.ru',
        description: 'Финансовые услуги для бизнеса',
        foundedYear: 2005,
        employeeCount: '500+',
        revenue: 'Более 2 млрд ₽',
        rating: 4.8,
        reviews: 50,
        verified: true,
        partnerGeography: ['moscow', 'russia_all', 'international'],
        slogan: 'Финансовая стабильность',
      },
      {
        fullName: 'ООО "ИТ Решения"',
        shortName: 'ИТ Решения',
        inn: '7707083896',
        ogrn: '1077707083896',
        legalForm: 'ООО',
        industry: 'IT',
        companySize: '11-50',
        website: 'https://it-solutions.ru',
        phone: '+7 (495) 333-44-55',
        email: 'hello@it-solutions.ru',
        description: 'Разработка программного обеспечения',
        foundedYear: 2018,
        employeeCount: '11-50',
        revenue: 'До 60 млн ₽',
        rating: 4.5,
        reviews: 8,
        verified: true,
        partnerGeography: ['moscow', 'spb', 'russia_all'],
        slogan: 'Инновации для вашего бизнеса',
      },
      {
        fullName: 'ООО "ЛогистикПро"',
        shortName: 'ЛогистикПро',
        inn: '7707083897',
        ogrn: '1077707083897',
        legalForm: 'ООО',
        industry: 'Логистика',
        companySize: '51-250',
        website: 'https://logistikpro.ru',
        phone: '+7 (495) 444-55-66',
        email: 'info@logistikpro.ru',
        description: 'Транспортные и логистические услуги',
        foundedYear: 2012,
        employeeCount: '51-250',
        revenue: 'До 120 млн ₽',
        rating: 4.3,
        reviews: 20,
        verified: true,
        partnerGeography: ['russia_all', 'cis'],
        slogan: 'Доставим в срок',
      },
      {
        fullName: 'ООО "ПродуктТрейд"',
        shortName: 'ПродуктТрейд',
        inn: '7707083898',
        ogrn: '1077707083898',
        legalForm: 'ООО',
        industry: 'Оптовая торговля',
        companySize: '251-500',
        website: 'https://produkttrade.ru',
        phone: '+7 (495) 555-66-77',
        email: 'sales@produkttrade.ru',
        description: 'Оптовая торговля продуктами питания',
        foundedYear: 2008,
        employeeCount: '251-500',
        revenue: 'До 2 млрд ₽',
        rating: 4.1,
        reviews: 30,
        verified: true,
        partnerGeography: ['moscow', 'russia_all'],
        slogan: 'Качество и надежность',
      },
      {
        fullName: 'ООО "МедСервис"',
        shortName: 'МедСервис',
        inn: '7707083899',
        ogrn: '1077707083899',
        legalForm: 'ООО',
        industry: 'Здравоохранение',
        companySize: '11-50',
        website: 'https://medservice.ru',
        phone: '+7 (495) 666-77-88',
        email: 'info@medservice.ru',
        description: 'Медицинские услуги и оборудование',
        foundedYear: 2016,
        employeeCount: '11-50',
        revenue: 'До 60 млн ₽',
        rating: 4.6,
        reviews: 12,
        verified: true,
        partnerGeography: ['moscow', 'central'],
        slogan: 'Забота о вашем здоровье',
      },
    ];

    for (const companyData of testCompanies) {
      await Company.updateOne(
        { inn: companyData.inn },
        { $set: companyData },
        { upsert: true }
      );
      console.log(`   ✓ Компания создана/обновлена: ${companyData.shortName}`);
    }

    // Создать тестовые запросы
    console.log('\n📨 Создание тестовых запросов...');
    await Request.deleteMany({});
    
    const companies = await Company.find().limit(10).exec();
    const testCompanyId = company._id.toString();
    const requests = [];
    const now = new Date();

    // Создаем отправленные запросы (от тестовой компании)
    for (let i = 0; i < 5; i++) {
      const recipientCompany = companies[i % companies.length];
      if (recipientCompany._id.toString() === testCompanyId) {
        continue;
      }

      const createdAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);

      requests.push({
        senderCompanyId: testCompanyId,
        recipientCompanyId: recipientCompany._id.toString(),
        subject: `Запрос на поставку ${i + 1}`,
        text: `Здравствуйте! Интересует поставка товаров/услуг. Запрос ${i + 1}. Прошу предоставить коммерческое предложение.`,
        files: [],
        responseFiles: [],
        status: i % 3 === 0 ? 'accepted' : i % 3 === 1 ? 'rejected' : 'pending',
        response: i % 3 === 0 
          ? 'Благодарим за запрос! Готовы предоставить услуги. Отправили КП на почту.' 
          : i % 3 === 1 
            ? 'К сожалению, в данный момент не можем предоставить эти услуги.'
            : null,
        respondedAt: i % 3 !== 2 ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : null,
        createdAt,
        updatedAt: i % 3 !== 2 ? new Date(createdAt.getTime() + 2 * 60 * 60 * 1000) : createdAt,
      });
    }

    // Создаем полученные запросы (к тестовой компании)
    for (let i = 0; i < 3; i++) {
      const senderCompany = companies[(i + 2) % companies.length];
      if (senderCompany._id.toString() === testCompanyId) {
        continue;
      }

      const createdAt = new Date(now.getTime() - (i + 1) * 12 * 60 * 60 * 1000);

      requests.push({
        senderCompanyId: senderCompany._id.toString(),
        recipientCompanyId: testCompanyId,
        subject: `Предложение о сотрудничестве ${i + 1}`,
        text: `Добрый день! Предлагаем сотрудничество. Запрос ${i + 1}. Заинтересованы в вашей продукции.`,
        files: [],
        responseFiles: [],
        status: 'pending',
        response: null,
        respondedAt: null,
        createdAt,
        updatedAt: createdAt,
      });
    }

    if (requests.length > 0) {
      await Request.insertMany(requests);
      console.log(`   ✓ Создано ${requests.length} тестовых запросов`);
    }

    await mongoose.connection.close();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    console.error(error);
    process.exit(1);
  }
};

// Запуск
recreateTestUser();

