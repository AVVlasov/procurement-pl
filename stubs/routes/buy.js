const express = require('express')
const fs = require('fs')
const path = require('path')
const router = express.Router()

// Create remote-assets/docs directory if it doesn't exist
const docsDir = path.join(__dirname, '../../remote-assets/docs')
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true })
}

// In-memory store for documents metadata
const buyDocs = []

function generateId() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

// GET /buy/docs?ownerCompanyId=...
router.get('/docs', (req, res) => {
  const { ownerCompanyId } = req.query
  console.log('[BUY API] GET /docs', { ownerCompanyId, totalDocs: buyDocs.length })
  let result = buyDocs
  if (ownerCompanyId) {
    result = result.filter((d) => d.ownerCompanyId === ownerCompanyId)
  }
  result = result.map(doc => ({
    ...doc,
    url: `/api/buy/docs/${doc.id}/file`
  }))
  res.json(result)
})

// POST /buy/docs
router.post('/docs', (req, res) => {
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
  try {
    const binaryData = Buffer.from(fileData, 'base64')
    const filePath = path.join(docsDir, `${id}.${type}`)
    fs.writeFileSync(filePath, binaryData)
    console.log(`[BUY API] File saved to ${filePath}, size: ${binaryData.length} bytes`)
    
    const size = binaryData.length
    const url = `/api/buy/docs/${id}/file`
    const doc = {
      id,
      ownerCompanyId,
      name,
      type,
      size,
      url,
      filePath,
      acceptedBy: [],
      createdAt: new Date().toISOString(),
    }
    buyDocs.unshift(doc)
    console.log('[BUY API] Document created:', id)
    res.status(201).json(doc)
  } catch (e) {
    console.error(`[BUY API] Error saving file: ${e.message}`)
    res.status(500).json({ error: 'Failed to save file' })
  }
})

router.post('/docs/:id/accept', (req, res) => {
  const { id } = req.params
  const { companyId } = req.body || {}
  console.log('[BUY API] POST /docs/:id/accept', { id, companyId })
  const doc = buyDocs.find((d) => d.id === id)
  if (!doc) {
    console.log('[BUY API] Document not found:', id)
    return res.status(404).json({ error: 'Document not found' })
  }
  if (!companyId) {
    return res.status(400).json({ error: 'companyId is required' })
  }
  if (!doc.acceptedBy.includes(companyId)) {
    doc.acceptedBy.push(companyId)
  }
  res.json({ id: doc.id, acceptedBy: doc.acceptedBy })
})

router.get('/docs/:id/delete', (req, res) => {
  const { id } = req.params
  console.log('[BUY API] GET /docs/:id/delete', { id, totalDocs: buyDocs.length })
  const index = buyDocs.findIndex((d) => d.id === id)
  if (index === -1) {
    console.log('[BUY API] Document not found for deletion:', id)
    return res.status(404).json({ error: 'Document not found' })
  }
  const deletedDoc = buyDocs.splice(index, 1)[0]
  
  // Delete file from disk
  if (deletedDoc.filePath && fs.existsSync(deletedDoc.filePath)) {
    try {
      fs.unlinkSync(deletedDoc.filePath)
      console.log(`[BUY API] File deleted: ${deletedDoc.filePath}`)
    } catch (e) {
      console.error(`[BUY API] Error deleting file: ${e.message}`)
    }
  }
  
  console.log('[BUY API] Document deleted via GET:', id, { remainingDocs: buyDocs.length })
  res.json({ id: deletedDoc.id, success: true })
})

router.delete('/docs/:id', (req, res) => {
  const { id } = req.params
  console.log('[BUY API] DELETE /docs/:id', { id, totalDocs: buyDocs.length })
  const index = buyDocs.findIndex((d) => d.id === id)
  if (index === -1) {
    console.log('[BUY API] Document not found for deletion:', id)
    return res.status(404).json({ error: 'Document not found' })
  }
  const deletedDoc = buyDocs.splice(index, 1)[0]
  
  // Delete file from disk
  if (deletedDoc.filePath && fs.existsSync(deletedDoc.filePath)) {
    try {
      fs.unlinkSync(deletedDoc.filePath)
      console.log(`[BUY API] File deleted: ${deletedDoc.filePath}`)
    } catch (e) {
      console.error(`[BUY API] Error deleting file: ${e.message}`)
    }
  }
  
  console.log('[BUY API] Document deleted:', id, { remainingDocs: buyDocs.length })
  res.json({ id: deletedDoc.id, success: true })
})

// GET /buy/docs/:id/file - Serve the file
router.get('/docs/:id/file', (req, res) => {
  const { id } = req.params
  console.log('[BUY API] GET /docs/:id/file', { id })
  
  const doc = buyDocs.find(d => d.id === id)
  if (!doc) {
    console.log('[BUY API] Document not found:', id)
    return res.status(404).json({ error: 'Document not found' })
  }
  
  const filePath = path.join(docsDir, `${id}.${doc.type}`)
  if (!fs.existsSync(filePath)) {
    console.log('[BUY API] File not found on disk:', filePath)
    return res.status(404).json({ error: 'File not found on disk' })
  }
  
  try {
    const fileBuffer = fs.readFileSync(filePath)
    
    const mimeTypes = {
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'pdf': 'application/pdf'
    }
    
    const mimeType = mimeTypes[doc.type] || 'application/octet-stream'
    const sanitizedName = doc.name.replace(/[^\w\s\-\.]/g, '_')
    
    res.setHeader('Content-Type', mimeType)
    // RFC 5987 encoding: filename for ASCII fallback, filename* for UTF-8 with percent-encoding
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