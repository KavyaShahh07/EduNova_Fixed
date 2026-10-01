const prisma = require('../config/db');
const { resolveIpLocation } = require('../utils/geo');
const { dispatchSecurityAlert } = require('./webhookService');

/**
 * Get system-wide platform metrics
 * Computes total registered users, breakdown by role, total active subjects,
 * published courses, total quiz attempts, server uptime, memory usage, and PostgreSQL health.
 */
const getPlatformMetrics = async () => {
  const [
    totalUsers,
    studentUsers,
    instructorUsers,
    parentUsers,
    adminUsers,
    activeUsersCount,
    suspendedUsersCount,
    totalActiveSubjects,
    publishedCourses,
    totalCourses,
    totalQuizAttempts,
    totalEnrollments,
    totalLoginAttempts,
    failedLoginAttempts,
    recentLoginAttempts,
    recentAuditLogs,
    recentChangeLogs,
    dbCheck,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'INSTRUCTOR' } }),
    prisma.user.count({ where: { role: 'PARENT' } }),
    prisma.user.count({ where: { role: 'ADMIN' } }),
    prisma.user.count({ where: { status: 'ACTIVE' } }),
    prisma.user.count({ where: { status: { in: ['SUSPENDED', 'BANNED'] } } }),
    prisma.subject.count(),
    prisma.course.count({ where: { isPublished: true } }),
    prisma.course.count(),
    prisma.quizAttempt.count(),
    prisma.userCourseProgress.count(),
    prisma.loginAttempt.count(),
    prisma.loginAttempt.count({ where: { status: { in: ['FAILED', 'BLOCKED'] } } }),
    prisma.loginAttempt.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
    prisma.adminAuditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { admin: { select: { id: true, name: true, email: true } } },
    }),
    prisma.userChangeLog.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
        changedBy: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.$queryRaw`SELECT 1 as health`.then(() => 'CONNECTED').catch((err) => `FAILED: ${err.message}`),
  ]);

  const mem = process.memoryUsage();

  return {
    systemHealth: dbCheck === 'CONNECTED' ? 'OPERATIONAL' : 'DEGRADED',
    uptime: process.uptime(),
    databaseStatus: dbCheck,
    timestamp: new Date().toISOString(),
    memoryUsage: {
      rss: `${Math.round(mem.rss / 1024 / 1024)} MB`,
      heapTotal: `${Math.round(mem.heapTotal / 1024 / 1024)} MB`,
      heapUsed: `${Math.round(mem.heapUsed / 1024 / 1024)} MB`,
    },
    users: {
      total: totalUsers,
      byRole: {
        STUDENT: studentUsers,
        INSTRUCTOR: instructorUsers,
        PARENT: parentUsers,
        ADMIN: adminUsers,
      },
      students: studentUsers,
      instructors: instructorUsers,
      parents: parentUsers,
      admins: adminUsers,
      active: activeUsersCount,
      suspended: suspendedUsersCount,
    },
    content: {
      totalSubjects: totalActiveSubjects,
      publishedCourses,
      totalCourses,
      totalQuizAttempts,
      totalEnrollments,
    },
    security: {
      totalLoginAttempts,
      failedLoginAttempts,
      successRate: totalLoginAttempts > 0 
        ? Math.round(((totalLoginAttempts - failedLoginAttempts) / totalLoginAttempts) * 100) 
        : 100,
      recentLoginAttempts,
    },
    recentAuditLogs,
    recentChangeLogs,
  };
};

const getMetrics = getPlatformMetrics;

/**
 * Get paginated users list with filters
 */
const getUsers = async ({ role, learnerType, status, search, page = 1, limit = 20 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));

  const where = {};
  if (role) where.role = role;
  if (learnerType) where.learnerType = learnerType;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { phone: { contains: search } },
      { studentUsername: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        learnerType: true,
        status: true,
        failedLoginAttempts: true,
        lockoutUntil: true,
        lastLoginAt: true,
        lastLoginIp: true,
        studentUsername: true,
        avatar: true,
        tokenVersion: true,
        createdAt: true,
        updatedAt: true,
        learnerProfile: {
          select: { xp: true, level: true, streakDays: true },
        },
        _count: {
          select: { loginAttempts: true, changeLogs: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
    prisma.user.count({ where }),
  ]);

  return {
    users,
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };
};

/**
 * Promote / demote user role
 */
