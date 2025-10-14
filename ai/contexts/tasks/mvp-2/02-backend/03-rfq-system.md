# Задача: Система заявок на закупку (RFQ) (MVP 2)

## Описание
Реализация системы Request for Quotation (RFQ) - заявок на закупку с приглашением поставщиков и сравнением предложений.

## Цель
Автоматизировать процесс закупок и сделать его прозрачным.

## Технические требования

### 1. Database Schema

**backend/src/database/migrations/20250101000011_create_rfq_tables.js**
```javascript
exports.up = function(knex) {
  return Promise.all([
    // RFQ (заявки)
    knex.schema.createTable('rfqs', (table) => {
      table.increments('id').primary();
      table.integer('company_id').unsigned().notNullable();
      table.string('title', 500).notNullable();
      table.text('description');
      table.enum('status', ['draft', 'published', 'in_review', 'completed', 'cancelled']).defaultTo('draft');
      table.date('deadline');
      table.jsonb('requirements');
      table.timestamp('published_at');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
      table.index(['company_id', 'status']);
    }),
    
    // RFQ Proposals (предложения)
    knex.schema.createTable('rfq_proposals', (table) => {
      table.increments('id').primary();
      table.integer('rfq_id').unsigned().notNullable();
      table.integer('company_id').unsigned().notNullable();
      table.decimal('price', 15, 2).notNullable();
      table.string('currency', 3).defaultTo('RUB');
      table.integer('delivery_days');
      table.text('description');
      table.jsonb('details');
      table.enum('status', ['pending', 'accepted', 'rejected']).defaultTo('pending');
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.timestamp('updated_at').defaultTo(knex.fn.now());
      
      table.foreign('rfq_id').references('id').inTable('rfqs').onDelete('CASCADE');
      table.foreign('company_id').references('id').inTable('companies').onDelete('CASCADE');
      table.unique(['rfq_id', 'company_id']);
      table.index('rfq_id');
    }),
  ]);
};

exports.down = function(knex) {
  return Promise.all([
    knex.schema.dropTableIfExists('rfq_proposals'),
    knex.schema.dropTableIfExists('rfqs'),
  ]);
};
```

### 2. Models

**backend/src/models/Rfq.js**
```javascript
const db = require('../database/connection');

class Rfq {
  static async create(data) {
    const [rfq] = await db('rfqs').insert(data).returning('*');
    return rfq;
  }

  static async findById(id) {
    return await db('rfqs').where({ id }).first();
  }

  static async findByCompanyId(companyId, status = null) {
    const query = db('rfqs').where({ company_id: companyId });
    if (status) {
      query.where({ status });
    }
    return await query.orderBy('created_at', 'desc');
  }

  static async findPublished(filters = {}) {
    const query = db('rfqs')
      .select('rfqs.*', 'c.full_name as company_name', 'c.industry')
      .join('companies as c', 'rfqs.company_id', 'c.id')
      .where('rfqs.status', 'published')
      .where('rfqs.deadline', '>=', db.fn.now());

    if (filters.industry) {
      query.where('c.industry', filters.industry);
    }

    return await query.orderBy('rfqs.published_at', 'desc');
  }

  static async update(id, data) {
    const [rfq] = await db('rfqs')
      .where({ id })
      .update({ ...data, updated_at: db.fn.now() })
      .returning('*');
    return rfq;
  }

  static async publish(id) {
    return await this.update(id, {
      status: 'published',
      published_at: db.fn.now(),
    });
  }
}

module.exports = Rfq;
```

**backend/src/models/RfqProposal.js**
```javascript
const db = require('../database/connection');

class RfqProposal {
  static async create(data) {
    const [proposal] = await db('rfq_proposals').insert(data).returning('*');
    return proposal;
  }

  static async findByRfqId(rfqId) {
    return await db('rfq_proposals as rp')
      .select('rp.*', 'c.full_name as company_name', 'c.industry')
      .join('companies as c', 'rp.company_id', 'c.id')
      .where('rp.rfq_id', rfqId)
      .orderBy('rp.price', 'asc');
  }

  static async findByCompanyId(companyId) {
    return await db('rfq_proposals as rp')
      .select('rp.*', 'r.title as rfq_title', 'r.deadline')
      .join('rfqs as r', 'rp.rfq_id', 'r.id')
      .where('rp.company_id', companyId)
      .orderBy('rp.created_at', 'desc');
  }

  static async accept(id) {
    const [proposal] = await db('rfq_proposals')
      .where({ id })
      .update({ status: 'accepted' })
      .returning('*');

    // Отклонить остальные предложения
    await db('rfq_proposals')
      .where('rfq_id', proposal.rfq_id)
      .where('id', '!=', id)
      .update({ status: 'rejected' });

    return proposal;
  }
}

module.exports = RfqProposal;
```

