const adminService = require('../services/adminService');

/**
 * @desc    Get system-wide platform metrics & health status
 * @route   GET /api/admin/metrics
 * @access  Private (ADMIN)
 */
const getPlatformMetrics = async (req, res) => {
  try {
    const metrics = await adminService.getPlatformMetrics();
    res.json({
      success: true,
      message: 'Platform metrics retrieved successfully',
      data: metrics,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve platform metrics',
      data: null,
    });
  }
};

const getMetrics = getPlatformMetrics;

/**
 * @desc    Get paginated users (filtered by role, learnerType, search)
 * @route   GET /api/admin/users
 * @access  Private (ADMIN)
 */
const getUsers = async (req, res) => {
  try {
    const result = await adminService.getUsers(req.query);
    res.json({
      success: true,
      message: 'Users retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve users',
      data: null,
    });
  }
};

/**
 * @desc    Promote or demote user role
 * @route   PATCH /api/admin/users/:id/role
 * @access  Private (ADMIN)
 */
const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!role) {
      return res.status(400).json({
        success: false,
        message: 'Role is required',
        data: null,
      });
    }
    const updatedUser = await adminService.updateUserRole(req.params.id, role, req.user.id);
    res.json({
      success: true,
      message: `User role successfully updated to ${role}`,
      data: updatedUser,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update user role',
      data: null,
    });
  }
};

/**
 * @desc    Create or toggle course publication status
 * @route   POST /api/admin/courses
 * @access  Private (ADMIN)
 */
const createOrPublishCourse = async (req, res) => {
  try {
    const course = await adminService.createOrPublishCourse(req.body, req.user.id);
    const isUpdate = Boolean(req.body.id || req.body.courseId);
    const message = isUpdate
      ? (req.body.isPublished !== undefined
          ? `Course publication status updated to ${req.body.isPublished ? 'published' : 'unpublished'}`
          : 'Course updated successfully')
      : 'Course created and published successfully';

    res.status(isUpdate ? 200 : 201).json({
      success: true,
      message,
      data: course,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create or publish course',
      data: null,
    });
  }
};

const createCourse = createOrPublishCourse;

/**
 * @desc    Get courses catalog
 * @route   GET /api/admin/courses
 * @access  Private (ADMIN)
 */
const getCourses = async (req, res) => {
  try {
    const courses = await adminService.getCourses(req.query);
    res.json({
      success: true,
      message: 'Courses retrieved successfully',
      data: courses,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve courses',
      data: null,
    });
  }
};

/**
 * @desc    Update course details
 * @route   PATCH /api/admin/courses/:id
 * @access  Private (ADMIN)
 */
const updateCourse = async (req, res) => {
  try {
    const course = await adminService.updateCourse(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Course updated successfully',
      data: course,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update course',
      data: null,
    });
  }
};

/**
 * @desc    Get curriculum subjects
 * @route   GET /api/admin/subjects
 * @access  Private (ADMIN)
 */
const getSubjects = async (req, res) => {
  try {
    const subjects = await adminService.getSubjects(req.query);
    res.json({
      success: true,
      message: 'Subjects retrieved successfully',
      data: subjects,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve subjects',
      data: null,
    });
  }
};

/**
 * @desc    Create curriculum subject
 * @route   POST /api/admin/subjects
 * @access  Private (ADMIN)
 */
const createSubject = async (req, res) => {
  try {
    const subject = await adminService.createSubject(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Subject created successfully',
      data: subject,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create subject',
      data: null,
    });
  }
};

/**
 * @desc    Update curriculum subject
 * @route   PATCH /api/admin/subjects/:id
 * @access  Private (ADMIN)
 */
const updateSubject = async (req, res) => {
  try {
    const subject = await adminService.updateSubject(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Subject updated successfully',
      data: subject,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update subject',
      data: null,
    });
  }
};

