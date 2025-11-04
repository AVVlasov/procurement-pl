const mongoose = require('mongoose');
const Request = require('../models/Request');
const Company = require('../models/Company');
const User = require('../models/User');

const mongoUri = process.env.MONGODB_URI || 'mongodb://admin:password@localhost:27017/procurement_db?authSource=admin';

async function seedRequests() {
  try {
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Получаем все компании
    const companies = await Company.find().limit(10).exec();
    if (companies.length < 2) {
      console.error('❌ Need at least 2 companies in database');
      process.exit(1);
    }

    // Получаем тестового пользователя
    const testUser = await User.findOne({ email: 'admin@test-company.ru' }).exec();
    if (!testUser) {
      console.error('❌ Test user not found');
      process.exit(1);
    }

    const testCompanyId = testUser.companyId.toString();
    console.log('📋 Test company ID:', testCompanyId);
    console.log('📋 Found', companies.length, 'companies');

    // Удаляем старые запросы
    await Request.deleteMany({});
    console.log('🗑️  Cleared old requests');

    const requests = [];
    const now = new Date();

    // Создаем отправленные запросы (от тестовой компании)
    for (let i = 0; i < 5; i++) {
      const recipientCompany = companies[i % companies.length];
      if (recipientCompany._id.toString() === testCompanyId) {
        continue;
      }

      const createdAt = new Date(now.getTime() - i * 24 * 60 * 60 * 1000); // За последние 5 дней

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

      const createdAt = new Date(now.getTime() - (i + 1) * 12 * 60 * 60 * 1000); // За последние 1.5 дня

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

    // Сохраняем все запросы
    const savedRequests = await Request.insertMany(requests);
    console.log('✅ Created', savedRequests.length, 'test requests');

    // Статистика
    const sentCount = await Request.countDocuments({ senderCompanyId: testCompanyId });
    const receivedCount = await Request.countDocuments({ recipientCompanyId: testCompanyId });
    const withResponses = await Request.countDocuments({ senderCompanyId: testCompanyId, response: { $ne: null } });

    console.log('📊 Statistics:');
    console.log('  - Sent requests:', sentCount);
    console.log('  - Received requests:', receivedCount);
    console.log('  - With responses:', withResponses);

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await mongoose.connection.close();
    console.log('👋 Disconnected from MongoDB');
  }
}

seedRequests();

