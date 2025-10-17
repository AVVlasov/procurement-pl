const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Загрузить переменные окружения
dotenv.config();

// Импортировать конфиг и маршруты
const connectDB = require('./config/db');
const authRoutes = require('./routes/auth');
const companiesRoutes = require('./routes/companies');
const messagesRoutes = require('./routes/messages');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// Задержка для имитации сети (опционально)
const delay = (ms = 300) => (req, res, next) => setTimeout(next, ms);
app.use(delay());

// Подключиться к MongoDB
let dbConnection = null;
connectDB().then(conn => {
  dbConnection = conn;
  console.log('Database connection available');
}).catch(err => {
  console.error('Database connection error:', err);
});

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    database: dbConnection ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Маршруты
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/messages', messagesRoutes);

// Обработка ошибок
app.use((err, req, res, next) => {
  console.error('API Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Not found'
  });
});

// Экспортировать для использования в brojs
module.exports = app;