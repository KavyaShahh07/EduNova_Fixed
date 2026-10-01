import React, { useState, useEffect } from 'react';
import { X, BookOpen, Plus, Trash2, Sparkles, AlertTriangle, CheckCircle2, GraduationCap, School, Code2, Award, Wand2, Info } from 'lucide-react';
import { subjectApi, showToast } from '../../lib/apiClient';
import { subjectService } from '../../services/subjectService';
import { useTheme } from '../../context/ThemeContext';

const ACCENT_COLORS = [
  { label: 'Cyan Glow', value: '#38bdf8' },
  { label: 'Indigo Neon', value: '#6366f1' },
  { label: 'Emerald Mint', value: '#10b981' },
  { label: 'Violet Aura', value: '#a855f7' },
  { label: 'Rose Pink', value: '#f43f5e' },
  { label: 'Amber Gold', value: '#f59e0b' }
];

const TRACKS = [
  { id: 'COLLEGE', label: 'College / Degree', icon: GraduationCap, sub: 'B.Tech, BCA, Semester syllabus', color: '#6366f1', category: 'Computer Science' },
  { id: 'SCHOOL', label: 'School / Board', icon: School, sub: 'Class 10/12 CBSE, ICSE, State', color: '#38bdf8', category: 'Science & Mathematics' },
  { id: 'SKILLS', label: 'Skills & Career', icon: Code2, sub: 'Full Stack, AI, Systems engineering', color: '#10b981', category: 'Software Development & AI' },
  { id: 'EXAM', label: 'Competitive Exam', icon: Award, sub: 'GATE, CMAT, CAT, JEE Prep', color: '#f59e0b', category: 'Competitive Exam Prep' }
];

const SUGGESTED_SYLLABUS = {
  COLLEGE: [
    'Data Structures & Algorithms',
    'Object-Oriented Programming (C++/Java)',
    'Database Management Systems & SQL',
    'Operating System Architecture & Threads',
    'Computer Networks & HTTP Protocols',
    'Software Engineering & System Design'
  ],
  SCHOOL: [
    'Real Numbers & Algebra Foundations',
    'Force, Motion & Gravitation Laws',
    'Chemical Reactions & Periodic Table',
    'Cell Biology & Life Processes',
    'Coordinate Geometry & Trigonometry',
    'Electricity, Circuits & Magnetism'
  ],
  SKILLS: [
    'Core Syntax & ES6+/Modern Foundations',
    'Full-Stack Component Architecture',
    'Backend API Design & Database Integration',
    'Authentication, JWT & Security Protocols',
    'Cloud Deployment, CI/CD & DevOps Pipeline',
    'System Optimization & Production Monitoring'
  ],
  EXAM: [
    'Core Conceptual Foundations & Derivations',
    'High-Yield Formulae & Problem Patterns',
    'Speed Drills & PYQ Solving Strategies',
    'Mock Test Drills & Time Management',
    'Advanced Analytics & Error Auditing',
    'Final Rapid Revision & Flashcards'
  ]
};

