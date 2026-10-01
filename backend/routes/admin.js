const express = require('express');
const router = express.Router();
const { z } = require('zod');
const { requireAuth, requireRole } = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const {
  getPlatformMetrics,
  getMetrics,
  getUsers,
  getUserDetail,
  updateUserRole,
  updateUserStatus,
  updateUserDetails,
  unlockUserAccount,
  revokeUserSessions,
  deleteUser,
  getLoginAttempts,
  getLoginStats,
  getUserChangeLogs,
  createOrPublishCourse,
  createCourse,
  getCourses,
  updateCourse,
  deleteCourse,
  addCourseModule,
  deleteCourseModule,
  getSubjects,
  createSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  deleteTopic,
  getAdminQuizzes,
  createQuiz,
  addQuizQuestion,
  deleteQuiz,
  deleteQuizQuestion,
  getAdminMissions,
  createMission,
  updateMission,
  deleteMission,
  deleteContent,
  getAuditLogs,
  getSystemHealth,
  getPlatformAnalytics,
  getSageAiControlStatus,
  getExpandedSecurityEvents,
  getModerationReports,
  handleModerationAction,
  getNotificationAnalytics,
  createSystemAnnouncement,
  getFeatureFlags,
  toggleFeatureFlag,
  getDataBackupStatus
} = require('../controllers/adminController');

// ── Zod Schemas ──────────────────────────────────────────────────────────────

const updateRoleSchema = {
  body: z.object({
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT']),
  }),
};

const updateStatusSchema = {
  body: z.object({
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']),
    reason: z.string().optional(),
  }),
};

const updateUserDetailsSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    email: z.string().email().optional(),
    phone: z.string().optional().nullable(),
    role: z.enum(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT']).optional(),
    learnerType: z.enum(['SCHOOL', 'COLLEGE', 'SKILLS', 'EXAM']).optional(),
    status: z.enum(['ACTIVE', 'SUSPENDED', 'BANNED']).optional(),
    studentUsername: z.string().optional().nullable(),
  }),
};

const adminCourseSchema = {
  body: z.object({
    id: z.string().optional(),
    courseId: z.string().optional(),
    title: z.string().min(1, 'Title is required').optional(),
    description: z.string().optional(),
    category: z.string().min(1, 'Category is required').optional(),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    thumbnail: z.union([z.string().url(), z.literal('')]).optional().nullable(),
    instructorId: z.string().optional(),
    isPublished: z.boolean().optional(),
    modules: z.array(z.object({
      title: z.string().min(1),
      duration: z.number().int().optional(),
      order: z.number().int().optional(),
    })).optional(),
  }),
};

const adminSubjectSchema = {
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    category: z.string().min(1, 'Category is required'),
    educationType: z.enum(['SCHOOL', 'COLLEGE', 'SKILLS', 'EXAM']).optional(),
    class: z.string().optional().nullable(),
    board: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    branch: z.string().optional().nullable(),
    semester: z.string().optional().nullable(),
    exam: z.string().optional().nullable(),
    topics: z.array(z.union([z.string().min(1), z.object({ title: z.string().min(1), order: z.number().int().optional() })])).optional(),
  }),
};

const adminSubjectUpdateSchema = {
  body: z.object({
    name: z.string().min(1).optional(),
    category: z.string().min(1).optional(),
    educationType: z.enum(['SCHOOL', 'COLLEGE', 'SKILLS', 'EXAM']).optional(),
    class: z.string().optional().nullable(),
    board: z.string().optional().nullable(),
    degree: z.string().optional().nullable(),
    branch: z.string().optional().nullable(),
    semester: z.string().optional().nullable(),
    exam: z.string().optional().nullable(),
    topics: z.array(z.union([z.string().min(1), z.object({ title: z.string().min(1), order: z.number().int().optional() })])).optional(),
  }),
};

const addTopicSchema = {
  body: z.object({
    title: z.string().min(1, 'Topic title is required'),
    order: z.number().int().optional(),
  }),
};

const addModuleSchema = {
  body: z.object({
    title: z.string().min(1, 'Module title is required'),
    duration: z.number().int().optional(),
    order: z.number().int().optional(),
  }),
};

const createQuizSchema = {
  body: z.object({
    subjectId: z.string().min(1, 'subjectId is required'),
    topicId: z.string().optional().nullable(),
    title: z.string().min(1, 'title is required'),
    difficulty: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    totalQuestions: z.number().int().positive().optional(),
  }),
};

const addQuizQuestionSchema = {
  body: z.object({
    questionText: z.string().min(1, 'questionText is required'),
    options: z.array(z.string().min(1)).min(2, 'At least 2 options required'),
    correctOptionIndex: z.number().int().min(0),
    explanation: z.string().optional().nullable(),
  }),
};