const updateUserRole = async (userId, newRole, adminId) => {
  const validRoles = ['ADMIN', 'INSTRUCTOR', 'STUDENT', 'PARENT'];
  if (!validRoles.includes(newRole)) {
    throw { status: 400, message: `Invalid role. Must be one of: ${validRoles.join(', ')}` };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.role === 'ADMIN' && newRole !== 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw { status: 409, message: 'The last administrator cannot be demoted.' };
    }
  }

  // Privileged Role Security Check: Assigning ADMIN role requires verified email
  if (newRole === 'ADMIN' && !user.isEmailVerified) {
    throw {
      status: 400,
      message: 'Target user must possess a verified email before being granted privileged administrator access.',
    };
  }

  const oldRole = user.role;

  const updatedUser = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { role: newRole, tokenVersion: { increment: 1 } },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        learnerType: true,
        updatedAt: true,
      },
    });

    // Create Audit Log
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_ROLE',
        targetType: 'User',
        targetId: userId,
        details: {
          oldRole,
          newRole,
          userName: user.name,
          userEmail: user.email,
        },
      },
    });

    await tx.userChangeLog.create({
      data: {
        userId,
        changedById: adminId,
        action: 'ROLE_CHANGE',
        details: { previous: oldRole, current: newRole },
      },
    });

    return updated;
  });

  if (newRole === 'ADMIN' || oldRole === 'ADMIN') {
    dispatchSecurityAlert({
      event: 'ADMIN_ROLE_CHANGE',
      severity: 'CRITICAL',
      title: `Privileged role changed for user ${user.email} from ${oldRole} to ${newRole}`,
      details: {
        userId,
        email: user.email,
        previousRole: oldRole,
        newRole,
        adminId,
      },
    }).catch(() => {});
  }

  return updatedUser;
};

/**
 * Create or toggle publication status of course
 * Allows an admin to create or toggle publication status (isPublished: true/false) of any course.
 * Logs PUBLISH_COURSE or CREATE_COURSE in AdminAuditLog.
 */
const createOrPublishCourse = async (data, adminId) => {
  const { id, courseId, title, description, category, difficulty, thumbnail, modules, instructorId, isPublished } = data;
  const targetId = id || courseId;

  if (targetId) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.course.findUnique({ where: { id: targetId } });
      if (!existing) throw { status: 404, message: 'Course not found' };

      const updated = await tx.course.update({
        where: { id: targetId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(difficulty !== undefined && { difficulty }),
          ...(thumbnail !== undefined && { thumbnail }),
          ...(isPublished !== undefined && { isPublished }),
        },
      });

      const action = isPublished !== undefined && isPublished !== existing.isPublished
        ? (isPublished ? 'PUBLISH_COURSE' : 'UNPUBLISH_COURSE')
        : 'UPDATE_COURSE';

      await tx.adminAuditLog.create({
        data: {
          adminId,
          action,
          targetType: 'Course',
          targetId,
          details: { title: updated.title, isPublished: updated.isPublished, previousPublished: existing.isPublished },
        },
      });

      return updated;
    });
  }

  // Creating new course
  return await prisma.$transaction(async (tx) => {
    const course = await tx.course.create({
      data: {
        title,
        description,
        category,
        difficulty: difficulty || 'BEGINNER',
        thumbnail,
        isPublished: isPublished !== undefined ? isPublished : true,
        instructorId: instructorId || adminId,
        ...(modules && modules.length > 0 && {
          modules: {
            create: modules.map((m, i) => ({
              title: m.title,
              duration: m.duration || 0,
              order: m.order || i + 1,
            })),
          },
        }),
      },
      include: {
        modules: { orderBy: { order: 'asc' } },
        instructor: { select: { id: true, name: true } },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: course.isPublished ? 'PUBLISH_COURSE' : 'CREATE_COURSE',
        targetType: 'Course',
        targetId: course.id,
        details: { title: course.title, category: course.category, isPublished: course.isPublished },
      },
    });

    return course;
  });
};

const createVerifiedCourse = createOrPublishCourse;