### 3. Controllers

**backend/src/controllers/rfqController.js**
```javascript
const Rfq = require('../models/Rfq');
const RfqProposal = require('../models/RfqProposal');
const { AppError } = require('../utils/errors');

class RfqController {
  async createRfq(req, res, next) {
    try {
      const rfq = await Rfq.create({
        company_id: req.user.companyId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        data: { rfq },
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyRfqs(req, res, next) {
    try {
      const rfqs = await Rfq.findByCompanyId(req.user.companyId);

      res.json({
        success: true,
        data: { rfqs },
      });
    } catch (error) {
      next(error);
    }
  }

  async getPublishedRfqs(req, res, next) {
    try {
      const { industry } = req.query;
      const rfqs = await Rfq.findPublished({ industry });

      res.json({
        success: true,
        data: { rfqs },
      });
    } catch (error) {
      next(error);
    }
  }

  async getRfqWithProposals(req, res, next) {
    try {
      const { id } = req.params;
      const rfq = await Rfq.findById(id);

      if (!rfq) {
        throw new AppError('RFQ not found', 404);
      }

      const proposals = await RfqProposal.findByRfqId(id);

      // Скрыть детали предложений конкурентов
      const sanitizedProposals = proposals.map((p) => {
        if (p.company_id !== req.user.companyId && rfq.company_id !== req.user.companyId) {
          return { id: p.id, status: p.status };
        }
        return p;
      });

      res.json({
        success: true,
        data: { rfq, proposals: sanitizedProposals },
      });
    } catch (error) {
      next(error);
    }
  }

  async publishRfq(req, res, next) {
    try {
      const { id } = req.params;
      const rfq = await Rfq.findById(id);

      if (!rfq || rfq.company_id !== req.user.companyId) {
        throw new AppError('Access denied', 403);
      }

      const published = await Rfq.publish(id);

      // Уведомить потенциальных поставщиков
      await this.notifyPotentialSuppliers(published);

      res.json({
        success: true,
        data: { rfq: published },
      });
    } catch (error) {
      next(error);
    }
  }

  async createProposal(req, res, next) {
    try {
      const { rfqId } = req.params;
      const rfq = await Rfq.findById(rfqId);

      if (!rfq || rfq.status !== 'published') {
        throw new AppError('RFQ not available', 400);
      }

      const proposal = await RfqProposal.create({
        rfq_id: rfqId,
        company_id: req.user.companyId,
        ...req.body,
      });

      // Уведомить создателя RFQ
      await notificationService.send(rfq.company_id, {
        type: 'new_proposal',
        title: 'Новое предложение',
        body: `Получено предложение на заявку "${rfq.title}"`,
      });

      res.status(201).json({
        success: true,
        data: { proposal },
      });
    } catch (error) {
      next(error);
    }
  }

  async acceptProposal(req, res, next) {
    try {
      const { proposalId } = req.params;
      const proposal = await RfqProposal.accept(proposalId);

      res.json({
        success: true,
        data: { proposal },
      });
    } catch (error) {
      next(error);
    }
  }

  async notifyPotentialSuppliers(rfq) {
    // AI подбор релевантных поставщиков
    const suppliers = await aiService.findRelevantSuppliers(rfq);
    
    for (const supplier of suppliers) {
      await notificationService.send(supplier.id, {
        type: 'new_rfq',
        title: 'Новая заявка на закупку',
        body: rfq.title,
        data: { rfqId: rfq.id },
      });
    }
  }
}

module.exports = new RfqController();
```

### 4. Routes

**backend/src/routes/rfqs.js**
```javascript
const express = require('express');
const router = express.Router();
const rfqController = require('../controllers/rfqController');
const { authenticate } = require('../middleware/auth');

// RFQs
router.post('/', authenticate, rfqController.createRfq);
router.get('/my', authenticate, rfqController.getMyRfqs);
router.get('/published', authenticate, rfqController.getPublishedRfqs);
router.get('/:id', authenticate, rfqController.getRfqWithProposals);
router.post('/:id/publish', authenticate, rfqController.publishRfq);

// Proposals
router.post('/:rfqId/proposals', authenticate, rfqController.createProposal);
router.post('/proposals/:proposalId/accept', authenticate, rfqController.acceptProposal);

module.exports = router;
```

## Критерии приёмки
- [ ] Создание RFQ работает
- [ ] Публикация RFQ
- [ ] Список опубликованных RFQ
- [ ] Создание предложений
- [ ] Просмотр предложений
- [ ] Принятие предложения
- [ ] Уведомления отправляются
- [ ] Deadline проверяется

## Приоритет
Высокий (P1)

## Оценка времени
5 дней