const createMissionSchema = {
  body: z.object({
    title: z.string().min(1, 'Mission title is required'),
    description: z.string().optional().nullable(),
    rewardXp: z.number().int().min(0).optional(),
    category: z.string().min(1, 'Category is required'),
    period: z.enum(['DAILY', 'WEEKLY']).optional(),
    isActive: z.boolean().optional(),
  }),
};

const updateMissionSchema = {
  body: z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional().nullable(),
    rewardXp: z.number().int().min(0).optional(),
    category: z.string().optional(),
    period: z.enum(['DAILY', 'WEEKLY']).optional(),
    isActive: z.boolean().optional(),
  }),
};

const optionalEnum = (enumArray) =>
  z.preprocess((val) => (val === '' || val === 'undefined' || val === 'null' || !val ? undefined : val), z.enum(enumArray).optional());

const queryUsersSchema = {
  query: z.object({
    role: optionalEnum(['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT']),
    learnerType: optionalEnum(['SCHOOL', 'COLLEGE', 'SKILLS', 'EXAM']),
    status: optionalEnum(['ACTIVE', 'SUSPENDED', 'BANNED']),
    search: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

const queryLoginAttemptsSchema = {
  query: z.object({
    status: optionalEnum(['SUCCESS', 'FAILED', 'BLOCKED']),
    search: z.string().optional(),
    userId: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

const queryChangeLogsSchema = {
  query: z.object({
    action: z.string().optional(),
    search: z.string().optional(),
    userId: z.string().optional(),
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
  }),
};

// ── Apply Admin Protection to All Routes ──────────────────────────────────────
router.use(requireAuth);
router.use(requireRole('ADMIN'));

// ── Routes ───────────────────────────────────────────────────────────────────

// Platform Metrics & Audit Logs
router.get('/metrics', getPlatformMetrics);
router.get('/stats', getPlatformMetrics);
router.get('/audit-logs', getAuditLogs);

// Users Management
router.get('/users', validate(queryUsersSchema), getUsers);
router.get('/users/:id/detail', getUserDetail);
router.put('/users/:id', validate(updateUserDetailsSchema), updateUserDetails);
router.patch('/users/:id/role', validate(updateRoleSchema), updateUserRole);
router.patch('/users/:id/status', validate(updateStatusSchema), updateUserStatus);
router.post('/users/:id/unlock', unlockUserAccount);
router.post('/users/:id/revoke-sessions', revokeUserSessions);
router.delete('/users/:id', deleteUser);

// Course & Module Management
router.get('/courses', getCourses);
router.post('/courses', validate(adminCourseSchema), createOrPublishCourse);
router.patch('/courses/:id', validate(adminCourseSchema), updateCourse);
router.delete('/courses/:id', deleteCourse);
router.post('/courses/:id/modules', validate(addModuleSchema), addCourseModule);
router.delete('/courses/modules/:moduleId', deleteCourseModule);

// Curriculum Subjects & Topics Management
router.get('/subjects', getSubjects);
router.post('/subjects', validate(adminSubjectSchema), createSubject);
router.patch('/subjects/:id', validate(adminSubjectUpdateSchema), updateSubject);
router.delete('/subjects/:id', deleteSubject);
router.post('/subjects/:id/topics', validate(addTopicSchema), addTopic);
router.delete('/topics/:topicId', deleteTopic);

// Quiz Management
router.get('/quizzes', getAdminQuizzes);
router.post('/quizzes', validate(createQuizSchema), createQuiz);
router.post('/quizzes/:id/questions', validate(addQuizQuestionSchema), addQuizQuestion);
router.delete('/quizzes/:id', deleteQuiz);
router.delete('/quizzes/questions/:questionId', deleteQuizQuestion);

// Gamification & Missions Management
router.get('/missions', getAdminMissions);
router.post('/missions', validate(createMissionSchema), createMission);
router.patch('/missions/:id', validate(updateMissionSchema), updateMission);
router.delete('/missions/:id', deleteMission);

// General Content Moderation (Courses, Subjects, Community Posts)
router.delete('/content/:type/:id', deleteContent);

// Security & Login Attempts Auditing
router.get('/login-attempts', validate(queryLoginAttemptsSchema), getLoginAttempts);
router.get('/login-attempts/stats', getLoginStats);
router.get('/user-change-logs', validate(queryChangeLogsSchema), getUserChangeLogs);

// ── NEW ENHANCED ADMIN CAPABILITY ENDPOINTS ──
router.get('/system-health', getSystemHealth);
router.get('/analytics', getPlatformAnalytics);
router.get('/sage-ai/status', getSageAiControlStatus);
router.get('/security/events', getExpandedSecurityEvents);
router.get('/moderation/reports', getModerationReports);
router.post('/moderation/action', handleModerationAction);
router.get('/notifications/stats', getNotificationAnalytics);
router.post('/announcements', createSystemAnnouncement);
router.get('/feature-flags', getFeatureFlags);
router.post('/feature-flags/toggle', toggleFeatureFlag);
router.get('/data-backup/status', getDataBackupStatus);

module.exports = router;