const getCourses = async ({ search } = {}) => {
  const where = search ? { OR: [{ title: { contains: search } }, { category: { contains: search } }] } : {};
  return prisma.course.findMany({
    where,
    include: {
      modules: { orderBy: { order: 'asc' } },
      instructor: { select: { id: true, name: true, email: true } },
      _count: { select: { enrollments: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const updateCourse = async (courseId, data, adminId) => {
  const { title, description, category, difficulty, thumbnail, instructorId, modules, isPublished } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.course.findUnique({ where: { id: courseId } });
    if (!existing) throw { status: 404, message: 'Course not found' };

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (difficulty !== undefined) updateData.difficulty = difficulty;
    if (thumbnail !== undefined) updateData.thumbnail = thumbnail;
    if (instructorId !== undefined) updateData.instructorId = instructorId;
    if (isPublished !== undefined) updateData.isPublished = Boolean(isPublished);

    if (Array.isArray(modules)) {
      updateData.modules = {
        deleteMany: {},
        create: modules.map((module, index) => ({
          title: module.title,
          duration: parseInt(module.duration, 10) || 0,
          order: module.order !== undefined ? parseInt(module.order, 10) : index + 1,
        })),
      };
    }

    const course = await tx.course.update({
      where: { id: courseId },
      data: updateData,
      include: {
        modules: { orderBy: { order: 'asc' } },
        instructor: { select: { id: true, name: true, email: true } },
      },
    });

    const action = isPublished !== undefined && isPublished !== existing.isPublished
      ? (isPublished ? 'PUBLISH_COURSE' : 'UNPUBLISH_COURSE')
      : 'UPDATE_COURSE';

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action,
        targetType: 'Course',
        targetId: courseId,
        details: { title: course.title, changes: updateData },
      },
    });

    return course;
  });
};

const deleteCourse = async (courseId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.course.findUnique({ where: { id: courseId } });
    if (!existing) throw { status: 404, message: 'Course not found' };

    await tx.course.delete({ where: { id: courseId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_COURSE',
        targetType: 'Course',
        targetId: courseId,
        details: { title: existing.title },
      },
    });

    return { id: courseId, title: existing.title };
  });
};

const addCourseModule = async (courseId, data, adminId) => {
  const { title, duration = 0, order } = data;
  if (!title) throw { status: 400, message: 'Module title is required' };

  return prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({ where: { id: courseId } });
    if (!course) throw { status: 404, message: 'Course not found' };

    let modOrder = order;
    if (modOrder === undefined || modOrder === null) {
      const highest = await tx.courseModule.findFirst({
        where: { courseId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      modOrder = (highest?.order || 0) + 1;
    }

    const module = await tx.courseModule.create({
      data: {
        courseId,
        title,
        duration: parseInt(duration, 10) || 0,
        order: parseInt(modOrder, 10),
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_COURSE_MODULE',
        targetType: 'CourseModule',
        targetId: module.id,
        details: { courseId, courseTitle: course.title, title: module.title, duration: module.duration, order: module.order },
      },
    });

    return module;
  });
};

const deleteCourseModule = async (moduleId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.courseModule.findUnique({
      where: { id: moduleId },
      include: { course: { select: { id: true, title: true } } },
    });
    if (!existing) throw { status: 404, message: 'Module not found' };

    await tx.courseModule.delete({ where: { id: moduleId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_COURSE_MODULE',
        targetType: 'CourseModule',
        targetId: moduleId,
        details: { title: existing.title, courseId: existing.courseId, courseTitle: existing.course?.title },
      },
    });

    return { id: moduleId, title: existing.title };
  });
};

const getSubjects = async ({ search } = {}) => {
  return prisma.subject.findMany({
    where: search
      ? {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { category: { contains: search, mode: 'insensitive' } },
        ],
      }
      : {},
    include: {
      topics: { orderBy: { order: 'asc' } },
      createdBy: { select: { id: true, name: true, email: true } },
      _count: { select: { quizzes: true, progress: true } },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const createSubject = async (data, adminId) => {
  const { name, category, educationType, class: className, board, degree, branch, semester, exam, topics = [] } = data;
  if (!name) throw { status: 400, message: 'Subject name is required' };
  if (!category) throw { status: 400, message: 'Category is required' };

  return prisma.$transaction(async (tx) => {
    const subject = await tx.subject.create({
      data: {
        name,
        category,
        educationType: educationType || 'SCHOOL',
        class: className || null,
        board: board || null,
        degree: degree || null,
        branch: branch || null,
        semester: semester || null,
        exam: exam || null,
        createdById: adminId,
        ...(Array.isArray(topics) && topics.length > 0 && {
          topics: {
            create: topics.map((t, idx) => {
              if (typeof t === 'string') return { title: t, order: idx + 1 };
              return { title: t.title, order: t.order !== undefined ? parseInt(t.order, 10) : idx + 1 };
            }),
          },
        }),
      },
      include: {
        topics: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_SUBJECT',
        targetType: 'Subject',
        targetId: subject.id,
        details: { name: subject.name, category: subject.category, educationType: subject.educationType },
      },
    });

    return subject;
  });
};

const updateSubject = async (subjectId, data, adminId) => {
  const { name, category, educationType, class: className, board, degree, branch, semester, exam, topics } = data;
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subject.findUnique({ where: { id: subjectId } });
    if (!existing) throw { status: 404, message: 'Subject not found' };

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (category !== undefined) updateData.category = category;
    if (educationType !== undefined) updateData.educationType = educationType;
    if (className !== undefined) updateData.class = className;
    if (board !== undefined) updateData.board = board;
    if (degree !== undefined) updateData.degree = degree;
    if (branch !== undefined) updateData.branch = branch;
    if (semester !== undefined) updateData.semester = semester;
    if (exam !== undefined) updateData.exam = exam;

    if (Array.isArray(topics)) {
      updateData.topics = {
        deleteMany: {},
        create: topics.map((t, idx) => {
          if (typeof t === 'string') return { title: t, order: idx + 1 };
          return { title: t.title, order: t.order !== undefined ? parseInt(t.order, 10) : idx + 1 };
        }),
      };
    }

    const subject = await tx.subject.update({
      where: { id: subjectId },
      data: updateData,
      include: {
        topics: { orderBy: { order: 'asc' } },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_SUBJECT',
        targetType: 'Subject',
        targetId: subject.id,
        details: { name: subject.name, updates: updateData },
      },
    });

    return subject;
  });
};

const deleteSubject = async (subjectId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.subject.findUnique({ where: { id: subjectId } });
    if (!existing) throw { status: 404, message: 'Subject not found' };

    await tx.subject.delete({ where: { id: subjectId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_SUBJECT',
        targetType: 'Subject',
        targetId: subjectId,
        details: { name: existing.name },
      },
    });

    return { id: subjectId, name: existing.name };
  });
};