/**
 * @desc    Moderate content (delete course, subject, or post)
 * @route   DELETE /api/admin/content/:type/:id
 * @access  Private (ADMIN)
 */
const deleteContent = async (req, res) => {
  try {
    const result = await adminService.deleteContent(req.params.type, req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.message || 'Content deleted successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete content',
      data: null,
    });
  }
};

/**
 * @desc    Get 50 most recent records from AdminAuditLog joined with admin details
 * @route   GET /api/admin/audit-logs
 * @access  Private (ADMIN)
 */
const getAuditLogs = async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : 50;
    const logs = await adminService.getAuditLogs(limit);
    res.json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: logs,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve audit logs',
      data: null,
    });
  }
};

/**
 * @desc    Get detailed user profile with login and audit logs
 * @route   GET /api/admin/users/:id/detail
 * @access  Private (ADMIN)
 */
const getUserDetail = async (req, res) => {
  try {
    const user = await adminService.getUserDetail(req.params.id);
    res.json({
      success: true,
      message: 'User detail retrieved successfully',
      data: user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve user detail',
      data: null,
    });
  }
};

/**
 * @desc    Update user status (ACTIVE, SUSPENDED, BANNED)
 * @route   PATCH /api/admin/users/:id/status
 * @access  Private (ADMIN)
 */
const updateUserStatus = async (req, res) => {
  try {
    const { status, reason } = req.body;
    const user = await adminService.updateUserStatus(req.params.id, status, req.user.id, reason);
    res.json({
      success: true,
      message: `User status changed to ${status}`,
      data: user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update user status',
      data: null,
    });
  }
};

/**
 * @desc    Edit user profile dynamically by Admin
 * @route   PUT /api/admin/users/:id
 * @access  Private (ADMIN)
 */
const updateUserDetails = async (req, res) => {
  try {
    const user = await adminService.updateUserDetails(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'User updated successfully',
      data: user,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update user details',
      data: null,
    });
  }
};

/**
 * @desc    Unlock a locked user account
 * @route   POST /api/admin/users/:id/unlock
 * @access  Private (ADMIN)
 */
const unlockUserAccount = async (req, res) => {
  try {
    const result = await adminService.unlockUserAccount(req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.message || 'Account unlocked successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to unlock account',
      data: null,
    });
  }
};

/**
 * @desc    Force revoke all active sessions of a user
 * @route   POST /api/admin/users/:id/revoke-sessions
 * @access  Private (ADMIN)
 */
const revokeUserSessions = async (req, res) => {
  try {
    const result = await adminService.revokeUserSessions(req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.message || 'Sessions revoked successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to revoke sessions',
      data: null,
    });
  }
};

/**
 * @desc    Safely delete user
 * @route   DELETE /api/admin/users/:id
 * @access  Private (ADMIN)
 */
const deleteUser = async (req, res) => {
  try {
    const result = await adminService.deleteUserSafely(req.params.id, req.user.id);
    res.json({
      success: true,
      message: result.message || 'User deleted successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete user',
      data: null,
    });
  }
};

/**
 * @desc    Get paginated login attempts
 * @route   GET /api/admin/login-attempts
 * @access  Private (ADMIN)
 */
const getLoginAttempts = async (req, res) => {
  try {
    const result = await adminService.getLoginAttempts(req.query);
    res.json({
      success: true,
      message: 'Login attempts retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve login attempts',
      data: null,
    });
  }
};

/**
 * @desc    Get login statistics and analytics
 * @route   GET /api/admin/login-attempts/stats
 * @access  Private (ADMIN)
 */
const getLoginStats = async (req, res) => {
  try {
    const stats = await adminService.getLoginStats();
    res.json({
      success: true,
      message: 'Login stats retrieved successfully',
      data: stats,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve login statistics',
      data: null,
    });
  }
};

/**
 * @desc    Get user change audit logs
 * @route   GET /api/admin/user-change-logs
 * @access  Private (ADMIN)
 */
