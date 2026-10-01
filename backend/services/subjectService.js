const prisma = require('../config/db');

/**
 * Get all subjects with optional curriculum filters
 */
const getSubjects = async ({
  educationType,
  board,
  className,
  class: classAlt,
  degree,
  branch,
  semester,
  exam,
  category,
  search,
  page,
  limit,
  sortBy = 'name',
  sortOrder = 'asc'
}) => {
  const targetClass = className || classAlt;
  const where = {};

  if (educationType) where.educationType = educationType.toUpperCase();
  if (board) where.board = board;
  if (targetClass) where.class = targetClass;
  if (degree) where.degree = degree;
  if (branch) where.branch = branch;
  if (semester) where.semester = String(semester);
  if (exam) where.exam = exam;
  if (category) where.category = { contains: category, mode: 'insensitive' };
  
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { category: { contains: search, mode: 'insensitive' } },
    ];
  }

  const allowedSortFields = ['name', 'createdAt', 'code', 'category', 'educationType'];
  const validSortField = allowedSortFields.includes(sortBy) ? sortBy : 'name';
  const validSortOrder = sortOrder?.toLowerCase() === 'desc' ? 'desc' : 'asc';
  const orderBy = { [validSortField]: validSortOrder };

  const parsedPage = page ? Math.max(1, parseInt(page, 10) || 1) : null;
  const parsedLimit = limit ? Math.min(100, Math.max(1, parseInt(limit, 10) || 20)) : null;

  if (parsedPage && parsedLimit) {
    const [subjects, total] = await Promise.all([
      prisma.subject.findMany({
        where,
        include: {
          topics: { orderBy: { order: 'asc' } },
          _count: { select: { progress: true } },
        },
        orderBy,
        skip: (parsedPage - 1) * parsedLimit,
        take: parsedLimit,
      }),
      prisma.subject.count({ where }),
    ]);

    return {
      subjects,
      total,
      page: parsedPage,
      limit: parsedLimit,
      totalPages: Math.ceil(total / parsedLimit),
    };
  }

  let subjects = await prisma.subject.findMany({
    where,
    include: {
      topics: { orderBy: { order: 'asc' } },
      _count: { select: { progress: true } },
    },
    orderBy,
    take: 100,
  });

  // Fallback 1: If strict filters (class, board, degree, etc.) match 0 items, fallback to educationType
  if (subjects.length === 0 && where.educationType) {
    subjects = await prisma.subject.findMany({
      where: { educationType: where.educationType },
      include: {
        topics: { orderBy: { order: 'asc' } },
        _count: { select: { progress: true } },
      },
      orderBy,
      take: 100,
    });
  }

  // Fallback 2: If still 0 items, return all subjects
  if (subjects.length === 0) {
    subjects = await prisma.subject.findMany({
      include: {
        topics: { orderBy: { order: 'asc' } },
        _count: { select: { progress: true } },
      },
      orderBy,
      take: 100,
    });
  }

  return subjects;
};

/**
 * Get single subject with topics
 */
const getSubjectById = async (subjectId) => {
  const subject = await prisma.subject.findUnique({
    where: { id: subjectId },
    include: {
      topics: { orderBy: { order: 'asc' } },
      createdBy: { select: { id: true, name: true } },
      _count: { select: { progress: true } },
    },
  });

  if (!subject) throw { status: 404, message: 'Subject not found' };
  return subject;
};

/**
 * Create a subject (Admin/Instructor)
 */
const createSubject = async (data, createdById) => {
  const { name, category, educationType, className, class: classAlt, board, degree, branch, semester, exam, topics } = data;

  const subject = await prisma.subject.create({
    data: {
      name,
      category,
      educationType: educationType ? educationType.toUpperCase() : 'SCHOOL',
      class: className || classAlt || null,
      board: board || null,
      degree: degree || null,
      branch: branch || null,
      semester: semester ? String(semester) : null,
      exam: exam || null,
      createdById,
      ...(topics && topics.length > 0 && {
        topics: {
          create: topics.map((t, i) => ({
            title: t.title || t.name,
            order: t.order || i + 1,
          })),
        },
      }),
    },
    include: { topics: true },
  });

  if (createdById) {
    try {
      await prisma.studentSubjectProgress.upsert({
        where: { userId_subjectId: { userId: createdById, subjectId: subject.id } },
        update: {},
        create: {
          userId: createdById,
          subjectId: subject.id,
          progress: 0,
          targetScore: 80,
          syllabusCoverage: 0,
        },
      });
    } catch (e) {
      console.warn('Auto-enroll on subject creation skipped:', e.message);
    }
  }

  return subject;
};

