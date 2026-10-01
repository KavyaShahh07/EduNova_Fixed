import React, { useState } from 'react';
import { X, PlayCircle, Plus, Trash2, Sparkles, AlertTriangle, BookOpen } from 'lucide-react';
import { courseApi, showToast } from '../../lib/apiClient';
import { useTheme } from '../../context/ThemeContext';

export const CreateCourseModal = ({ isOpen, onClose, onCourseCreated, onSuccess, editCourse = null, editingCourse = null }) => {
  const activeCourse = editingCourse || editCourse;
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [title, setTitle] = useState(activeCourse?.title || activeCourse?.name || '');
  const [description, setDescription] = useState(activeCourse?.description || '');
  const [category, setCategory] = useState(activeCourse?.category || 'Web Development');
  const [difficulty, setDifficulty] = useState(activeCourse?.difficulty || 'BEGINNER');
  const [thumbnail, setThumbnail] = useState(activeCourse?.thumbnail || activeCourse?.image || 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=800&auto=format&fit=crop&q=80');
  const [modules, setModules] = useState(
    Array.isArray(activeCourse?.modules) && activeCourse.modules.length > 0
      ? activeCourse.modules.map(m => ({ title: m.title || '', duration: m.duration || 30 }))
      : [
          { title: 'Module 1: Architecture & Foundational Design', duration: 45 },
          { title: 'Module 2: Practical Implementation & Deep-Dive', duration: 60 }
        ]
  );
  const [newModuleTitle, setNewModuleTitle] = useState('');
  const [newModuleDuration, setNewModuleDuration] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  const handleAddModule = () => {
    if (!newModuleTitle.trim()) return;
    setModules([...modules, { title: newModuleTitle.trim(), duration: parseInt(newModuleDuration, 10) || 30 }]);
    setNewModuleTitle('');
    setNewModuleDuration(45);
  };

  const handleRemoveModule = (index) => {
    setModules(modules.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a course title.');
      return;
    }
    if (!category.trim()) {
      setError('Please provide a category.');
      return;
    }

    setBusy(true);
    setError(null);

    const payload = {
      title: title.trim(),
      description: description.trim() || undefined,
      category: category.trim(),
      difficulty: difficulty.toUpperCase(),
      thumbnail: thumbnail.trim() || undefined,
      modules: modules.map((m, idx) => ({
        title: m.title,
        duration: m.duration || 30,
        order: idx + 1
      }))
    };

    try {
      let result;
      if (activeCourse?.id) {
        result = await courseApi.updateCourse(activeCourse.id, payload);
        showToast(`Course "${title}" updated successfully!`, 'success');
      } else {
        result = await courseApi.createCourse(payload);
        showToast(`Course "${title}" created successfully in database!`, 'success');
      }

      window.dispatchEvent(new CustomEvent('edunova_course_updated', { detail: result?.data }));

      if (onCourseCreated) {
        onCourseCreated(result?.data);
      }
      if (onSuccess) {
        onSuccess(result?.data);
      }
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to save course. Ensure you are logged in as an Instructor or Admin.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(5, 8, 20, 0.85)',
      backdropFilter: 'blur(16px)',
      WebkitBackdropFilter: 'blur(16px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '20px'
    }}>
      <div style={{
        background: isLight ? 'linear-gradient(135deg, #ffffff 0%, #f0f7ff 100%)' : 'linear-gradient(135deg, rgba(20, 26, 58, 0.98) 0%, rgba(12, 17, 40, 0.98) 100%)',
        borderRadius: '24px',
        border: isLight ? '1px solid rgba(195, 215, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.2)',
        width: '100%',
        maxWidth: '680px',
        maxHeight: '92vh',
        overflowY: 'auto',
        padding: '28px',
        boxShadow: isLight ? '0 20px 50px rgba(70, 110, 180, 0.25)' : '0 25px 60px rgba(0, 0, 0, 0.75)',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', color: '#0284c7', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} /> Instructor Studio Course Builder
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: '4px 0 0' }}>
              {editCourse ? 'Edit Course' : 'Create New Course'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.08)',
              border: 'none',
              borderRadius: '50%',
              width: '36px',
              height: '36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: isLight ? '#334155' : '#ffffff',
              cursor: 'pointer'
            }}
          >
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '12px 16px', borderRadius: '12px', color: '#ef4444', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Course Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Modern Full-Stack Development with Next.js & Node.js"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Category
              </label>
              <input
                type="text"
                placeholder="e.g. Web Development, Physics, AI"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                required
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Difficulty Level
              </label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.88rem',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="BEGINNER">🟢 Beginner</option>
                <option value="INTERMEDIATE">🟡 Intermediate</option>
                <option value="ADVANCED">🔴 Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Thumbnail Image URL
            </label>
            <input
              type="text"
              placeholder="https://images.unsplash.com/..."
              value={thumbnail}
              onChange={(e) => setThumbnail(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Course Description & Objectives
            </label>
            <textarea
              placeholder="Describe the target audience, curriculum syllabus, and learning objectives..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              style={{
                width: '100%',
                padding: '10px 14px',
                borderRadius: '12px',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.88rem',
                outline: 'none',
                resize: 'vertical',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* Course Modules Builder */}
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Course Lesson Modules ({modules.length})
            </label>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
              <input
                type="text"
                placeholder="Module title (e.g. Module 3: State Machines & Microtasks)"
                value={newModuleTitle}
                onChange={(e) => setNewModuleTitle(e.target.value)}
                style={{
                  flex: 1,
                  padding: '9px 12px',
                  borderRadius: '10px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <input
                type="number"
                placeholder="Duration (mins)"
                value={newModuleDuration}
                onChange={(e) => setNewModuleDuration(e.target.value)}
                style={{
                  width: '90px',
                  padding: '9px 10px',
                  borderRadius: '10px',
                  background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.8)',
                  border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  fontSize: '0.84rem',
                  outline: 'none'
                }}
              />
              <button
                type="button"
                onClick={handleAddModule}
                style={{
                  padding: '9px 16px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: 'pointer'
                }}
              >
                <Plus size={14} /> Add
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '160px', overflowY: 'auto' }}>
              {modules.map((mod, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(240, 246, 255, 0.8)' : 'rgba(255, 255, 255, 0.04)',
                    border: isLight ? '1px solid rgba(200, 218, 240, 0.7)' : '1px solid rgba(255, 255, 255, 0.08)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <PlayCircle size={15} color="#0284c7" />
                    <span style={{ fontSize: '0.84rem', color: isLight ? '#18345F' : '#ffffff', fontWeight: 600 }}>
                      {idx + 1}. {mod.title}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '0.75rem', color: isLight ? '#5D7192' : '#94a3b8' }}>
                      {mod.duration} mins
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveModule(idx)}
                      style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '2px' }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '10px 20px',
                borderRadius: '12px',
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
                padding: '10px 24px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #0284c7 0%, #6366f1 100%)',
                border: 'none',
                color: '#ffffff',
                fontWeight: 800,
                fontSize: '0.88rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: busy ? 'not-allowed' : 'pointer',
                opacity: busy ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)'
              }}
            >
              <BookOpen size={16} />
              {busy ? 'Saving to Database...' : editCourse ? 'Update Course' : 'Publish Course'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default CreateCourseModal;
