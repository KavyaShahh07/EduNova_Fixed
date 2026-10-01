const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Safe allowed educational MIME types
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'application/pdf',
  'text/plain',
  'text/markdown',
  'application/json',
]);

// Maximum file size: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024;

// Dangerous file extensions blocklist
const DANGEROUS_EXTENSIONS = new Set([
  '.exe', '.bat', '.cmd', '.sh', '.bin', '.dll', '.com', '.vbs', '.js',
  '.ts', '.html', '.htm', '.php', '.phtml', '.jar', '.scr', '.ps1', '.py',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();

  // Strict extension check
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    const error = new Error(`Executable and script files (${ext}) are strictly prohibited.`);
    error.code = 'INVALID_FILE_TYPE';
    error.status = 400;
    return cb(error, false);
  }

  // Strict MIME type check
  if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
    const error = new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, PDF, TXT, MD.`);
    error.code = 'INVALID_FILE_TYPE';
    error.status = 400;
    return cb(error, false);
  }

  cb(null, true);
};

// Memory storage for secure analysis (avoids saving unvetted temp files to disk)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: 1,
  },
  fileFilter,
});

/**
 * Express wrapper for single file upload with standard error handling
 */
const validateFileUpload = (fieldName = 'file') => (req, res, next) => {
  const uploadSingle = upload.single(fieldName);

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: `File exceeds maximum allowed limit of ${MAX_FILE_SIZE / (1024 * 1024)}MB.`,
          });
        }
        return res.status(400).json({
          success: false,
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      }

      return res.status(err.status || 400).json({
        success: false,
        code: err.code || 'INVALID_FILE',
        message: err.message || 'File validation failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE_PROVIDED',
        message: `Please attach a valid file in '${fieldName}' field.`,
      });
    }

    next();
  });
};

// ============================================================================
// Disk Storage for Persistent Learning Materials & Course Videos (Up to 100MB)
// ============================================================================
const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const diskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase();
    const baseName = path.basename(file.originalname || 'file', ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${baseName}-${uniqueSuffix}${ext}`);
  },
});

const ALLOWED_MEDIA_EXTENSIONS = new Set([
  // Videos
  '.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi',
  // Documents
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt', '.md', '.json',
  // Images
  '.jpg', '.jpeg', '.png', '.webp', '.gif',
]);

const mediaFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname || '').toLowerCase();
  if (DANGEROUS_EXTENSIONS.has(ext)) {
    const error = new Error(`Executable files (${ext}) are prohibited.`);
    error.code = 'INVALID_FILE_TYPE';
    error.status = 400;
    return cb(error, false);
  }

  if (!ALLOWED_MEDIA_EXTENSIONS.has(ext)) {
    const error = new Error(`File extension ${ext} is not supported. Supported: MP4, WebM, PDF, DOCX, PPTX, Images.`);
    error.code = 'INVALID_FILE_TYPE';
    error.status = 400;
    return cb(error, false);
  }

  cb(null, true);
};

const MAX_MEDIA_SIZE = 100 * 1024 * 1024; // 100MB

const uploadDisk = multer({
  storage: diskStorage,
  limits: {
    fileSize: MAX_MEDIA_SIZE,
    files: 1,
  },
  fileFilter: mediaFilter,
});

const uploadMediaAndFiles = (fieldName = 'file') => (req, res, next) => {
  const uploadSingle = uploadDisk.single(fieldName);

  uploadSingle(req, res, (err) => {
    if (err) {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(413).json({
            success: false,
            code: 'FILE_TOO_LARGE',
            message: `File exceeds maximum allowed limit of ${MAX_MEDIA_SIZE / (1024 * 1024)}MB.`,
          });
        }
        return res.status(400).json({
          success: false,
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      }

      return res.status(err.status || 400).json({
        success: false,
        code: err.code || 'INVALID_FILE',
        message: err.message || 'File validation failed',
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE_PROVIDED',
        message: `Please attach a valid video or document file in '${fieldName}' field.`,
      });
    }

    next();
  });
};

module.exports = {
  validateFileUpload,
  uploadMediaAndFiles,
  ALLOWED_MIME_TYPES: Array.from(ALLOWED_MIME_TYPES),
  MAX_FILE_SIZE,
  MAX_MEDIA_SIZE,
};