const addTopic = async (subjectId, data, adminId) => {
  const { title, order } = data;
  if (!title) throw { status: 400, message: 'Topic title is required' };

  return prisma.$transaction(async (tx) => {
    const subject = await tx.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw { status: 404, message: 'Subject not found' };

    let topicOrder = order;
    if (topicOrder === undefined || topicOrder === null) {
      const highest = await tx.topic.findFirst({
        where: { subjectId },
        orderBy: { order: 'desc' },
        select: { order: true },
      });
      topicOrder = (highest?.order || 0) + 1;
    }

    const topic = await tx.topic.create({
      data: {
        subjectId,
        title,
        order: parseInt(topicOrder, 10),
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_TOPIC',
        targetType: 'Topic',
        targetId: topic.id,
        details: { subjectId, subjectName: subject.name, title: topic.title, order: topic.order },
      },
    });

    return topic;
  });
};

const deleteTopic = async (topicId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.topic.findUnique({
      where: { id: topicId },
      include: { subject: { select: { id: true, name: true } } },
    });
    if (!existing) throw { status: 404, message: 'Topic not found' };

    await tx.topic.delete({ where: { id: topicId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_TOPIC',
        targetType: 'Topic',
        targetId: topicId,
        details: { title: existing.title, subjectId: existing.subjectId, subjectName: existing.subject?.name },
      },
    });

    return { id: topicId, title: existing.title };
  });
};

// ── Quizzes & Questions ────────────────────────────────────────────────────────

const getAdminQuizzes = async ({ subjectId, topicId, search } = {}) => {
  const where = {};
  if (subjectId) where.subjectId = subjectId;
  if (topicId) where.topicId = topicId;
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  return prisma.quiz.findMany({
    where,
    include: {
      subject: { select: { id: true, name: true, category: true } },
      topic: { select: { id: true, title: true } },
      questions: {
        orderBy: { id: 'asc' },
      },
      _count: {
        select: {
          questions: true,
          attempts: true,
        },
      },
    },
    orderBy: { updatedAt: 'desc' },
  });
};

const createQuiz = async (data, adminId) => {
  const { subjectId, topicId, title, difficulty = 'BEGINNER', totalQuestions, questions = [] } = data;
  if (!subjectId) throw { status: 400, message: 'Subject ID is required' };
  if (!title) throw { status: 400, message: 'Quiz title is required' };

  return prisma.$transaction(async (tx) => {
    const subject = await tx.subject.findUnique({ where: { id: subjectId } });
    if (!subject) throw { status: 404, message: 'Subject not found' };

    if (topicId) {
      const topic = await tx.topic.findUnique({ where: { id: topicId } });
      if (!topic) throw { status: 404, message: 'Topic not found' };
    }

    const calculatedTotal = questions.length > 0 ? questions.length : (parseInt(totalQuestions, 10) || 5);

    const quiz = await tx.quiz.create({
      data: {
        subjectId,
        topicId: topicId || null,
        title,
        difficulty,
        totalQuestions: calculatedTotal,
        ...(questions.length > 0 && {
          questions: {
            create: questions.map((q) => ({
              questionText: q.questionText,
              options: q.options || [],
              correctOptionIndex: parseInt(q.correctOptionIndex, 10) || 0,
              explanation: q.explanation || null,
            })),
          },
        }),
      },
      include: {
        subject: { select: { id: true, name: true } },
        topic: { select: { id: true, title: true } },
        questions: true,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_QUIZ',
        targetType: 'Quiz',
        targetId: quiz.id,
        details: { title: quiz.title, subjectName: subject.name, difficulty: quiz.difficulty },
      },
    });

    return quiz;
  });
};

