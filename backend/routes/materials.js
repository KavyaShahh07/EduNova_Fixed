const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { uploadMediaAndFiles } = require('../middleware/uploadMiddleware');
const {
  getMaterials,
  createMaterial,
  uploadMaterialFile,
  deleteMaterial,
  getTargetStudents,
} = require('../controllers/materialController');

// GET /api/materials/students - Active students directory for targeted file distribution
router.get('/students', requireAuth, getTargetStudents);

// GET /api/materials - Get materials with filters
router.get('/', getMaterials);

// POST /api/materials/upload - Multipart video & document upload (Instructors & Admins)
router.post('/upload', requireAuth, uploadMediaAndFiles('file'), uploadMaterialFile);

// POST /api/materials - Metadata or external URL material creation
router.post('/', requireAuth, createMaterial);

// DELETE /api/materials/:id - Delete material
router.delete('/:id', requireAuth, deleteMaterial);

module.exports = router;
