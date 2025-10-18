/**
 * File Manager Utility
 * Handles saving and deleting files from the remote-assets folder
 */

const REMOTE_ASSETS_PATH = 'remote-assets'

export interface FileInfo {
  id: string
  name: string
  type: 'xlsx' | 'docx'
  size: number
  url: string
  uploadedAt: string
}

/**
 * Save a file to remote-assets folder
 * In production, this would upload to the server/storage
 * For now, it simulates saving by storing metadata
 */
export const saveFileToRemoteAssets = async (
  file: File,
  fileInfo: { id: string; name: string; type: 'xlsx' | 'docx' }
): Promise<FileInfo> => {
  try {
    // Create a blob URL for the file
    const blobUrl = URL.createObjectURL(file)
    
    // In a real application, you would send this to the server
    // For now, we'll store it in localStorage with metadata
    const fileData: FileInfo = {
      id: fileInfo.id,
      name: fileInfo.name,
      type: fileInfo.type,
      size: file.size,
      url: `/${REMOTE_ASSETS_PATH}/docs/${fileInfo.id}.${fileInfo.type}`,
      uploadedAt: new Date().toISOString(),
    }

    // Store file reference in localStorage
    const storageKey = `file_${fileInfo.id}`
    localStorage.setItem(storageKey, JSON.stringify(fileData))
    
    return fileData
  } catch (error) {
    console.error('Error saving file:', error)
    throw new Error('Failed to save file')
  }
}

/**
 * Delete a file from remote-assets folder
 */
export const deleteFileFromRemoteAssets = async (fileId: string): Promise<void> => {
  try {
    // Remove from localStorage
    const storageKey = `file_${fileId}`
    localStorage.removeItem(storageKey)

    // In a real application, you would send a DELETE request to the server
    // to remove the file from the storage
  } catch (error) {
    console.error('Error deleting file:', error)
    throw new Error('Failed to delete file')
  }
}

/**
 * Get file from remote-assets
 */
export const getFileFromRemoteAssets = (fileId: string): FileInfo | null => {
  try {
    const storageKey = `file_${fileId}`
    const data = localStorage.getItem(storageKey)
    return data ? JSON.parse(data) : null
  } catch (error) {
    console.error('Error retrieving file:', error)
    return null
  }
}

/**
 * List all files in remote-assets
 */
export const listFilesInRemoteAssets = (): FileInfo[] => {
  try {
    const files: FileInfo[] = []
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i)
      if (key?.startsWith('file_')) {
        const data = localStorage.getItem(key)
        if (data) {
          files.push(JSON.parse(data))
        }
      }
    }
    return files
  } catch (error) {
    console.error('Error listing files:', error)
    return []
  }
}

/**
 * Download a file
 */
export const downloadFile = (fileInfo: FileInfo, blob: Blob): void => {
  try {
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${fileInfo.name}.${fileInfo.type}`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  } catch (error) {
    console.error('Error downloading file:', error)
  }
}
