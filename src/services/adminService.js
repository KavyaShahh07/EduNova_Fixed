import { adminApi } from '../lib/apiClient';

export const createSubject = (data) => adminApi.createSubject(data);
export const updateSubject = (id, data) => adminApi.updateSubject(id, data);
export const deleteSubject = (id) => adminApi.deleteSubject(id);

export const addTopic = (subjectId, data) => adminApi.addTopic(subjectId, data);
export const deleteTopic = (topicId) => adminApi.deleteTopic(topicId);

export const createCourse = (data) => adminApi.createCourse(data);
export const updateCourse = (id, data) => adminApi.updateCourse(id, data);
export const deleteCourse = (id) => adminApi.deleteCourse(id);

export const addModule = (courseId, data) => adminApi.addModule(courseId, data);
export const deleteModule = (moduleId) => adminApi.deleteModule(moduleId);

export const getQuizzes = (params) => adminApi.getQuizzes(params);
export const createQuiz = (data) => adminApi.createQuiz(data);
export const addQuestion = (quizId, data) => adminApi.addQuestion(quizId, data);
export const deleteQuiz = (id) => adminApi.deleteQuiz(id);
export const deleteQuizQuestion = (questionId) => adminApi.deleteQuizQuestion(questionId);

export const getMissions = (params) => adminApi.getMissions(params);
export const createMission = (data) => adminApi.createMission(data);
export const updateMission = (id, data) => adminApi.updateMission(id, data);
export const deleteMission = (id) => adminApi.deleteMission(id);

export const adminService = {
  ...adminApi,
  createSubject,
  updateSubject,
  deleteSubject,
  addTopic,
  deleteTopic,
  createCourse,
  updateCourse,
  deleteCourse,
  addModule,
  deleteModule,
  getQuizzes,
  createQuiz,
  addQuestion,
  deleteQuiz,
  deleteQuizQuestion,
  getMissions,
  createMission,
  updateMission,
  deleteMission,
};

export default adminService;
