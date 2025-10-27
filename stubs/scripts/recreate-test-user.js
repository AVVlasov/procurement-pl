const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config();

// Импорт моделей
const User = require(path.join(__dirname, '..', 'models', 'User'));
const Company = require(path.join(__dirname, '..', 'models', 'Company'));

const recreateTestUser = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
    
    console.log('\n🔄 Подключение к MongoDB...');
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('✅ Подключено к MongoDB\n');

    // Удалить старого тестового пользователя
    console.log('🗑️  Удаление старого тестового пользователя...');
    const oldUser = await User.findOne({ email: 'admin@test-company.ru' });
    if (oldUser) {
      // Удалить связанную компанию
      if (oldUser.companyId) {
        await Company.findByIdAndDelete(oldUser.companyId);
        console.log('   ✓ Старая компания удалена');
      }
      await User.findByIdAndDelete(oldUser._id);
      console.log('   ✓ Старый пользователь удален');
    } else {
      console.log('   ℹ️  Старый пользователь не найден');
    }

    // Создать новую компанию с правильной кодировкой UTF-8
    console.log('\n🏢 Создание тестовой компании...');
    const company = await Company.create({
      fullName: 'ООО "Тестовая Компания"',
      inn: '1234567890',
      ogrn: '1234567890123',
      legalForm: 'ООО',
      industry: 'IT',
      companySize: '50-100',
      website: 'https://test-company.ru',
      description: 'Тестовая компания для разработки',
      address: 'г. Москва, ул. Тестовая, д. 1',
      rating: 4.5,
      reviewsCount: 10,
      dealsCount: 25,
    });
    console.log('   ✓ Компания создана:', company.fullName);

    // Создать нового пользователя с правильной кодировкой UTF-8
    console.log('\n👤 Создание тестового пользователя...');
    const user = await User.create({
      email: 'admin@test-company.ru',
      password: 'SecurePass123!',
      firstName: 'Иван',
      lastName: 'Иванов',
      position: 'Директор',
      phone: '+7 (999) 123-45-67',
      companyId: company._id,
    });
    console.log('   ✓ Пользователь создан:', user.firstName, user.lastName);

    // Проверка что данные сохранены правильно
    console.log('\n✅ Проверка данных:');
    console.log('   Email:', user.email);
    console.log('   Имя:', user.firstName);
    console.log('   Фамилия:', user.lastName);
    console.log('   Компания:', company.fullName);
    console.log('   Должность:', user.position);

    console.log('\n✅ ГОТОВО! Тестовый пользователь создан с правильной кодировкой UTF-8');
    console.log('\n📋 Данные для входа:');
    console.log('   Email:  admin@test-company.ru');
    console.log('   Пароль: SecurePass123!');
    console.log('');

    // Обновить существующие mock компании
    console.log('\n🔄 Обновление существующих mock компаний...');
    const updates = [
      { inn: '7707083894', updates: { companySize: '51-250', partnerGeography: ['moscow', 'russia_all'] } },
      { inn: '7707083895', updates: { companySize: '500+', partnerGeography: ['moscow', 'russia_all'] } },
      { inn: '7707083896', updates: { companySize: '11-50', partnerGeography: ['moscow', 'russia_all'] } },
      { inn: '7707083897', updates: { companySize: '51-250', partnerGeography: ['moscow', 'russia_all'] } },
      { inn: '7707083898', updates: { companySize: '251-500', partnerGeography: ['moscow', 'russia_all'] } },
    ];

    for (const item of updates) {
      await Company.updateOne({ inn: item.inn }, { $set: item.updates });
      console.log(`   ✓ Компания обновлена: INN ${item.inn}`);
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