const addQuizQuestion = async (quizId, data, adminId) => {
  const { questionText, options, correctOptionIndex = 0, explanation } = data;
  if (!questionText) throw { status: 400, message: 'questionText is required' };
  if (!Array.isArray(options) || options.length < 2) {
    throw { status: 400, message: 'options must be an array with at least 2 choices' };
  }
  const parsedCorrectIndex = parseInt(correctOptionIndex, 10);
  if (isNaN(parsedCorrectIndex) || parsedCorrectIndex < 0 || parsedCorrectIndex >= options.length) {
    throw { status: 400, message: `correctOptionIndex must be between 0 and ${options.length - 1}` };
  }

  return prisma.$transaction(async (tx) => {
    const quiz = await tx.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) throw { status: 404, message: 'Quiz not found' };

    const question = await tx.quizQuestion.create({
      data: {
        quizId,
        questionText,
        options,
        correctOptionIndex: parsedCorrectIndex,
        explanation: explanation || null,
      },
    });

    const count = await tx.quizQuestion.count({ where: { quizId } });
    await tx.quiz.update({
      where: { id: quizId },
      data: { totalQuestions: count },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'ADD_QUIZ_QUESTION',
        targetType: 'QuizQuestion',
        targetId: question.id,
        details: { quizId, quizTitle: quiz.title, questionText },
      },
    });

    return question;
  });
};

const deleteQuiz = async (quizId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.quiz.findUnique({ where: { id: quizId } });
    if (!existing) throw { status: 404, message: 'Quiz not found' };

    await tx.quiz.delete({ where: { id: quizId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_QUIZ',
        targetType: 'Quiz',
        targetId: quizId,
        details: { title: existing.title },
      },
    });

    return { id: quizId, title: existing.title };
  });
};

const deleteQuizQuestion = async (questionId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.quizQuestion.findUnique({
      where: { id: questionId },
      include: { quiz: { select: { id: true, title: true } } },
    });
    if (!existing) throw { status: 404, message: 'Question not found' };

    const quizId = existing.quizId;
    await tx.quizQuestion.delete({ where: { id: questionId } });

    const count = await tx.quizQuestion.count({ where: { quizId } });
    await tx.quiz.update({
      where: { id: quizId },
      data: { totalQuestions: count },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_QUIZ_QUESTION',
        targetType: 'QuizQuestion',
        targetId: questionId,
        details: { quizId, quizTitle: existing.quiz?.title, questionText: existing.questionText },
      },
    });

    return { id: questionId, quizId };
  });
};

// ── Gamification & Missions ──────────────────────────────────────────────────

const getAdminMissions = async ({ category, period, isActive, search } = {}) => {
  const where = {};
  if (category) where.category = category;
  if (period) where.period = period;
  if (isActive !== undefined) where.isActive = isActive === 'true' || isActive === true;
  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  return prisma.mission.findMany({
    where,
    include: {
      _count: {
        select: { userMissions: true },
      },
    },
    orderBy: [{ isActive: 'desc' }, { createdAt: 'desc' }],
  });
};

const createMission = async (data, adminId) => {
  const { title, description, rewardXp = 50, category = 'learning', period = 'DAILY', isActive = true } = data;
  if (!title) throw { status: 400, message: 'Mission title is required' };
  if (!category) throw { status: 400, message: 'Category is required' };

  return prisma.$transaction(async (tx) => {
    const mission = await tx.mission.create({
      data: {
        title,
        description: description || null,
        rewardXp: parseInt(rewardXp, 10) || 0,
        category,
        period: period.toUpperCase() === 'WEEKLY' ? 'WEEKLY' : 'DAILY',
        isActive: isActive !== false,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'CREATE_MISSION',
        targetType: 'Mission',
        targetId: mission.id,
        details: { title: mission.title, rewardXp: mission.rewardXp, period: mission.period, category: mission.category },
      },
    });

    return mission;
  });
};

