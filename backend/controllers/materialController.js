const prisma = require('../config/db');

/**
 * GET /api/materials
 * Get learning materials with subject, topic, and type filters
 */
const getMaterials = async (req, res, next) => {
  try {
    const { subjectId, topicId, type } = req.query;

    const where = {};
    if (subjectId) where.subjectId = subjectId;
    if (topicId) where.topicId = topicId;
    if (type && type !== 'All') where.type = type;

    const materials = await prisma.learningMaterial.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: { select: { id: true, name: true, role: true } },
      },
    });

    return res.json({
      success: true,
      data: materials,
      count: materials.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/materials/upload
 * Multipart file & video uploader for Instructors & Admins
 */
const uploadMaterialFile = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ success: false, message: 'No file or video was uploaded' });
    }

    const {
      title = file.originalname,
      description,
      subjectId,
      topicId,
      type,
      tags = [],
      targetType = 'GLOBAL',
      studentIds,
    } = req.body;

    const isVideo = (file.mimetype && file.mimetype.startsWith('video/')) ||
      ['.mp4', '.webm', '.ogg', '.mov', '.mkv', '.avi'].some(ext => file.originalname.toLowerCase().endsWith(ext));

    const finalType = type || (isVideo ? 'Video' : 'Document');
    const fileUrl = `/uploads/${file.filename}`;

    let parsedTags = typeof tags === 'string'
      ? (tags.startsWith('[') ? JSON.parse(tags) : tags.split(',').map(t => t.trim()).filter(Boolean))
      : Array.isArray(tags) ? tags : [];

    // Parse target student IDs
    let targetStudentIds = [];
    if (targetType === 'ALL_STUDENTS') {
      const allStudents = await prisma.user.findMany({
        where: { role: 'STUDENT', status: 'ACTIVE' },
        select: { id: true, name: true },
      });
      targetStudentIds = allStudents.map((s) => s.id);
      parsedTags.push('target:all_students');
    } else if (studentIds) {
      if (Array.isArray(studentIds)) {
        targetStudentIds = studentIds;
      } else if (typeof studentIds === 'string') {
        try {
          const parsed = JSON.parse(studentIds);
          targetStudentIds = Array.isArray(parsed) ? parsed : [studentIds];
        } catch (e) {
          targetStudentIds = studentIds.split(',').map((s) => s.trim()).filter(Boolean);
        }
      }
      targetStudentIds.forEach((sid) => parsedTags.push(`target:${sid}`));
    }

    const material = await prisma.learningMaterial.create({
      data: {
        title: (title || file.originalname).trim(),
        description: description?.trim() || null,
        subjectId: subjectId && subjectId !== '' ? subjectId : null,
        topicId: topicId && topicId !== '' ? topicId : null,
        type: finalType,
        fileUrl,
        uploadedById: userId,
        tags: Array.from(new Set(parsedTags)),
      },
      include: {
        uploader: { select: { id: true, name: true, role: true } },
      },
    });

    // Automatically notify targeted student(s) in PostgreSQL & WebSockets
    if (targetStudentIds.length > 0) {
      try {
        const notificationsData = targetStudentIds.map((sid) => ({
          userId: sid,
          title: `📁 New Document from ${req.user.name || 'Admin'}: ${material.title}`,
          message: description?.trim() || `Admin shared a new document with you: "${file.originalname}". Click to access.`,
          type: 'INFO',
          linkUrl: fileUrl,
        }));

        await prisma.notification.createMany({
          data: notificationsData,
        });

        // Real-time Socket.IO emission
        const { getIO } = require('../socket/socketServer');
        const io = getIO();
        targetStudentIds.forEach((sid) => {
          io.to(`user:${sid}`).emit('notification:new', {
            title: `📁 New Document from ${req.user.name || 'Admin'}`,
            message: `New file: "${material.title}"`,
            linkUrl: fileUrl,
            type: 'INFO',
            createdAt: new Date().toISOString(),
          });
        });
      } catch (notifErr) {
        console.warn('[uploadMaterialFile] Failed to dispatch notifications:', notifErr.message);
      }
    }

    return res.status(201).json({
      success: true,
      message: `${finalType} uploaded successfully${targetStudentIds.length > 0 ? ` and dispatched to ${targetStudentIds.length} student(s)` : ''}`,
      data: material,
      assignedCount: targetStudentIds.length,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/materials
 * Upload/create learning material (metadata or external URL)
 */
const createMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { title, description, subjectId, topicId, type = 'Document', fileUrl, tags = [] } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: 'Material title is required' });
    }

    const material = await prisma.learningMaterial.create({
      data: {
        title: title.trim(),
        description: description?.trim() || null,
        subjectId: subjectId || null,
        topicId: topicId || null,
        type,
        fileUrl: fileUrl || null,
        uploadedById: userId,
        tags: Array.isArray(tags) ? tags : [],
      },
    });

    return res.status(201).json({
      success: true,
      data: material,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/materials/:id
 */
const deleteMaterial = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const material = await prisma.learningMaterial.findUnique({ where: { id } });
    if (!material) return res.status(404).json({ success: false, message: 'Material not found' });
    if (material.uploadedById !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this material' });
    }

    await prisma.learningMaterial.delete({ where: { id } });
    return res.json({ success: true, message: 'Material deleted successfully' });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/materials/students
 * Return active students available for targeted file/video assignment
 */
const getTargetStudents = async (req, res, next) => {
  try {
    const students = await prisma.user.findMany({
      where: { role: 'STUDENT', status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        email: true,
        avatar: true,
        learnerType: true,
        learnerProfile: {
          select: {
            board: true,
            degree: true,
            level: true,
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    return res.json({
      success: true,
      data: students,
      count: students.length,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getMaterials,
  createMaterial,
  uploadMaterialFile,
  deleteMaterial,
  getTargetStudents,
};
