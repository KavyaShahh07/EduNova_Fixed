import { useState, useEffect, useCallback } from 'react';
import { useLearner } from '../context/LearnerContext';
import { useAuth } from '../context/AuthContext';
import { subjectService } from '../services/subjectService';
import { subjectApi } from '../lib/apiClient';
export const useSubjects = () => {
  const { learnerType } = useLearner();
  const { user } = useAuth();
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [availableSubjects, setAvailableSubjects] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLiveEnrolled = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await subjectApi.getEnrolledSubjects();
      const currentLearnerType = (learnerType || user?.learnerType || 'school').toLowerCase();

      if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
        const enrolled = res.data.map((item) => {
          const sid = item.subject?.id || item.subjectId;
          const sName = item.subject?.name || 'Subject';

          return {
            id: sid,
            name: sName,
            category: item.subject?.category || 'General',
            educationType: (item.subject?.educationType || currentLearnerType).toLowerCase(),
            track: (item.subject?.educationType || currentLearnerType).toLowerCase(),
            progress: typeof item.progress === 'number' ? item.progress : 0,
            targetScore: item.targetScore || 80,
            syllabusCoverage: item.syllabusCoverage || 0,
            topics: (item.subject?.topics && item.subject.topics.length > 0) ? item.subject.topics : [],
            color: item.subject?.color || '#6366f1',
            icon: item.subject?.icon || '📚',
            score: Math.round(((item.progress || 0) / 100) * 80),
            total: 80,
            ...item.subject
          };
        });

        setSelectedSubjects(enrolled);
        subjectService.saveSubjects(enrolled);
      } else {
        setSelectedSubjects([]);
      }
    } catch (err) {
      console.warn('Unable to fetch enrolled subjects from DB:', err.message);
      setSelectedSubjects([]);
    } finally {
      setLoading(false);
    }
  }, [user, learnerType]);

  const fetchLiveAvailable = useCallback(async () => {
    try {
      const res = await subjectApi.getSubjects();
      const raw = Array.isArray(res?.data) ? res.data : (res?.data?.subjects || []);
      
      if (raw.length > 0) {
        const list = raw.map((s) => ({
          id: s.id,
          name: s.name,
          category: s.category || 'General',
          educationType: (s.educationType || 'school').toLowerCase(),
          track: (s.educationType || 'school').toLowerCase(),
          class: s.className || s.class,
          board: s.board,
          topics: (s.topics && s.topics.length > 0) ? s.topics : [],
          description: s.description,
          createdById: s.createdById,
          ...s
        }));
        setAvailableSubjects(list);
      } else {
        setAvailableSubjects([
          { id: 'sch_math_10', name: 'Mathematics', category: 'Mathematics', educationType: 'school', track: 'school' },
          { id: 'sch_physics_10', name: 'Physics (Science)', category: 'Science', educationType: 'school', track: 'school' },
          { id: 'sch_chem_10', name: 'Chemistry (Science)', category: 'Science', educationType: 'school', track: 'school' },
          { id: 'sch_bio_10', name: 'Biology (Science)', category: 'Science', educationType: 'school', track: 'school' },
          { id: 'col_dsa_sem5', name: 'Data Structures & Algorithms', category: 'Computer Science', educationType: 'college', track: 'college' },
          { id: 'col_dbms_sem5', name: 'Database Management Systems', category: 'Computer Science', educationType: 'college', track: 'college' },
          { id: 'skl_fullstack', name: 'Full Stack Web Development', category: 'Development', educationType: 'skills', track: 'skills' },
          { id: 'exm_jee_phys', name: 'JEE Physics Mechanics', category: 'Science', educationType: 'exam', track: 'exam' }
        ]);
      }
    } catch (err) {
      setAvailableSubjects([
        { id: 'sch_math_10', name: 'Mathematics', category: 'Mathematics', educationType: 'school', track: 'school' },
        { id: 'sch_physics_10', name: 'Physics (Science)', category: 'Science', educationType: 'school', track: 'school' },
        { id: 'sch_chem_10', name: 'Chemistry (Science)', category: 'Science', educationType: 'school', track: 'school' },
        { id: 'sch_bio_10', name: 'Biology (Science)', category: 'Science', educationType: 'school', track: 'school' }
      ]);
    }
  }, []);

  useEffect(() => {
    fetchLiveEnrolled();
    fetchLiveAvailable();
  }, [fetchLiveEnrolled, fetchLiveAvailable]);

  useEffect(() => {
    const handleUpdate = () => {
      fetchLiveEnrolled();
      fetchLiveAvailable();
    };
    window.addEventListener('edunova_curriculum_updated', handleUpdate);
    window.addEventListener('edunova_subject_updated', handleUpdate);
    window.addEventListener('edunova_quiz_updated', handleUpdate);
    return () => {
      window.removeEventListener('edunova_curriculum_updated', handleUpdate);
      window.removeEventListener('edunova_subject_updated', handleUpdate);
      window.removeEventListener('edunova_quiz_updated', handleUpdate);
    };
  }, [fetchLiveEnrolled, fetchLiveAvailable]);

  useEffect(() => {
    const unsub = subjectService.subscribe((updated) => {
      setSelectedSubjects(updated);
    });
    return unsub;
  }, []);

  const addSubject = async (subjectId) => {
    subjectService.addSubject(subjectId);
    try {
      await subjectApi.selectSubject(subjectId);
      await fetchLiveEnrolled();
    } catch (e) {
      console.warn('Subject API selection sync warning:', e.message);
    }
  };

  const removeSubject = async (subjectId) => {
    subjectService.removeSubject(subjectId);
    try {
      await subjectApi.unenrollSubject(subjectId);
      await fetchLiveEnrolled();
    } catch (e) {
      console.warn('Subject API unenrollment sync warning:', e.message);
    }
  };

  const updateSubjectConfig = async (subjectId, updates) => {
    subjectService.updateSubjectConfig(subjectId, updates);
    try {
      await subjectApi.updateProgress(subjectId, updates);
      await fetchLiveEnrolled();
    } catch (e) {
      console.warn('Subject progress update backend error:', e.message);
    }
  };

  const refreshSubjects = useCallback(async () => {
    await Promise.allSettled([fetchLiveEnrolled(), fetchLiveAvailable()]);
  }, [fetchLiveEnrolled, fetchLiveAvailable]);

  return {
    selectedSubjects,
    availableSubjects,
    addSubject,
    removeSubject,
    updateSubjectConfig,
    refreshSubjects,
    loading
  };
};

export default useSubjects;