const updateMission = async (missionId, data, adminId) => {
  const { title, description, rewardXp, category, period, isActive } = data;

  return prisma.$transaction(async (tx) => {
    const existing = await tx.mission.findUnique({ where: { id: missionId } });
    if (!existing) throw { status: 404, message: 'Mission not found' };

    const updates = {};
    if (title !== undefined) updates.title = title;
    if (description !== undefined) updates.description = description;
    if (rewardXp !== undefined) updates.rewardXp = parseInt(rewardXp, 10) || 0;
    if (category !== undefined) updates.category = category;
    if (period !== undefined) updates.period = period.toUpperCase() === 'WEEKLY' ? 'WEEKLY' : 'DAILY';
    if (isActive !== undefined) updates.isActive = Boolean(isActive);

    const updated = await tx.mission.update({
      where: { id: missionId },
      data: updates,
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_MISSION',
        targetType: 'Mission',
        targetId: missionId,
        details: { title: updated.title, updates },
      },
    });

    return updated;
  });
};

const deleteMission = async (missionId, adminId) => {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.mission.findUnique({ where: { id: missionId } });
    if (!existing) throw { status: 404, message: 'Mission not found' };

    await tx.mission.delete({ where: { id: missionId } });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_MISSION',
        targetType: 'Mission',
        targetId: missionId,
        details: { title: existing.title },
      },
    });

    return { id: missionId, title: existing.title };
  });
};

/**
 * Moderate/delete content (courses, subjects, or community posts)
 * Soft/hard deletes targeted content (type: 'course', 'subject', or 'post').
 * Logs DELETE_CONTENT in AdminAuditLog.
 */
const deleteContent = async (type, id, adminId) => {
  const normalizedType = (type || '').toLowerCase();

  return await prisma.$transaction(async (tx) => {
    let deletedTitle = '';

    if (normalizedType === 'course') {
      const existing = await tx.course.findUnique({ where: { id } });
      if (!existing) throw { status: 404, message: 'Course not found' };
      deletedTitle = existing.title;
      await tx.course.delete({ where: { id } });
    } else if (normalizedType === 'subject') {
      const existing = await tx.subject.findUnique({ where: { id } });
      if (!existing) throw { status: 404, message: 'Subject not found' };
      deletedTitle = existing.name;
      await tx.subject.delete({ where: { id } });
    } else if (normalizedType === 'post' || normalizedType === 'communitypost') {
      const existing = await tx.communityPost.findUnique({ where: { id } });
      if (!existing) throw { status: 404, message: 'Community post not found' };
      deletedTitle = existing.title;
      await tx.communityPost.delete({ where: { id } });
    } else {
      throw { status: 400, message: `Unsupported content type "${type}". Must be 'course', 'subject', or 'post'.` };
    }

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_CONTENT',
        targetType: normalizedType.charAt(0).toUpperCase() + normalizedType.slice(1),
        targetId: id,
        details: { type: normalizedType, title: deletedTitle },
      },
    });

    return {
      message: `${normalizedType} "${deletedTitle}" successfully removed by admin`,
      type: normalizedType,
      id,
    };
  });
};

/**
 * Returns the 50 most recent records from AdminAuditLog joined with admin name and email
 */
const getAuditLogs = async (limit = 50) => {
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 50));
  return prisma.adminAuditLog.findMany({
    take: parsedLimit,
    orderBy: { createdAt: 'desc' },
    include: {
      admin: {
        select: { id: true, name: true, email: true },
      },
    },
  });
};

/**
 * Update user status (ACTIVE, SUSPENDED, BANNED)
 */
const updateUserStatus = async (userId, newStatus, adminId, reason = '') => {
  const validStatuses = ['ACTIVE', 'SUSPENDED', 'BANNED'];
  if (!validStatuses.includes(newStatus)) {
    throw { status: 400, message: `Invalid status. Must be one of: ${validStatuses.join(', ')}` };
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.role === 'ADMIN' && newStatus !== 'ACTIVE') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
    if (adminCount <= 1) {
      throw { status: 409, message: 'Cannot suspend or ban the last active administrator.' };
    }
  }

  const previousStatus = user.status;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        status: newStatus,
        ...(newStatus !== 'ACTIVE' ? { tokenVersion: { increment: 1 } } : {}),
      },
    });

    await tx.userChangeLog.create({
      data: {
        userId,
        changedById: adminId,
        action: 'STATUS_CHANGE',
        details: { previous: previousStatus, current: newStatus, reason },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_STATUS',
        targetType: 'User',
        targetId: userId,
        details: {
          userName: user.name,
          userEmail: user.email,
          previousStatus,
          newStatus,
          reason,
        },
      },
    });

    return updated;
  });

  if (newStatus !== 'ACTIVE') {
    dispatchSecurityAlert({
      event: 'USER_ACCOUNT_SUSPENDED',
      severity: 'WARNING',
      title: `User account ${user.email} was set to ${newStatus}`,
      details: {
        userId,
        email: user.email,
        previousStatus,
        newStatus,
        reason,
        adminId,
      },
    }).catch(() => {});
  }

  return result;
};

