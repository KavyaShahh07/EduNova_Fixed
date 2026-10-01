import { courseApi, subjectApi } from '../lib/apiClient';

/**
 * Fetch courses exclusively from live PostgreSQL database
 */
export const getCourses = async (learnerType = null, categoryFilter = 'All', searchQuery = '') => {
  try {
    const params = {};
    if (categoryFilter && categoryFilter !== 'All') {
      params.category = categoryFilter;
    }
    if (searchQuery && searchQuery.trim()) {
      params.search = searchQuery.trim();
    }

    const res = await courseApi.getCourses(params);
    const backendCourses = res.data?.courses || (Array.isArray(res.data) ? res.data : []);
    return backendCourses;
  } catch (error) {
    console.error('Failed to fetch courses from PostgreSQL database:', error.message);
    return [];
  }
};

/**
 * Fetch single course details with modules exclusively from PostgreSQL database
 */
export const getCourseById = async (id) => {
  if (!id) return null;

  try {
    const res = await courseApi.getCourse(id);
    if (res && res.data) return res.data;
  } catch (error) {
    console.warn(`Database course fetch for ${id} returned:`, error.message);
  }

  // If not found in courses, query PostgreSQL database for subject by id
  try {
    const subRes = await subjectApi.getSubject(id);
    if (subRes && subRes.data) {
      const liveSubject = subRes.data;
      return {
        id: liveSubject.id,
        title: liveSubject.name,
        category: liveSubject.category || 'Curriculum',
        instructor: liveSubject.createdBy?.name || 'EduNova Faculty',
        rating: 4.9,
        duration: `${liveSubject.topics?.length || 1} Topics`,
        difficulty: 'Standard',
        thumbnail: liveSubject.thumbnail || 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=800&auto=format&fit=crop&q=80',
        description: liveSubject.description || `${liveSubject.name} curriculum modules and assessments.`,
        progress: liveSubject.progress || 0,
        modules: (liveSubject.topics && liveSubject.topics.length > 0)
          ? liveSubject.topics.map((t, idx) => ({
              id: t.id || `m_${idx}`,
              title: t.title || t.name,
              duration: '45 mins',
              order: t.order || (idx + 1)
            }))
          : [
              { id: `${liveSubject.id}_m1`, title: `${liveSubject.name}: Core Concepts`, duration: '45 mins', order: 1 }
            ]
      };
    }
  } catch (subErr) {
    console.warn(`Database subject fallback for ${id} returned:`, subErr.message);
  }

  return null;
};

/**
 * Mark a course module as completed (atomic transaction awarding XP)
 */
export const completeCourseModule = async (courseId, moduleId) => {
  try {
    const res = await courseApi.completeModule(courseId, moduleId);
    return res.data || null;
  } catch (error) {
    console.error('Failed to complete module:', error.message);
    throw error;
  }
};

/**
 * Fetch courses the student is enrolled in
 */
export const getMyEnrolledCourses = async () => {
  try {
    const res = await courseApi.getMyEnrolled();
    return res.data || [];
  } catch (error) {
    return [];
  }
};

/**
 * Enroll student in course
 */
export const enrollInCourse = async (courseId) => {
  try {
    const res = await courseApi.enrollCourse(courseId);
    return res.data || null;
  } catch (error) {
    throw error;
  }
};