const getUserChangeLogs = async (req, res) => {
  try {
    const result = await adminService.getUserChangeLogs(req.query);
    res.json({
      success: true,
      message: 'User change logs retrieved successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve user change logs',
      data: null,
    });
  }
};

/**
 * @desc    Delete subject
 * @route   DELETE /api/admin/subjects/:id
 * @access  Private (ADMIN)
 */
const deleteSubject = async (req, res) => {
  try {
    const result = await adminService.deleteSubject(req.params.id, req.user.id);
    res.json({
      success: true,
      message: `Subject "${result.name}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete subject',
      data: null,
    });
  }
};

/**
 * @desc    Add topic to subject
 * @route   POST /api/admin/subjects/:id/topics
 * @access  Private (ADMIN)
 */
const addTopic = async (req, res) => {
  try {
    const topic = await adminService.addTopic(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Topic created successfully',
      data: topic,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to add topic',
      data: null,
    });
  }
};

/**
 * @desc    Delete topic
 * @route   DELETE /api/admin/topics/:topicId
 * @access  Private (ADMIN)
 */
const deleteTopic = async (req, res) => {
  try {
    const result = await adminService.deleteTopic(req.params.topicId, req.user.id);
    res.json({
      success: true,
      message: `Topic "${result.title}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete topic',
      data: null,
    });
  }
};

/**
 * @desc    Delete course
 * @route   DELETE /api/admin/courses/:id
 * @access  Private (ADMIN)
 */
const deleteCourse = async (req, res) => {
  try {
    const result = await adminService.deleteCourse(req.params.id, req.user.id);
    res.json({
      success: true,
      message: `Course "${result.title}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete course',
      data: null,
    });
  }
};

/**
 * @desc    Add module to course
 * @route   POST /api/admin/courses/:id/modules
 * @access  Private (ADMIN)
 */
const addCourseModule = async (req, res) => {
  try {
    const module = await adminService.addCourseModule(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Module added to course successfully',
      data: module,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to add course module',
      data: null,
    });
  }
};

/**
 * @desc    Delete course module
 * @route   DELETE /api/admin/courses/modules/:moduleId
 * @access  Private (ADMIN)
 */
const deleteCourseModule = async (req, res) => {
  try {
    const result = await adminService.deleteCourseModule(req.params.moduleId, req.user.id);
    res.json({
      success: true,
      message: `Module "${result.title}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete course module',
      data: null,
    });
  }
};

/**
 * @desc    Get admin quizzes
 * @route   GET /api/admin/quizzes
 * @access  Private (ADMIN)
 */
const getAdminQuizzes = async (req, res) => {
  try {
    const quizzes = await adminService.getAdminQuizzes(req.query);
    res.json({
      success: true,
      message: 'Quizzes retrieved successfully',
      data: quizzes,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve quizzes',
      data: null,
    });
  }
};

/**
 * @desc    Create quiz
 * @route   POST /api/admin/quizzes
 * @access  Private (ADMIN)
 */
const createQuiz = async (req, res) => {
  try {
    const quiz = await adminService.createQuiz(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Quiz created successfully',
      data: quiz,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create quiz',
      data: null,
    });
  }
};

/**
 * @desc    Add question to quiz
 * @route   POST /api/admin/quizzes/:id/questions
 * @access  Private (ADMIN)
 */
const addQuizQuestion = async (req, res) => {
  try {
    const question = await adminService.addQuizQuestion(req.params.id, req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Question added to quiz successfully',
      data: question,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to add question to quiz',
      data: null,
    });
  }
};

/**
 * @desc    Delete quiz
 * @route   DELETE /api/admin/quizzes/:id
 * @access  Private (ADMIN)
 */
