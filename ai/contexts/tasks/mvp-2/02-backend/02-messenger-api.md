# Задача: Backend API для мессенджера (MVP 2)

## Описание
Реализация backend API для внутреннего мессенджера с WebSocket поддержкой.

## Цель
Обеспечить реал-тайм обмен сообщениями между компаниями.

## Технические требования

### 1. WebSocket Server (Socket.io)

**backend/src/websocket/server.js**
```javascript
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');

class WebSocketServer {
  constructor(httpServer) {
    this.io = socketio(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL,
        methods: ['GET', 'POST'],
      },
    });

    this.connectedUsers = new Map();
    this.setupMiddleware();
    this.setupHandlers();
  }

  setupMiddleware() {
    // Authentication middleware
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.userId = decoded.id;
        socket.companyId = decoded.companyId;
        next();
      } catch (error) {
        next(new Error('Authentication error'));
      }
    });
  }

  setupHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`User connected: ${socket.userId}`);
      
      // Добавить в список онлайн пользователей
      this.connectedUsers.set(socket.userId, socket.id);
      this.broadcastOnlineStatus(socket.userId, true);

      // Join user's rooms (conversations)
      this.joinUserRooms(socket);

      // Обработчики событий
      socket.on('send_message', (data) => this.handleSendMessage(socket, data));
      socket.on('typing', (data) => this.handleTyping(socket, data));
      socket.on('read_messages', (data) => this.handleReadMessages(socket, data));
      socket.on('disconnect', () => this.handleDisconnect(socket));
    });
  }

  async joinUserRooms(socket) {
    // Присоединить к комнатам всех разговоров пользователя
    const conversations = await Conversation.findByUserId(socket.userId);
    conversations.forEach((conv) => {
      socket.join(`conversation:${conv.id}`);
    });
  }

  async handleSendMessage(socket, data) {
    try {
      const { conversationId, content, type = 'text', attachments = [] } = data;

      // Проверка доступа к разговору
      const conversation = await Conversation.findById(conversationId);
      if (!conversation.participants.includes(socket.userId)) {
        return socket.emit('error', { message: 'Access denied' });
      }

      // Создать сообщение
      const message = await Message.create({
        conversation_id: conversationId,
        sender_id: socket.userId,
        content,
        type,
        attachments,
      });

      // Обновить разговор
      await Conversation.update(conversationId, {
        last_message_id: message.id,
        last_message_at: message.created_at,
      });

      // Отправить всем участникам
      this.io.to(`conversation:${conversationId}`).emit('new_message', {
        conversation_id: conversationId,
        message,
      });

      // Отправить push уведомление офлайн пользователям
      this.notifyOfflineUsers(conversation, message, socket.userId);
      
    } catch (error) {
      socket.emit('error', { message: error.message });
    }
  }

  handleTyping(socket, data) {
    const { conversationId, isTyping } = data;
    
    socket.to(`conversation:${conversationId}`).emit('user_typing', {
      conversation_id: conversationId,
      user_id: socket.userId,
      is_typing: isTyping,
    });
  }

  async handleReadMessages(socket, data) {
    const { conversationId, messageIds } = data;
    
    await Message.markAsRead(messageIds, socket.userId);
    
    socket.to(`conversation:${conversationId}`).emit('messages_read', {
      conversation_id: conversationId,
      user_id: socket.userId,
      message_ids: messageIds,
    });
  }

  handleDisconnect(socket) {
    console.log(`User disconnected: ${socket.userId}`);
    this.connectedUsers.delete(socket.userId);
    this.broadcastOnlineStatus(socket.userId, false);
  }

  broadcastOnlineStatus(userId, isOnline) {
    this.io.emit('user_status', {
      user_id: userId,
      is_online: isOnline,
      last_seen: new Date(),
    });
  }

  async notifyOfflineUsers(conversation, message, senderId) {
    const offlineUsers = conversation.participants.filter(
      (userId) => userId !== senderId && !this.connectedUsers.has(userId)
    );

    // Отправить через notification service
    for (const userId of offlineUsers) {
      await notificationService.send(userId, {
        type: 'new_message',
        title: 'Новое сообщение',
        body: message.content.substring(0, 100),
        data: { conversationId: conversation.id },
      });
    }
  }
}

module.exports = WebSocketServer;
```

### 2. Models

**backend/src/models/Conversation.js**
```javascript
const db = require('../database/connection');

class Conversation {
  static async create(data) {
    const [conversation] = await db('conversations')
      .insert({
        participants: data.participants,
        type: data.type || 'direct',
        name: data.name,
      })
      .returning('*');
    
    return conversation;
  }

  static async findById(id) {
    return await db('conversations').where({ id }).first();
  }

  static async findByUserId(userId) {
    return await db('conversations')
      .whereRaw('? = ANY(participants)', [userId])
      .orderBy('last_message_at', 'desc');
  }

  static async findOrCreateDirect(user1Id, user2Id) {
    // Найти существующий прямой разговор
    const existing = await db('conversations')
      .where('type', 'direct')
      .whereRaw('participants @> ARRAY[?, ?]::int[]', [user1Id, user2Id])
      .first();

    if (existing) return existing;

    // Создать новый
    return await this.create({
      participants: [user1Id, user2Id],
      type: 'direct',
    });
  }

  static async update(id, data) {
    const [conversation] = await db('conversations')
      .where({ id })
      .update({
        ...data,
        updated_at: db.fn.now(),
      })
      .returning('*');
    
    return conversation;
  }

  static async getWithLastMessage(userId) {
    return await db('conversations as c')
      .select(
        'c.*',
        'm.content as last_message_content',
        'm.created_at as last_message_time',
        db.raw(`(
          SELECT COUNT(*) 
          FROM messages 
          WHERE conversation_id = c.id 
            AND sender_id != ? 
            AND read_at IS NULL
        ) as unread_count`, [userId])
      )
      .leftJoin('messages as m', 'c.last_message_id', 'm.id')
      .whereRaw('? = ANY(c.participants)', [userId])
      .orderBy('c.last_message_at', 'desc');
  }
}

module.exports = Conversation;
```

