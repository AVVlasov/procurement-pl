const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config({ path: '../../.env' });

const mongoUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/procurement_db';

async function migrateMessages() {
  try {
    console.log('[Migration] Connecting to MongoDB...');
    await mongoose.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      connectTimeoutMS: 5000,
    });
    console.log('[Migration] Connected to MongoDB');

    // Найти все сообщения
    const allMessages = await Message.find().exec();
    console.log('[Migration] Found', allMessages.length, 'total messages');

    let fixedCount = 0;
    let errorCount = 0;

    // Проходим по каждому сообщению
    for (const message of allMessages) {
      try {
        const threadId = message.threadId;
        if (!threadId) {
          console.log('[Migration] Skipping message', message._id, '- no threadId');
          continue;
        }

        // Парсим threadId формата "thread-id1-id2" или "id1-id2"
        let ids = threadId.replace('thread-', '').split('-');
        
        if (ids.length < 2) {
          console.log('[Migration] Invalid threadId format:', threadId);
          errorCount++;
          continue;
        }

        const companyId1 = ids[0];
        const companyId2 = ids[1];

        // Сравниваем с senderCompanyId
        const senderIdString = message.senderCompanyId.toString ? message.senderCompanyId.toString() : message.senderCompanyId;
        const expectedRecipient = senderIdString === companyId1 ? companyId2 : companyId1;

        // Если recipientCompanyId не установлена или неправильная - исправляем
        if (!message.recipientCompanyId || message.recipientCompanyId.toString() !== expectedRecipient) {
          console.log('[Migration] Fixing message', message._id);
          console.log('  Old recipientCompanyId:', message.recipientCompanyId);
          console.log('  Expected:', expectedRecipient);

          // Конвертируем в ObjectId если нужно
          const { ObjectId } = require('mongoose').Types;
          let recipientObjectId = expectedRecipient;
          try {
            if (typeof expectedRecipient === 'string' && ObjectId.isValid(expectedRecipient)) {
              recipientObjectId = new ObjectId(expectedRecipient);
            }
          } catch (e) {
            console.log('  Could not convert to ObjectId');
          }

          await Message.updateOne(
            { _id: message._id },
            { recipientCompanyId: recipientObjectId }
          );

          fixedCount++;
          console.log('  ✅ Fixed');
        }
      } catch (err) {
        console.error('[Migration] Error processing message', message._id, ':', err.message);
        errorCount++;
      }
    }

    console.log('[Migration] ✅ Migration completed!');
    console.log('[Migration] Fixed:', fixedCount, 'messages');
    console.log('[Migration] Errors:', errorCount);

    await mongoose.connection.close();
    console.log('[Migration] Disconnected from MongoDB');
  } catch (err) {
    console.error('[Migration] ❌ Error:', err.message);
    process.exit(1);
  }
}

migrateMessages();
