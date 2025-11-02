const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()
const BuyDocument = require('../models/BuyDocument')

// Create remote-assets/docs directory if it doesn't exist
const docsDir = path.join(__dirname, '../../remote-assets/docs')
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// GET /buy/docs?ownerCompanyId=...
router.get('/docs', async (req, res) => {
  try {
    const { ownerCompanyId } = req.query
    console.log('[BUY API] GET /docs', { ownerCompanyId })
    
    let query = {}
    if (ownerCompanyId) {
      query.ownerCompanyId = ownerCompanyId
    }
    
    const docs = await BuyDocument.find(query).sort({ createdAt: -1 })
    
    const result = docs.map(doc => ({
      ...doc.toObject(),
      url: `/api/buy/docs/${doc.id}/file`
    }))
    
    res.json(result)
  } catch (error) {
    console.error('[BUY API] Error fetching docs:', error)
    res.status(500).json({ error: 'Failed to fetch documents' })
  }
})

// POST /buy/docs
router.post('/docs', async (req, res) => {
  try {
    const { ownerCompanyId, name, type, fileData } = req.body || {}
    console.log('[BUY API] POST /docs', { ownerCompanyId, name, type })
    
    if (!ownerCompanyId || !name || !type) {
      return res.status(400).json({ error: 'ownerCompanyId, name and type are required' })
    }
    
    if (!fileData) {
      return res.status(400).json({ error: 'fileData is required' })
    }
    
    const id = generateId()
    
    // Save file to disk
    const binaryData = Buffer.from(fileData, 'base64')
    const filePath = path.join(docsDir, `${id}.${type}`)
    fs.writeFileSync(filePath, binaryData)
    console.log(`[BUY API] File saved to ${filePath}, size: ${binaryData.length} bytes`)
    
    const size = binaryData.length
    
    const doc = await BuyDocument.create({
      id,
      ownerCompanyId,
      name,
      type,
      size,
      filePath,
      acceptedBy: []
    })
    
    console.log('[BUY API] Document created:', id)
    
    res.status(201).json({
      ...doc.toObject(),
      url: `/api/buy/docs/${doc.id}/file`
    })
  } catch (e) {
    console.error(`[BUY API] Error saving file: ${e.message}`)
    res.status(500).json({ error: 'Failed to save file' })
  }
})

router.post('/docs/:id/accept', async (req, res) => {
  try {
    const { id } = req.params
    const { companyId } = req.body || {}
    console.log('[BUY API] POST /docs/:id/accept', { id, companyId })
    
    if (!companyId) {
      return res.status(400).json({ error: 'companyId is required' })
    }
    
    const doc = await BuyDocument.findOne({ id })
    if (!doc) {
      console.log('[BUY API] Document not found:', id)
      return res.status(404).json({ error: 'Document not found' })
    }
    
    if (!doc.acceptedBy.includes(companyId)) {
      doc.acceptedBy.push(companyId)
      await doc.save()
    }
    
    res.json({ id: doc.id, acceptedBy: doc.acceptedBy })
  } catch (error) {
    console.error('[BUY API] Error accepting document:', error)
    res.status(500).json({ error: 'Failed to accept document' })
  }
})

router.get('/docs/:id/delete', async (req, res) => {
  try {
    const { id } = req.params
    console.log('[BUY API] GET /docs/:id/delete', { id })
    
    const doc = await BuyDocument.findOne({ id })
    if (!doc) {
      console.log('[BUY API] Document not found for deletion:', id)
      return res.status(404).json({ error: 'Document not found' })
    }
    
    // Delete file from disk
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath)
        console.log(`[BUY API] File deleted: ${doc.filePath}`)
      } catch (e) {
        console.error(`[BUY API] Error deleting file: ${e.message}`)
      }
    }
    
    await BuyDocument.deleteOne({ id })
    
    console.log('[BUY API] Document deleted via GET:', id)
    res.json({ id: doc.id, success: true })
  } catch (error) {
    console.error('[BUY API] Error deleting document:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

router.delete('/docs/:id', async (req, res) => {
  try {
    const { id } = req.params
    console.log('[BUY API] DELETE /docs/:id', { id })
    
    const doc = await BuyDocument.findOne({ id })
    if (!doc) {
      console.log('[BUY API] Document not found for deletion:', id)
      return res.status(404).json({ error: 'Document not found' })
    }
    
    // Delete file from disk
    if (doc.filePath && fs.existsSync(doc.filePath)) {
      try {
        fs.unlinkSync(doc.filePath)
        console.log(`[BUY API] File deleted: ${doc.filePath}`)
      } catch (e) {
        console.error(`[BUY API] Error deleting file: ${e.message}`)
      }
    }
    
    await BuyDocument.deleteOne({ id })
    
    console.log('[BUY API] Document deleted:', id)
    res.json({ id: doc.id, success: true })
  } catch (error) {
    console.error('[BUY API] Error deleting document:', error)
    res.status(500).json({ error: 'Failed to delete document' })
  }
})

// GET /buy/docs/:id/file - Serve the file
router.get('/docs/:id/file', async (req, res) => {
  try {
    const { id } = req.params
    console.log('[BUY API] GET /docs/:id/file', { id })
    
    const doc = await BuyDocument.findOne({ id })
    if (!doc) {
      console.log('[BUY API] Document not found:', id)
      return res.status(404).json({ error: 'Document not found' })
    }
    
    const filePath = path.join(docsDir, `${id}.${doc.type}`)
    if (!fs.existsSync(filePath)) {
      console.log('[BUY API] File not found on disk:', filePath)
      return res.status(404).json({ error: 'File not found on disk' })
    }
    
    const fileBuffer = fs.readFileSync(filePath)
    
    const mimeTypes = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf'
    }
    
    const mimeType = mimeTypes[doc.type] || 'application/octet-stream'
    const sanitizedName = doc.name.replace(/[^\w\s\-\.]/g, '_')
    
    res.setHeader('Content-Type', mimeType)
    const encodedFilename = encodeURIComponent(`${doc.name}.${doc.type}`)
    res.setHeader('Content-Disposition', `attachment; filename="${sanitizedName}.${doc.type}"; filename*=UTF-8''${encodedFilename}`)
    res.setHeader('Content-Length', fileBuffer.length)
    
    console.log(`[BUY API] Serving file ${id} from ${filePath} (${fileBuffer.length} bytes)`)
    res.send(fileBuffer)
  } catch (e) {
    console.error(`[BUY API] Error serving file: ${e.message}`)
    res.status(500).json({ error: 'Error serving file' })
  }
})

module.exports = router