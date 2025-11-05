const mongoose = require('mongoose');

const primaryUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';
const fallbackUri = process.env.MONGODB_AUTH_URI || 'mongodb://admin:password@localhost:27017/procurement_db?authSource=admin';

const isAuthError = (error) => {
  if (!error) {
    return false;
  }

  const authCodes = new Set([18, 13]);
  if (error.code && authCodes.has(error.code)) {
    return true;
  }

  const message = String(error.message || '').toLowerCase();
  return message.includes('auth') || message.includes('authentication');
};

const connectWithUri = async (uri, label) => {
  console.log(`\n📡 Попытка подключения к MongoDB (${label})...`);
  console.log(`   URI: ${uri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:****@')}`);

  const connection = await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  });

  try {
    await connection.connection.db.admin().command({ ping: 1 });
  } catch (pingError) {
    if (isAuthError(pingError)) {
      await mongoose.connection.close().catch(() => {});
      throw pingError;
    }
    console.error('⚠️  MongoDB ping error:', pingError.message);
  }

  console.log('✅ MongoDB подключена успешно!');
  console.log(`   Хост: ${connection.connection.host}`);
  console.log(`   БД: ${connection.connection.name}\n`);
  if (process.env.DEV === 'true') {
    console.log(`   Пользователь: ${connection.connection.user || 'anonymous'}`);
  }

  return connection;
};

const connectDB = async () => {
  const attempts = [];

  if (fallbackUri) {
    attempts.push({ uri: fallbackUri, label: 'AUTH' });
  }

  attempts.push({ uri: primaryUri, label: 'PRIMARY' });

  let lastError = null;

  for (const attempt of attempts) {
    try {
      console.log(`[MongoDB] Trying ${attempt.label} connection...`);
      return await connectWithUri(attempt.uri, attempt.label);
    } catch (error) {
      lastError = error;
      console.error(`\n❌ Ошибка подключения к MongoDB (${attempt.label}):`);
      console.error(`   ${error.message}\n`);

      if (!isAuthError(error)) {
        break;
      }
    }
  }

  if (lastError) {
    console.warn('⚠️  Приложение продолжит работу с mock данными\n');
  }

  return null;
};

module.exports = connectDB;
