import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure uploads directories exist
const uploadsDir = path.join(__dirname, '../../uploads')
const userUploadsDir = path.join(uploadsDir, 'users')
const cardUploadsDir = path.join(uploadsDir, 'cards')
const ticketUploadsDir = path.join(uploadsDir, 'tickets')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(userUploadsDir)) {
  fs.mkdirSync(userUploadsDir, { recursive: true })
}
if (!fs.existsSync(cardUploadsDir)) {
  fs.mkdirSync(cardUploadsDir, { recursive: true })
}
if (!fs.existsSync(ticketUploadsDir)) {
  fs.mkdirSync(ticketUploadsDir, { recursive: true })
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const url = req.baseUrl + req.path
    if (url.includes('/users')) {
      cb(null, userUploadsDir)
    } else if (url.includes('/tickets') || url.includes('/support')) {
      cb(null, ticketUploadsDir)
    } else {
      cb(null, cardUploadsDir)
    }
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random-ext
    const ext = path.extname(file.originalname)
    const baseName = path.basename(file.originalname, ext)
    const sanitizedName = baseName.replace(/[^a-zA-Z0-9]/g, '-')
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${ext}`
    cb(null, uniqueName)
  }
})

// File filter - only allow images
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/
  const ext = path.extname(file.originalname).toLowerCase()
  const mimetype = file.mimetype

  if (allowedTypes.test(ext) && mimetype.startsWith('image/')) {
    cb(null, true)
  } else {
    cb(new Error('Only image files are allowed (jpeg, jpg, png, gif, webp)'), false)
  }
}

// Create multer instance with 10MB limit
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: fileFilter
})

// Helper function to get the full path of an uploaded file
export function getUploadPath(filename) {
  return path.join(uploadsDir, filename)
}

// Helper function to get the relative URL path for storage in database
export function getRelativePath(filename) {
  return `/uploads/${filename}`
}