/**
 * Update user profile details dynamically by Admin
 */
const updateUserDetails = async (userId, data, adminId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  const { name, email, phone, role, learnerType, studentUsername, status } = data;
  const updates = {};
  const diff = {};

  if (name !== undefined && name !== user.name) {
    updates.name = name;
    diff.name = { previous: user.name, current: name };
  }
  if (email !== undefined && email.trim().toLowerCase() !== (user.email || '')) {
    const normalized = email.trim().toLowerCase();
    const existing = await prisma.user.findUnique({ where: { email: normalized } });
    if (existing && existing.id !== userId) {
      throw { status: 409, message: 'Email is already in use by another user' };
    }
    updates.email = normalized;
    diff.email = { previous: user.email, current: normalized };
  }
  if (phone !== undefined && phone !== user.phone) {
    updates.phone = phone || null;
    diff.phone = { previous: user.phone, current: phone };
  }
  if (role !== undefined && role !== user.role) {
    if (user.role === 'ADMIN' && role !== 'ADMIN') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
      if (adminCount <= 1) {
        throw { status: 409, message: 'Cannot demote the last administrator' };
      }
    }
    updates.role = role;
    updates.tokenVersion = { increment: 1 };
    diff.role = { previous: user.role, current: role };
  }
  if (learnerType !== undefined && learnerType !== user.learnerType) {
    updates.learnerType = learnerType;
    diff.learnerType = { previous: user.learnerType, current: learnerType };
  }
  if (studentUsername !== undefined && studentUsername !== user.studentUsername) {
    updates.studentUsername = studentUsername || null;
    diff.studentUsername = { previous: user.studentUsername, current: studentUsername };
  }
  if (status !== undefined && status !== user.status) {
    if (user.role === 'ADMIN' && status !== 'ACTIVE') {
      const adminCount = await prisma.user.count({ where: { role: 'ADMIN', status: 'ACTIVE' } });
      if (adminCount <= 1) {
        throw { status: 409, message: 'Cannot suspend or ban the last active administrator' };
      }
    }
    updates.status = status;
    if (status !== 'ACTIVE') updates.tokenVersion = { increment: 1 };
    diff.status = { previous: user.status, current: status };
  }

  if (Object.keys(updates).length === 0) {
    return user;
  }

  return await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: updates,
    });

    await tx.userChangeLog.create({
      data: {
        userId,
        changedById: adminId,
        action: 'ADMIN_EDIT',
        details: diff,
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UPDATE_USER_DETAILS',
        targetType: 'User',
        targetId: userId,
        details: { diff, userName: user.name, userEmail: user.email },
      },
    });

    return updated;
  });
};

/**
 * Unlock locked account (reset failed login attempts and lockout timestamp)
 */
const unlockUserAccount = async (userId, adminId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: {
        failedLoginAttempts: 0,
        lockoutUntil: null,
      },
    });

    await tx.userChangeLog.create({
      data: {
        userId,
        changedById: adminId,
        action: 'ACCOUNT_UNLOCKED',
        details: { previousFailedAttempts: user.failedLoginAttempts, previousLockout: user.lockoutUntil },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'UNLOCK_ACCOUNT',
        targetType: 'User',
        targetId: userId,
        details: { userEmail: user.email, userName: user.name },
      },
    });
  });

  return { message: `Account for ${user.name} has been successfully unlocked.` };
};

/**
 * Revoke all active sessions for a user
 */
const revokeUserSessions = async (userId, adminId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { id: userId },
      data: { tokenVersion: { increment: 1 } },
    });

    await tx.userChangeLog.create({
      data: {
        userId,
        changedById: adminId,
        action: 'REVOKE_SESSIONS',
        details: { previousTokenVersion: user.tokenVersion, newTokenVersion: user.tokenVersion + 1 },
      },
    });

    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'REVOKE_USER_SESSIONS',
        targetType: 'User',
        targetId: userId,
        details: { userEmail: user.email, userName: user.name },
      },
    });
  });

  return { message: `All active sessions revoked for ${user.name}. User will be forced to log in again.` };
};

/**
 * Safely delete user with cascade audit
 */