**backend/src/models/Message.js**
```javascript
const db = require('../database/connection');

class Message {
  static async create(data) {
    const [message] = await db('messages')
      .insert(data)
      .returning('*');
    
    return message;
  }

  static async findByConversationId(conversationId, options = {}) {
    const { limit = 50, offset = 0 } = options;
    
    return await db('messages')
      .where({ conversation_id: conversationId })
      .orderBy('created_at', 'desc')
      .limit(limit)
      .offset(offset);
  }

  static async markAsRead(messageIds, userId) {
    return await db('messages')
      .whereIn('id', messageIds)
      .where('sender_id', '!=', userId)
      .update({ read_at: db.fn.now() });
  }

  static async getUnreadCount(userId) {
    const result = await db('messages as m')
      .join('conversations as c', 'm.conversation_id', 'c.id')
      .where('m.sender_id', '!=', userId)
      .whereNull('m.read_at')
      .whereRaw('? = ANY(c.participants)', [userId])
      .count('* as count')
      .first();
    
    return parseInt(result.count);
  }
}

module.exports = Message;
```

### 3. REST API Controllers

**backend/src/controllers/messengerController.js**
```javascript
const Conversation = require('../models/Conversation');
const Message = require('../models/Message');

class MessengerController {
  async getConversations(req, res, next) {
    try {
      const conversations = await Conversation.getWithLastMessage(req.user.id);
      
      res.json({
        success: true,
        data: { conversations },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMessages(req, res, next) {
    try {
      const { conversationId } = req.params;
      const { limit = 50, offset = 0 } = req.query;

      // Проверка доступа
      const conversation = await Conversation.findById(conversationId);
      if (!conversation.participants.includes(req.user.id)) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const messages = await Message.findByConversationId(conversationId, {
        limit: parseInt(limit),
        offset: parseInt(offset),
      });

      res.json({
        success: true,
        data: { messages },
      });
    } catch (error) {
      next(error);
    }
  }

  async createConversation(req, res, next) {
    try {
      const { participantId, message } = req.body;

      // Найти или создать разговор
      const conversation = await Conversation.findOrCreateDirect(
        req.user.id,
        participantId
      );

      // Создать первое сообщение если есть
      if (message) {
        await Message.create({
          conversation_id: conversation.id,
          sender_id: req.user.id,
          content: message,
          type: 'text',
        });
      }

      res.json({
        success: true,
        data: { conversation },
      });
    } catch (error) {
      next(error);
    }
  }

  async getUnreadCount(req, res, next) {
    try {
      const count = await Message.getUnreadCount(req.user.id);
      
      res.json({
        success: true,
        data: { unread_count: count },
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new MessengerController();
```

### 4. Routes

**backend/src/routes/messenger.js**
```javascript
const express = require('express');
const router = express.Router();
const messengerController = require('../controllers/messengerController');
const { authenticate } = require('../middleware/auth');

router.get('/conversations', authenticate, messengerController.getConversations);
router.post('/conversations', authenticate, messengerController.createConversation);
router.get('/conversations/:conversationId/messages', authenticate, messengerController.getMessages);
router.get('/unread-count', authenticate, messengerController.getUnreadCount);

module.exports = router;
```

### 5. Database Migrations

**backend/src/database/migrations/20250101000010_create_messenger_tables.js**
```javascript
exports.up = function(knex) {
  return Promise.all([
    // Conversations
    knex.schema.createTable('conversations', (table) => {
      table.increments('id').primary();
      table.specificType('participants', 'integer[]').notNullable();
      table.enum('type', ['direct', 'group']).defaultTo('direct');
      table.string('name');
      table.integer('last_message_id');
      table.timestamp('last_message_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.index('participants', null, 'gin');
    }),
    
    // Messages
    knex.schema.createTable('messages', (table) => {
      table.increments('id').primary();
      table.integer('conversation_id').unsigned().notNullable();
      table.integer('sender_id').unsigned().notNullable();
      table.text('content');
      table.enum('type', ['text', 'file', 'image']).defaultTo('text');
      table.jsonb('attachments');
      table.timestamp('read_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      
      table.foreign('conversation_id').references('id').inTable('conversations').onDelete('CASCADE');
      table.foreign('sender_id').references('id').inTable('users').onDelete('CASCADE');
      
      table.index('conversation_id');
      table.index(['conversation_id', 'created_at']);
    }),
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('messages'),
    knex.schema.dropTableIfExists('conversations'),
  ]);
};
```

## Критерии приёмки
- [ ] WebSocket server настроен
- [ ] Модели Conversation и Message созданы
- [ ] REST API endpoints работают
- [ ] Реал-тайм отправка сообщений
- [ ] Typing indicator
- [ ] Online status
- [ ] Read receipts
- [ ] Unread count
- [ ] История сообщений пагинируется

## Приоритет
Критический (P0)

## Оценка времени
5-6 дней

## Зависимости
- Задача 01-websocket-server
- Задача 03-knex-migrations

## Примечания
WebSocket обеспечивает реал-тайм коммуникацию без polling, что критично для мессенджера.