export const CreateSubjectModal = ({
  isOpen,
  onClose,
  onSubjectCreated,
  onSuccess,
  editSubject = null,
  editingSubject = null,
  defaultEducationType = 'COLLEGE'
}) => {
  const activeSubject = editingSubject || editSubject;
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [name, setName] = useState(activeSubject?.name || '');
  const [category, setCategory] = useState(activeSubject?.category || 'Computer Science');
  const [educationType, setEducationType] = useState(activeSubject?.educationType || defaultEducationType || 'COLLEGE');
  const [color, setColor] = useState(activeSubject?.color || '#38bdf8');
  
  // Track-specific fields
  const [degree, setDegree] = useState(activeSubject?.degree || 'B.Tech');
  const [branch, setBranch] = useState(activeSubject?.branch || 'Computer Science');
  const [semester, setSemester] = useState(activeSubject?.semester || '5');
  const [board, setBoard] = useState(activeSubject?.board || 'CBSE');
  const [gradeClass, setGradeClass] = useState(activeSubject?.class || '10');
  const [exam, setExam] = useState(activeSubject?.exam || 'GATE 2026');
  const [skillDomain, setSkillDomain] = useState(activeSubject?.branch || 'Full-Stack Web Development');
  const [skillLevel, setSkillLevel] = useState(activeSubject?.degree || 'Intermediate');
  
  const [description, setDescription] = useState(activeSubject?.description || '');
  const [topics, setTopics] = useState(
    Array.isArray(activeSubject?.topics) && activeSubject.topics.length > 0
      ? activeSubject.topics.map(t => (typeof t === 'string' ? t : t.title || t.name || ''))
      : []
  );
  const [newTopicInput, setNewTopicInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (activeSubject) {
      setName(activeSubject.name || '');
      setCategory(activeSubject.category || 'Computer Science');
      setEducationType(activeSubject.educationType || defaultEducationType || 'COLLEGE');
      setColor(activeSubject.color || '#38bdf8');
      setDegree(activeSubject.degree || 'B.Tech');
      setBranch(activeSubject.branch || 'Computer Science');
      setSemester(activeSubject.semester || '5');
      setBoard(activeSubject.board || 'CBSE');
      setGradeClass(activeSubject.class || '10');
      setExam(activeSubject.exam || 'GATE 2026');
      setSkillDomain(activeSubject.branch || 'Full-Stack Web Development');
      setSkillLevel(activeSubject.degree || 'Intermediate');
      setDescription(activeSubject.description || '');
      setTopics(
        Array.isArray(activeSubject.topics)
          ? activeSubject.topics.map(t => (typeof t === 'string' ? t : t.title || t.name || ''))
          : []
      );
    } else if (defaultEducationType) {
      setEducationType(defaultEducationType.toUpperCase());
    }
  }, [activeSubject, defaultEducationType]);

  if (!isOpen) return null;

  const handleTrackChange = (trackId) => {
    setEducationType(trackId);
    const matchedTrack = TRACKS.find(t => t.id === trackId);
    if (matchedTrack && !activeSubject) {
      setColor(matchedTrack.color);
      if (!name) {
        setCategory(matchedTrack.category);
      }
    }
  };

  const handleAddTopic = () => {
    const val = newTopicInput.trim();
    if (!val) return;
    if (topics.includes(val)) {
      showToast('This topic is already added', 'error');
      return;
    }
    setTopics([...topics, val]);
    setNewTopicInput('');
  };

  const handleRemoveTopic = (index) => {
    setTopics(topics.filter((_, idx) => idx !== index));
  };

  const handleAutoSuggestSyllabus = () => {
    const suggestions = SUGGESTED_SYLLABUS[educationType] || SUGGESTED_SYLLABUS.COLLEGE;
    const combined = Array.from(new Set([...topics, ...suggestions]));
    setTopics(combined);
    showToast(`Appended standard ${educationType} syllabus topics!`, 'success');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a subject name.');
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      name: name.trim(),
      category: category.trim() || 'General',
      educationType: educationType.toUpperCase(),
      color,
      description: description.trim() || undefined,
      ...(educationType === 'COLLEGE' && { degree: degree.trim(), branch: branch.trim(), semester: String(semester) }),
      ...(educationType === 'SCHOOL' && { board: board.trim(), class: String(gradeClass) }),
      ...(educationType === 'SKILLS' && { branch: skillDomain.trim(), degree: skillLevel.trim() }),
      ...(educationType === 'EXAM' && { exam: exam.trim() }),
      topics: topics.map((t, idx) => ({ title: t, order: idx + 1 }))
    };

    try {
      let result;
      if (activeSubject?.id) {
        result = await subjectApi.updateSubject(activeSubject.id, payload);
        showToast(`Subject "${name}" updated successfully!`, 'success');
      } else {
        result = await subjectApi.createSubject(payload);
        showToast(`Subject "${name}" created in database!`, 'success');
      }

      if (result?.data) {
        try {
          subjectService.addSubject(result.data.id, result.data);
        } catch (e) {}
        window.dispatchEvent(new CustomEvent('edunova_subject_updated', { detail: result.data }));
        window.dispatchEvent(new Event('edunova_curriculum_updated'));
      }

      if (onSubjectCreated) onSubjectCreated(result?.data);
      if (onSuccess) onSuccess(result?.data);
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save subject. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 22, 0.82)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '16px'
    }}>
      <div style={{
        background: isLight
          ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(244, 248, 255, 0.96) 100%)'
          : 'linear-gradient(135deg, rgba(22, 30, 68, 0.95) 0%, rgba(13, 18, 44, 0.98) 100%)',
        borderRadius: '28px',
        border: isLight ? '1.5px solid rgba(210, 230, 255, 0.95)' : '1px solid rgba(255, 255, 255, 0.18)',
        width: '100%',
        maxWidth: '720px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: isLight
          ? '0 25px 70px rgba(50, 90, 160, 0.22), 0 0 0 1px rgba(255, 255, 255, 0.9)'
          : '0 30px 80px rgba(0, 0, 0, 0.75), inset 0 1px 2px rgba(255, 255, 255, 0.25)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.16), rgba(99, 102, 241, 0.16))',
              border: '1px solid rgba(56, 189, 248, 0.35)',
              fontSize: '0.74rem',
              fontWeight: 800,
              color: '#38bdf8',
              letterSpacing: '0.4px',
              marginBottom: '6px'
            }}>
              <Sparkles size={13} color="#38bdf8" /> Real Database Curriculum Engine
            </div>
            <h2 style={{ fontSize: '1.45rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0, letterSpacing: '-0.02em' }}>
              {activeSubject ? 'Edit Subject Details' : 'Create New Student Subject'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '0.84rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Define your custom subject syllabus, academic track, and learning topics with PostgreSQL persistence.
            </p>
          </div>

          <button
            onClick={onClose}
            aria-label="Close"
            style={{
              background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.08)',
              border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#334155' : '#ffffff',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '12px 16px',
            borderRadius: '14px',
            color: '#ef4444',
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontWeight: 600
          }}>
            <AlertTriangle size={16} flexShrink={0} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Track Selector Cards */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '8px' }}>
              Select Academic Track *
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(125px, 1fr))', gap: '8px', boxSizing: 'border-box', width: '100%' }}>
              {TRACKS.map(t => {
                const isSelected = educationType === t.id;
                const IconComponent = t.icon;
                return (
                  <div
                    key={t.id}
                    onClick={() => handleTrackChange(t.id)}
                    style={{
                      padding: '10px 12px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: isSelected
                        ? (isLight ? 'linear-gradient(135deg, rgba(56, 189, 248, 0.18), rgba(99, 102, 241, 0.18))' : 'linear-gradient(135deg, rgba(56, 189, 248, 0.22), rgba(99, 102, 241, 0.25))')
                        : (isLight ? 'rgba(240, 246, 255, 0.7)' : 'rgba(255, 255, 255, 0.04)'),
                      border: isSelected
                        ? `2px solid ${t.color}`
                        : (isLight ? '1px solid rgba(210, 225, 250, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)'),
                      boxShadow: isSelected ? `0 4px 18px ${t.color}33` : 'none',
                      transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px',
                      boxSizing: 'border-box',
                      minWidth: 0
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <IconComponent size={17} color={isSelected ? t.color : (isLight ? '#64748b' : '#94a3b8')} />
                      {isSelected && <CheckCircle2 size={14} color={t.color} />}
                    </div>
                    <strong style={{ fontSize: '0.82rem', color: isSelected ? (isLight ? '#0f172a' : '#ffffff') : (isLight ? '#334155' : '#cbd5e1'), whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {t.label}
                    </strong>
                    <span style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', lineHeight: 1.25, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {t.sub}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Subject Name & Category */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Subject Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Distributed Database Systems, Organic Chemistry"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '14px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                  border: isLight ? '1.5px solid rgba(200, 220, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Discipline / Category *
              </label>
              <input
                type="text"
                placeholder="e.g. Computer Science, Mathematics, Science"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: '14px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                  border: isLight ? '1.5px solid rgba(200, 220, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.9rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          {/* Dynamic Track-Specific Details */}
          {educationType === 'COLLEGE' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Degree</label>
                <input
                  type="text"
                  placeholder="e.g. B.Tech"
                  value={degree}
                  onChange={(e) => setDegree(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Branch / Specialization</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Science"
                  value={branch}
                  onChange={(e) => setBranch(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Semester</label>
                <input
                  type="text"
                  placeholder="e.g. 5"
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {educationType === 'SCHOOL' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Board</label>
                <input
                  type="text"
                  placeholder="e.g. CBSE / ICSE / State Board"
                  value={board}
                  onChange={(e) => setBoard(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Grade / Class</label>
                <input
                  type="text"
                  placeholder="e.g. 10 or 12"
                  value={gradeClass}
                  onChange={(e) => setGradeClass(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {educationType === 'SKILLS' && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Skill Domain / Field</label>
                <input
                  type="text"
                  placeholder="e.g. Full-Stack Web Development"
                  value={skillDomain}
                  onChange={(e) => setSkillDomain(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Target Level</label>
                <input
                  type="text"
                  placeholder="e.g. Intermediate / Production Standard"
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
                />
              </div>
            </div>
          )}

          {educationType === 'EXAM' && (
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', marginBottom: '4px' }}>Target Exam Name</label>
              <input
                type="text"
                placeholder="e.g. GATE 2026, CMAT, JEE Mains, CAT"
                value={exam}
                onChange={(e) => setExam(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '12px', background: isLight ? '#fff' : 'rgba(15, 23, 42, 0.8)', border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)', color: isLight ? '#0f172a' : '#ffffff', fontSize: '0.85rem', boxSizing: 'border-box' }}
              />
            </div>
          )}

          {/* Accent Glow Palette */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Subject Card Glow Accent
            </label>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {ACCENT_COLORS.map(c => {
                const isSelected = color === c.value;
                return (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setColor(c.value)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 12px',
                      borderRadius: '10px',
                      background: isSelected
                        ? `${c.value}26`
                        : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.05)'),
                      border: isSelected ? `2px solid ${c.value}` : '1px solid transparent',
                      cursor: 'pointer',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: isLight ? '#334155' : '#e2e8f0',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    <span style={{ width: '12px', height: '12px', borderRadius: '50%', background: c.value, display: 'inline-block', boxShadow: `0 0 8px ${c.value}` }} />
                    {c.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Overview Description */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Subject Overview & Academic Objectives
            </label>
            <textarea
              placeholder="Outline what this subject covers, core derivations, and target exam outcomes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '14px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                border: isLight ? '1.5px solid rgba(200, 220, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Syllabus Topics Builder */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1' }}>
                Curriculum Chapters / Topics ({topics.length})
              </label>
              <button
                type="button"
                onClick={handleAutoSuggestSyllabus}
                style={{
                  background: 'rgba(56, 189, 248, 0.12)',
                  border: '1px solid rgba(56, 189, 248, 0.3)',
                  color: '#38bdf8',
                  borderRadius: '8px',
                  padding: '3px 10px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Wand2 size={12} /> Auto-Suggest Syllabus
              </button>
            </div>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Type chapter or topic name (e.g. Memory Management, Ray Optics)..."
                value={newTopicInput}
                onChange={(e) => setNewTopicInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddTopic(); } }}
                style={{
                  flex: 1,
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
                  border: isLight ? '1.5px solid rgba(200, 220, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.86rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddTopic}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                  color: '#ffffff',
                  border: 'none',
                  fontWeight: 800,
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(2, 132, 199, 0.3)'
                }}
              >
                <Plus size={15} /> Add Topic
              </button>
            </div>

            {topics.length === 0 ? (
              <div style={{
                padding: '18px',
                borderRadius: '12px',
                background: isLight ? 'rgba(240, 246, 255, 0.6)' : 'rgba(255, 255, 255, 0.03)',
                border: isLight ? '1px dashed rgba(200, 218, 240, 0.8)' : '1px dashed rgba(255, 255, 255, 0.12)',
                textAlign: 'center',
                color: isLight ? '#64748b' : '#94a3b8',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div>No chapters added yet. Type a chapter title above or click <strong>Auto-Suggest Syllabus</strong>.</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto', paddingRight: '4px' }}>
                {topics.map((top, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px 14px',
                      borderRadius: '10px',
                      background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.05)',
                      border: isLight ? '1px solid rgba(210, 225, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)',
                      boxShadow: isLight ? '0 2px 8px rgba(100, 130, 180, 0.05)' : 'none'
                    }}
                  >
                    <span style={{ fontSize: '0.86rem', color: isLight ? '#18345F' : '#ffffff', fontWeight: 600 }}>
                      <strong style={{ color: color, marginRight: '6px' }}>#{idx + 1}</strong> {top}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveTopic(idx)}
                      title="Remove Topic"
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px', display: 'flex' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px', paddingTop: '16px', borderTop: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.12)' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '11px 22px',
                borderRadius: '14px',
                background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
                border: 'none',
                color: isLight ? '#334155' : '#cbd5e1',
                fontWeight: 700,
                fontSize: '0.86rem',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={busy}
              style={{
                padding: '11px 26px',
                borderRadius: '14px',
                background: `linear-gradient(135deg, ${color} 0%, #6366f1 100%)`,
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
                boxShadow: `0 6px 22px ${color}4d`
              }}
            >
              <BookOpen size={16} />
              {busy ? 'Saving to Database...' : activeSubject ? 'Update Subject' : 'Save Subject to Database'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateSubjectModal;