const deleteUserSafely = async (userId, adminId) => {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw { status: 404, message: 'User not found' };

  if (user.role === 'ADMIN') {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } });
    if (adminCount <= 1) {
      throw { status: 409, message: 'The last administrator cannot be deleted.' };
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.adminAuditLog.create({
      data: {
        adminId,
        action: 'DELETE_USER',
        targetType: 'User',
        targetId: userId,
        details: { userName: user.name, userEmail: user.email, role: user.role },
      },
    });

    await tx.user.delete({ where: { id: userId } });
  });

  return { message: `User "${user.name}" (${user.email || user.phone}) was deleted successfully.` };
};

/**
 * Get detailed user profile with login history, change history, and activity stats
 */
const getUserDetail = async (userId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      learnerProfile: true,
      loginAttempts: {
        take: 30,
        orderBy: { createdAt: 'desc' },
      },
      sessionLogs: {
        take: 30,
        orderBy: { loginAt: 'desc' },
      },
      changeLogs: {
        take: 30,
        orderBy: { createdAt: 'desc' },
        include: {
          changedBy: { select: { id: true, name: true, email: true, role: true } },
        },
      },
      _count: {
        select: {
          subjectProgress: true,
          courseProgress: true,
          quizAttempts: true,
          xpTransactions: true,
        },
      },
    },
  });

  if (!user) throw { status: 404, message: 'User not found' };

  const { passwordHash, otpCode, parentLinkCode, ...safeUser } = user;
  return safeUser;
};

/**
 * Get paginated login attempts with search and filters
 */
const getLoginAttempts = async ({ search, status, userId, page = 1, limit = 25 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));

  const where = {};
  if (status) where.status = status;
  if (userId) where.userId = userId;
  if (search) {
    where.OR = [
      { identifier: { contains: search, mode: 'insensitive' } },
      { ipAddress: { contains: search } },
      { failureReason: { contains: search, mode: 'insensitive' } },
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [attempts, total] = await Promise.all([
    prisma.loginAttempt.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true, role: true, status: true },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
    prisma.loginAttempt.count({ where }),
  ]);

  return {
    attempts: attempts.map((att) => ({
      ...att,
      location: resolveIpLocation(att.ipAddress),
    })),
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };
};

/**
 * Get comprehensive login analytics
 */
const getLoginStats = async () => {
  const [
    totalAttempts,
    successfulAttempts,
    failedAttempts,
    blockedAttempts,
    lockedUsersCount,
    topFailedAttempts,
  ] = await Promise.all([
    prisma.loginAttempt.count(),
    prisma.loginAttempt.count({ where: { status: 'SUCCESS' } }),
    prisma.loginAttempt.count({ where: { status: 'FAILED' } }),
    prisma.loginAttempt.count({ where: { status: 'BLOCKED' } }),
    prisma.user.count({ where: { lockoutUntil: { gt: new Date() } } }),
    prisma.loginAttempt.findMany({
      where: { status: { in: ['FAILED', 'BLOCKED'] } },
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { user: { select: { id: true, name: true, email: true } } },
    }),
  ]);

  return {
    total: totalAttempts,
    successful: successfulAttempts,
    failed: failedAttempts,
    blocked: blockedAttempts,
    lockedUsers: lockedUsersCount,
    successRate: totalAttempts > 0 ? Math.round((successfulAttempts / totalAttempts) * 100) : 100,
    recentFailures: topFailedAttempts,
  };
};

/**
 * Get paginated user change audit logs
 */
const getUserChangeLogs = async ({ userId, action, search, page = 1, limit = 25 }) => {
  const parsedPage = Math.max(1, parseInt(page, 10) || 1);
  const parsedLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 25));

  const where = {};
  if (userId) where.userId = userId;
  if (action) where.action = action;
  if (search) {
    where.OR = [
      { user: { name: { contains: search, mode: 'insensitive' } } },
      { user: { email: { contains: search, mode: 'insensitive' } } },
      { action: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.userChangeLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
        changedBy: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (parsedPage - 1) * parsedLimit,
      take: parsedLimit,
    }),
    prisma.userChangeLog.count({ where }),
  ]);

  return {
    logs: logs.map((log) => ({
      ...log,
      location: resolveIpLocation(log.ipAddress),
    })),
    total,
    page: parsedPage,
    totalPages: Math.ceil(total / parsedLimit),
  };
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
  deleteUserSafely,
  getLoginAttempts,
  getLoginStats,
  getUserChangeLogs,
  createOrPublishCourse,
  createCourse: createOrPublishCourse,
  createVerifiedCourse,
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
};

