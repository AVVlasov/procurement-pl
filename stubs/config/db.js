const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
    
    console.log('\n📡 Попытка подключения к MongoDB...');
    console.log(`   URI: ${mongoUri}`);
    
    const connection = await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    
    console.log('✅ MongoDB подключена успешно!');
    console.log(`   Хост: ${connection.connection.host}`);
    console.log(`   БД: ${connection.connection.name}\n`);
    
    return connection;
  } catch (error) {
    console.error('\n❌ Ошибка подключения к MongoDB:');
    console.error(`   ${error.message}\n`);
    console.warn('⚠️  Приложение продолжит работу с mock данными\n');
    
    return null;
  }
};

module.exports = connectDB;
