const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Подключение моделей
const Activity = require(path.join(__dirname, '..', 'models', 'Activity'));
const User = require(path.join(__dirname, '..', 'models', 'User'));
const Company = require(path.join(__dirname, '..', 'models', 'Company'));

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement-platform';

const activityTemplates = [
  {
    type: 'request_received',
    title: 'Получен новый запрос',
    description: 'Компания отправила вам запрос на поставку товаров',
  },
  {
    type: 'request_sent',
    title: 'Запрос отправлен',
    description: 'Ваш запрос был отправлен компании',
  },
  {
    type: 'request_response',
    title: 'Получен ответ на запрос',
    description: 'Компания ответила на ваш запрос',
  },
  {
    type: 'product_accepted',
    title: 'Товар акцептован',
    description: 'Ваш товар был акцептован компанией',
  },
  {
    type: 'message_received',
    title: 'Новое сообщение',
    description: 'Вы получили новое сообщение от компании',
  },
  {
    type: 'review_received',
    title: 'Новый отзыв',
    description: 'Компания оставила отзыв о сотрудничестве',
  },
  {
    type: 'profile_updated',
    title: 'Профиль обновлен',
    description: 'Информация о вашей компании была обновлена',
  },
  {
    type: 'buy_product_added',
    title: 'Добавлен товар для закупки',
    description: 'В раздел "Я покупаю" добавлен новый товар',
  },
];

async function seedActivities() {
  try {
    console.log('🌱 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Найти тестового пользователя
    const testUser = await User.findOne({ email: 'admin@test-company.ru' });
    if (!testUser) {
      console.log('❌ Test user not found. Please run recreate-test-user.js first.');
      process.exit(1);
    }

    const company = await Company.findById(testUser.companyId);
    if (!company) {
      console.log('❌ Company not found');
      process.exit(1);
    }

    // Найти другие компании для связанных активностей
    const otherCompanies = await Company.find({
      _id: { $ne: company._id }
    }).limit(3);

    console.log('🗑️  Clearing existing activities...');
    await Activity.deleteMany({ companyId: company._id.toString() });

    console.log('➕ Creating activities...');
    const activities = [];

    for (let i = 0; i < 8; i++) {
      const template = activityTemplates[i % activityTemplates.length];
      const relatedCompany = otherCompanies[i % otherCompanies.length];
      
      const activity = {
        companyId: company._id.toString(),
        userId: testUser._id.toString(),
        type: template.type,
        title: template.title,
        description: template.description,
        relatedCompanyId: relatedCompany?._id.toString(),
        relatedCompanyName: relatedCompany?.shortName || relatedCompany?.fullName,
        read: i >= 5, // Первые 5 непрочитанные
        createdAt: new Date(Date.now() - i * 3600000), // Каждый час назад
      };

      activities.push(activity);
    }

    await Activity.insertMany(activities);

    console.log(`✅ Created ${activities.length} activities`);
    console.log('✨ Activities seeded successfully!');

    await mongoose.connection.close();
    console.log('👋 Database connection closed');
  } catch (error) {
    console.error('❌ Error seeding activities:', error);
    process.exit(1);
  }
}

// Запуск
if (require.main === module) {
  seedActivities();
}

module.exports = { seedActivities };