/**
 * Update a subject
 */
const updateSubject = async (subjectId, data) => {
  const { name, category, educationType, className, class: classAlt, board, degree, branch, semester, exam } = data;

  const subject = await prisma.subject.update({
    where: { id: subjectId },
    data: {
      ...(name && { name }),
      ...(category && { category }),
      ...(educationType && { educationType }),
      ...((className !== undefined || classAlt !== undefined) && { class: className || classAlt }),
      ...(board !== undefined && { board }),
      ...(degree !== undefined && { degree }),
      ...(branch !== undefined && { branch }),
      ...(semester !== undefined && { semester: String(semester) }),
      ...(exam !== undefined && { exam }),
    },
    include: { topics: { orderBy: { order: 'asc' } } },
  });

  if (topics && Array.isArray(topics)) {
    await prisma.topic.deleteMany({ where: { subjectId } });
    if (topics.length > 0) {
      await prisma.topic.createMany({
        data: topics.map((t, i) => ({
          subjectId,
          title: typeof t === 'string' ? t : (t.title || t.name),
          order: t.order || i + 1,
        })),
      });
    }
    return prisma.subject.findUnique({
      where: { id: subjectId },
      include: { topics: { orderBy: { order: 'asc' } } },
    });
  }

  return subject;
};

/**
 * Delete a subject
 */
const deleteSubject = async (subjectId) => {
  await prisma.subject.delete({ where: { id: subjectId } });
  return { message: 'Subject deleted successfully' };
};

/**
 * Add topic to a subject
 */
const addTopic = async (subjectId, { title, order }) => {
  // Get max order if not provided
  if (!order) {
    const maxTopic = await prisma.topic.findFirst({
      where: { subjectId },
      orderBy: { order: 'desc' },
    });
    order = (maxTopic?.order || 0) + 1;
  }

  const topic = await prisma.topic.create({
    data: { subjectId, title, order },
  });

  return topic;
};

/**
 * Delete a topic
 */
const deleteTopic = async (topicId) => {
  await prisma.topic.delete({ where: { id: topicId } });
  return { message: 'Topic deleted successfully' };
};

/**
 * Select/enroll a subject for a student (links to dashboard)
 */
