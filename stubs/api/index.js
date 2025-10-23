const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const connectDB = require(path.join(__dirname, '..', 'config', 'db'));

// Загрузить переменные окружения
dotenv.config();

// Импортировать маршруты
const authRoutes = require(path.join(__dirname, '..', 'routes', 'auth'));
const companiesRoutes = require(path.join(__dirname, '..', 'routes', 'companies'));
const messagesRoutes = require(path.join(__dirname, '..', 'routes', 'messages'));
const searchRoutes = require(path.join(__dirname, '..', 'routes', 'search'));
const buyRoutes = require(path.join(__dirname, '..', 'routes', 'buy'));
const experienceRoutes = require(path.join(__dirname, '..', 'routes', 'experience'));
const productsRoutes = require(path.join(__dirname, '..', 'routes', 'products'));
const reviewsRoutes = require(path.join(__dirname, '..', 'routes', 'reviews'));
const buyProductsRoutes = require(path.join(__dirname, '..', 'routes', 'buyProducts'));
const homeRoutes = require(path.join(__dirname, '..', 'routes', 'home'));

const app = express();

// Подключить MongoDB при инициализации
let dbConnected = false;
connectDB().then(() => {
  dbConnected = true;
});

// Middleware
app.use(cors());
app.use(express.json({ charset: 'utf-8' }));
app.use(express.urlencoded({ extended: true, charset: 'utf-8' }));

// Set UTF-8 encoding for all responses
app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});

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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    api: 'running',
    database: dbConnected ? 'mongodb' : 'mock',
    timestamp: new Date().toISOString()
  });
});

// Маршруты
app.use('/auth', authRoutes);
app.use('/companies', companiesRoutes);
app.use('/messages', messagesRoutes);
app.use('/search', searchRoutes);
app.use('/buy', buyRoutes);
app.use('/buy-products', buyProductsRoutes);
app.use('/experience', experienceRoutes);
app.use('/products', productsRoutes);
app.use('/reviews', reviewsRoutes);
app.use('/home', homeRoutes);

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