const deleteQuiz = async (req, res) => {
  try {
    const result = await adminService.deleteQuiz(req.params.id, req.user.id);
    res.json({
      success: true,
      message: `Quiz "${result.title}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete quiz',
      data: null,
    });
  }
};

/**
 * @desc    Delete quiz question
 * @route   DELETE /api/admin/quizzes/questions/:questionId
 * @access  Private (ADMIN)
 */
const deleteQuizQuestion = async (req, res) => {
  try {
    const result = await adminService.deleteQuizQuestion(req.params.questionId, req.user.id);
    res.json({
      success: true,
      message: 'Quiz question deleted successfully',
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete quiz question',
      data: null,
    });
  }
};

/**
 * @desc    Get admin missions
 * @route   GET /api/admin/missions
 * @access  Private (ADMIN)
 */
const getAdminMissions = async (req, res) => {
  try {
    const missions = await adminService.getAdminMissions(req.query);
    res.json({
      success: true,
      message: 'Missions retrieved successfully',
      data: missions,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to retrieve missions',
      data: null,
    });
  }
};

/**
 * @desc    Create gamification mission
 * @route   POST /api/admin/missions
 * @access  Private (ADMIN)
 */
const createMission = async (req, res) => {
  try {
    const mission = await adminService.createMission(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Mission created successfully',
      data: mission,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to create mission',
      data: null,
    });
  }
};

/**
 * @desc    Update gamification mission (active toggle / rewards)
 * @route   PATCH /api/admin/missions/:id
 * @access  Private (ADMIN)
 */
const updateMission = async (req, res) => {
  try {
    const mission = await adminService.updateMission(req.params.id, req.body, req.user.id);
    res.json({
      success: true,
      message: 'Mission updated successfully',
      data: mission,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to update mission',
      data: null,
    });
  }
};

/**
 * @desc    Delete gamification mission
 * @route   DELETE /api/admin/missions/:id
 * @access  Private (ADMIN)
 */
const deleteMission = async (req, res) => {
  try {
    const result = await adminService.deleteMission(req.params.id, req.user.id);
    res.json({
      success: true,
      message: `Mission "${result.title}" deleted successfully`,
      data: result,
    });
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || 'Failed to delete mission',
      data: null,
    });
  }
};

const adminEnhancementService = require('../services/adminEnhancementService');

const getSystemHealth = async (req, res) => {
  try {
    const health = await adminEnhancementService.getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getPlatformAnalytics = async (req, res) => {
  try {
    const analytics = await adminEnhancementService.getPlatformAnalytics(req.query);
    res.json({ success: true, data: analytics });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getSageAiControlStatus = async (req, res) => {
  try {
    const status = await adminEnhancementService.getSageAiControlStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getExpandedSecurityEvents = async (req, res) => {
  try {
    const events = await adminEnhancementService.getExpandedSecurityEvents(req.query);
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getModerationReports = async (req, res) => {
  try {
    const reports = await adminEnhancementService.getModerationReports(req.query);
    res.json({ success: true, data: reports });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const handleModerationAction = async (req, res) => {
  try {
    const result = await adminEnhancementService.handleModerationAction(req.user.id, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getNotificationAnalytics = async (req, res) => {
  try {
    const data = await adminEnhancementService.getNotificationAnalytics();
    res.json({ success: true, data });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const createSystemAnnouncement = async (req, res) => {
  try {
    const result = await adminEnhancementService.createSystemAnnouncement(req.user.id, req.body);
    res.status(201).json({ success: true, data: result });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getFeatureFlags = async (req, res) => {
  try {
    const flags = await adminEnhancementService.getFeatureFlags();
    res.json({ success: true, data: flags });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const toggleFeatureFlag = async (req, res) => {
  try {
    const flag = await adminEnhancementService.toggleFeatureFlag(req.user.id, req.body);
    res.json({ success: true, data: flag });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

const getDataBackupStatus = async (req, res) => {
  try {
    const status = await adminEnhancementService.getDataBackupStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(error.status || 500).json({ success: false, message: error.message });
  }
};

module.exports = {
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
};