const selectSubject = async (userId, subjectId) => {
  let subject = await prisma.subject.findUnique({ where: { id: subjectId } });

  if (!subject) {
    const idMap = {
      'sch_math_10': 'Mathematics',
      'sch_physics_10': 'Physics',
      'sch_chem_10': 'Chemistry',
      'sch_bio_10': 'Biology',
      'sch_eng_10': 'English',
      'sch_sst_10': 'Social Science',
      'sch_cs_10': 'Computer Applications',
      'col_dbms_sem5': 'Database Management Systems',
      'col_os_sem5': 'Operating Systems',
      'col_cn_sem5': 'Computer Networks',
      'col_dsa_sem5': 'Data Structures',
      'col_web_sem5': 'Web Engineering',
      'col_se_sem5': 'Software Engineering',
      'exm_quant': 'Quantitative',
      'exm_reasoning': 'Logical Reasoning',
      'exm_english': 'Language',
      'exm_gk': 'General Awareness',
      'skl_fullstack': 'Full Stack',
      'skl_uiux': 'UI/UX',
      'skl_backend': 'Backend Systems',
      'skl_devops': 'DevOps'
    };

    const targetKeyword = idMap[subjectId] || subjectId.replace(/^(sch_|col_|exm_|skl_)/, '').replace(/_\d+$/, '');
    
    subject = await prisma.subject.findFirst({
      where: { name: { contains: targetKeyword, mode: 'insensitive' } }
    });
  }

  if (!subject) {
    // Dynamically auto-create subject record if it does not exist yet
    const creator = await prisma.user.findFirst({ where: { role: { in: ['ADMIN', 'INSTRUCTOR'] } } });
    const createdById = creator ? creator.id : userId;

    try {
      subject = await prisma.subject.create({
        data: {
          id: subjectId,
          name: subjectId.replace(/_/g, ' ').toUpperCase(),
          category: 'General',
          educationType: 'SCHOOL',
          createdById,
        }
      });
    } catch (e) {
      subject = await prisma.subject.findFirst();
    }
  }

  if (!subject) {
    return { success: true, message: 'Subject selected locally' };
  }

  // Safe Find & Update/Create for StudentSubjectProgress to eliminate unique constraint errors
  const existingProgress = await prisma.studentSubjectProgress.findUnique({
    where: { userId_subjectId: { userId, subjectId: subject.id } }
  });

  if (existingProgress) {
    const updated = await prisma.studentSubjectProgress.update({
      where: { id: existingProgress.id },
      data: { updatedAt: new Date() },
      include: {
        subject: {
          include: { topics: { orderBy: { order: 'asc' } } },
        },
      },
    });
    return updated;
  }

  try {
    const progress = await prisma.studentSubjectProgress.create({
      data: {
        userId,
        subjectId: subject.id,
        progress: 0,
        targetScore: 80,
        syllabusCoverage: 0,
      },
      include: {
        subject: {
          include: { topics: { orderBy: { order: 'asc' } } },
        },
      },
    });

    return progress;
  } catch (error) {
    if (error.code === 'P2002') {
      const existing = await prisma.studentSubjectProgress.findUnique({
        where: { userId_subjectId: { userId, subjectId: subject.id } },
        include: {
          subject: {
            include: { topics: { orderBy: { order: 'asc' } } },
          },
        },
      });
      if (existing) return existing;
    }
    throw error;
  }
};

/**
 * Update subject progress, syllabus coverage, and weak topics atomically
 */
const updateProgressAndWeakTopics = async (userId, subjectId, data) => {
  const { progress, syllabusCoverage, targetScore, weakTopics } = data;

  const result = await prisma.$transaction(async (tx) => {
    // 1. Update StudentSubjectProgress
    const updatedProgress = await tx.studentSubjectProgress.upsert({
      where: { userId_subjectId: { userId, subjectId } },
      update: {
        updatedAt: new Date(),
        ...(progress !== undefined && { progress }),
        ...(syllabusCoverage !== undefined && { syllabusCoverage }),
        ...(targetScore !== undefined && { targetScore }),
      },
      create: {
        userId,
        subjectId,
        progress: progress || 0,
        syllabusCoverage: syllabusCoverage || 0,
        targetScore: targetScore || 80,
      },
      include: { subject: true },
    });

    // 2. If weakTopics provided, update LearnerProfile
    let updatedProfile = null;
    if (weakTopics && Array.isArray(weakTopics)) {
      const currentProfile = await tx.learnerProfile.findUnique({ where: { userId } });
      if (currentProfile) {
        // Merge and deduplicate weak topics
        const mergedWeakTopics = Array.from(new Set([...currentProfile.weakTopics, ...weakTopics]));
        updatedProfile = await tx.learnerProfile.update({
          where: { userId },
          data: { weakTopics: mergedWeakTopics },
        });
      }
    }

    return {
      progress: updatedProgress,
      weakTopics: updatedProfile?.weakTopics,
    };
  });

  return result;
};

/**
 * Get all subjects enrolled by a student
 */
const getEnrolledSubjects = async (userId) => {
  const enrollments = await prisma.studentSubjectProgress.findMany({
    where: { userId },
    include: {
      subject: {
        include: {
          topics: { orderBy: { order: 'asc' } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });
  return enrollments;
};

/**
 * Unenroll / remove subject from dashboard
 */
const unenrollSubject = async (userId, subjectId) => {
  await prisma.studentSubjectProgress.deleteMany({
    where: { userId, subjectId },
  });
  return { message: 'Subject unenrolled successfully' };
};

module.exports = {
  getSubjects, getSubjectById, createSubject, updateSubject, deleteSubject,
  addTopic, deleteTopic, selectSubject, updateProgressAndWeakTopics,
  getEnrolledSubjects, unenrollSubject,
};

