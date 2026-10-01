/**
 * EduNova Conversation & Chat Routes
 * Base path: /api/conversations
 */

const express = require('express');
const router = express.Router();
const conversationController = require('../controllers/conversationController');
const { requireAuth } = require('../middleware/auth');
const { uploadMediaAndFiles } = require('../middleware/uploadMiddleware');

// All conversation routes require authentication
router.use(requireAuth);

// POST /api/conversations/upload - Upload chat file/media attachment
router.post('/upload', uploadMediaAndFiles('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const isImage = (file.mimetype && file.mimetype.startsWith('image/')) ||
    ['.jpg', '.jpeg', '.png', '.webp', '.gif'].some((ext) => file.originalname.toLowerCase().endsWith(ext));
  const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
    ['.mp4', '.webm', '.ogg', '.mov'].some((ext) => file.originalname.toLowerCase().endsWith(ext));
  const isPdf = file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf');

  let fileType = 'document';
  if (isImage) fileType = 'image';
  else if (isVideo) fileType = 'video';
  else if (isPdf) fileType = 'pdf';

  const fileUrl = `/uploads/${file.filename}`;

  return res.status(201).json({
    success: true,
    message: 'Chat attachment uploaded successfully',
    data: {
      id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      name: file.originalname,
      type: fileType,
      mimeType: file.mimetype,
      size: file.size,
      rawSize: file.size,
      url: fileUrl,
      thumbnailUrl: isImage ? fileUrl : null,
      uploadedAt: new Date().toISOString(),
    },
  });
});

// GET /api/conversations - List user's active threads
router.get('/', conversationController.getUserConversations);

// POST /api/conversations/direct - Initialize direct conversation with peer
router.post('/direct', conversationController.getOrCreateDirectConversation);

// GET /api/conversations/:id - Thread details
router.get('/:id', conversationController.getConversationById);

// POST /api/conversations/:id/read - Mark conversation read
router.post('/:id/read', conversationController.markAsRead);

// GET /api/conversations/:id/messages - Paginated message history (cursor-based)
router.get('/:id/messages', conversationController.getConversationMessages);

// POST /api/conversations/:id/messages - Post message (REST fallback)
router.post('/:id/messages', conversationController.sendMessage);

// Message-level interactions
router.post('/messages/:messageId/react', conversationController.toggleReaction);
router.post('/messages/:messageId/pin', conversationController.togglePin);

module.exports = router;
