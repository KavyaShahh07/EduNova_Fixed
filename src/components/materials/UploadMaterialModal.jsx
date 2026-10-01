import React, { useState, useRef, useEffect } from 'react';
import { X, Upload, Video, FileText, CheckCircle2, AlertTriangle, Sparkles, Folder, Tag, Users, UserCheck, Globe, Bell, Search } from 'lucide-react';
import { materialService } from '../../services/materialService';
import { useTheme } from '../../context/ThemeContext';

export const UploadMaterialModal = ({ isOpen, onClose, defaultSubjectId = '', defaultSubjectName = '', topics = [] }) => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [file, setFile] = useState(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('Video'); // 'Video' | 'Document' | 'Cheatsheet' | 'Exercise' | 'Diagram'
  const [selectedTopic, setSelectedTopic] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [targetAudience, setTargetAudience] = useState('GLOBAL'); // 'GLOBAL' | 'ALL_STUDENTS' | 'SELECTED_STUDENTS'
  const [students, setStudents] = useState([]);
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      materialService.getTargetStudents()
        .then(data => setStudents(data || []))
        .catch(() => setStudents([]));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleFileSelect = (selected) => {
    if (!selected) return;
    setFile(selected);
    setError(null);

    // Auto populate title if empty
    if (!title) {
      const baseName = selected.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
      setTitle(baseName.charAt(0).toUpperCase() + baseName.slice(1));
    }

    // Auto detect type
    if (selected.type.startsWith('video/') || selected.name.match(/\.(mp4|webm|mov|mkv|avi|m4v)$/i)) {
      setType('Video');
    } else if (selected.name.match(/\.(pdf|doc|docx|txt|rtf)$/i)) {
      setType('Document');
    } else if (selected.name.match(/\.(ppt|pptx)$/i)) {
      setType('Cheatsheet');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      setError('Please select a video or document file to upload.');
      return;
    }
    if (!title.trim()) {
      setError('Please enter a title for this material.');
      return;
    }
    if (targetAudience === 'SELECTED_STUDENTS' && selectedStudentIds.length === 0) {
      setError('Please select at least one student to deliver the file to.');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', title.trim());
      formData.append('type', type);
      if (defaultSubjectId) formData.append('subjectId', defaultSubjectId);
      if (selectedTopic) formData.append('topic', selectedTopic);
      if (description.trim()) formData.append('description', description.trim());
      formData.append('targetType', targetAudience);
      if (targetAudience === 'SELECTED_STUDENTS') {
        formData.append('studentIds', JSON.stringify(selectedStudentIds));
      }
      if (tagsInput.trim()) {
        const tags = tagsInput.split(',').map(t => t.trim()).filter(Boolean);
        formData.append('tags', JSON.stringify(tags));
      }

      await materialService.uploadFileMaterial(formData);
      
      const successMessage = targetAudience === 'ALL_STUDENTS'
        ? 'Dispatched to ALL students with instant push notifications!'
        : targetAudience === 'SELECTED_STUDENTS'
        ? `Delivered to ${selectedStudentIds.length} targeted student(s)!`
        : 'Material uploaded successfully to server & database!';
      setSuccess(successMessage);

      setTimeout(() => {
        setFile(null);
        setTitle('');
        setDescription('');
        setTagsInput('');
        setSelectedTopic('');
        setSelectedStudentIds([]);
        setTargetAudience('GLOBAL');
        setSuccess(null);
        onClose();
      }, 1500);
    } catch (err) {
      setError(err.message || 'Upload failed. Ensure backend server is running.');
    } finally {
      setUploading(false);
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
        maxWidth: '620px',
        maxHeight: '90vh',
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
              <Sparkles size={14} /> Real Media Upload • PostgreSQL & Disk Storage
            </span>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: '4px 0 0' }}>
              Upload Video / Notes
            </h2>
            {defaultSubjectName && (
              <span style={{ fontSize: '0.82rem', color: isLight ? '#5D7192' : '#94a3b8' }}>
                Subject: <strong style={{ color: isLight ? '#0284c7' : '#38bdf8' }}>{defaultSubjectName}</strong>
              </span>
            )}
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

        {success && (
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.4)', padding: '12px 16px', borderRadius: '12px', color: '#10b981', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CheckCircle2 size={16} /> {success}
          </div>
        )}

        {/* Drag & Drop File Zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border: isDragOver ? '2px dashed #0284c7' : (isLight ? '2px dashed rgba(180, 205, 240, 0.9)' : '2px dashed rgba(255, 255, 255, 0.2)'),
            background: isDragOver
              ? (isLight ? 'rgba(2, 132, 199, 0.08)' : 'rgba(2, 132, 199, 0.15)')
              : (isLight ? 'rgba(240, 248, 255, 0.7)' : 'rgba(255, 255, 255, 0.03)'),
            borderRadius: '16px',
            padding: '28px 20px',
            textAlign: 'center',
            cursor: 'pointer',
            transition: 'all 0.2s ease'
          }}
        >
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov,.mkv,.pdf,.doc,.docx,.ppt,.pptx,.txt"
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
          {file ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(16, 185, 129, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}>
                {file.type.startsWith('video/') ? <Video size={24} /> : <FileText size={24} />}
              </div>
              <strong style={{ fontSize: '0.95rem', color: isLight ? '#0f172a' : '#ffffff' }}>
                {file.name}
              </strong>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {(file.size / (1024 * 1024)).toFixed(2)} MB • Click to replace
              </span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#0284c7' }}>
                <Upload size={24} />
              </div>
              <strong style={{ fontSize: '0.95rem', color: isLight ? '#0f172a' : '#ffffff' }}>
                Drag & drop your Video or Document here
              </strong>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                Supports MP4, WebM, MOV, PDF, Word DOCX, PPTX (Up to 100MB)
              </span>
            </div>
          )}
        </div>

        {/* Form Details */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Material Title *
            </label>
            <input
              type="text"
              placeholder="e.g. Chapter 3: Database Normalization Lecture"
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
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Media Type
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
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
                <option value="Video">🎥 Video Lecture</option>
                <option value="Document">📄 PDF / Document Notes</option>
                <option value="Cheatsheet">⚡ Cheatsheet / Formula Sheet</option>
                <option value="Diagram">📊 Diagram / Architecture</option>
                <option value="Exercise">📝 Practice Exercise</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
                Topic / Chapter
              </label>
              {topics && topics.length > 0 ? (
                <select
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
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
                  <option value="">General (All Topics)</option>
                  {topics.map(t => (
                    <option key={t.id || t.name} value={t.name || t.title}>
                      {t.name || t.title}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  placeholder="e.g. Chapter 1: Foundations"
                  value={selectedTopic}
                  onChange={(e) => setSelectedTopic(e.target.value)}
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
              )}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Description & Key Takeaways
            </label>
            <textarea
              placeholder="Outline what students will learn from this lecture or document..."
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

          <div>
            <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#334155' : '#cbd5e1', marginBottom: '6px' }}>
              Tags (Comma separated)
            </label>
            <input
              type="text"
              placeholder="e.g. Lecture, High Yield, Exam Prep"
              value={tagsInput}
              onChange={(e) => setTagsInput(e.target.value)}
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

          {/* ── TARGET AUDIENCE / RECIPIENT SELECTION ── */}
          <div style={{
            background: isLight ? 'rgba(241, 245, 249, 0.6)' : 'rgba(15, 23, 42, 0.4)',
            border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: '14px',
            padding: '14px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '6px' }}>
              <label style={{ fontSize: '0.82rem', fontWeight: 800, color: isLight ? '#0f172a' : '#f8fafc', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={15} color="#0284c7" /> Assign & Deliver To:
              </label>
              <span style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : '#94a3b8' }}>
                {targetAudience === 'GLOBAL' && '🌐 Standard subject material'}
                {targetAudience === 'ALL_STUDENTS' && '📢 Broadcast to ALL students with push notification'}
                {targetAudience === 'SELECTED_STUDENTS' && `🎯 Delivering to ${selectedStudentIds.length} student(s)`}
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '8px' }}>
              <button
                type="button"
                onClick={() => setTargetAudience('GLOBAL')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'GLOBAL' ? '#0284c7' : isLight ? 'rgba(200, 218, 240, 0.9)' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: targetAudience === 'GLOBAL' ? 'rgba(2, 132, 199, 0.12)' : isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  color: targetAudience === 'GLOBAL' ? '#0284c7' : isLight ? '#334155' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <Globe size={16} />
                <div>
                  <div>Course Wide</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.68rem' }}>Subject Curriculum</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('ALL_STUDENTS')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'ALL_STUDENTS' ? '#10b981' : isLight ? 'rgba(200, 218, 240, 0.9)' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: targetAudience === 'ALL_STUDENTS' ? 'rgba(16, 185, 129, 0.12)' : isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  color: targetAudience === 'ALL_STUDENTS' ? '#10b981' : isLight ? '#334155' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <Bell size={16} />
                <div>
                  <div>All Students</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.68rem' }}>Broadcast Push</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('SELECTED_STUDENTS')}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'SELECTED_STUDENTS' ? '#8b5cf6' : isLight ? 'rgba(200, 218, 240, 0.9)' : 'rgba(255, 255, 255, 0.1)'}`,
                  background: targetAudience === 'SELECTED_STUDENTS' ? 'rgba(139, 92, 246, 0.12)' : isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.6)',
                  color: targetAudience === 'SELECTED_STUDENTS' ? '#8b5cf6' : isLight ? '#334155' : '#cbd5e1',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  fontWeight: 700,
                  fontSize: '0.8rem',
                  textAlign: 'left'
                }}
              >
                <UserCheck size={16} />
                <div>
                  <div>Particular Student(s)</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.68rem' }}>Choose 1 or many</div>
                </div>
              </button>
            </div>

            {targetAudience === 'SELECTED_STUDENTS' && (
              <div style={{
                marginTop: '4px',
                padding: '12px',
                borderRadius: '10px',
                border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
                background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.7)'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '160px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
                    <input
                      type="text"
                      placeholder="Search students..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '6px 10px 6px 30px',
                        fontSize: '0.8rem',
                        borderRadius: '8px',
                        border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                        background: isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.8)',
                        color: 'inherit',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const allIds = students.map(s => s.id);
                      setSelectedStudentIds(selectedStudentIds.length === allIds.length ? [] : allIds);
                    }}
                    style={{
                      fontSize: '0.75rem',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      border: '1px solid #8b5cf6',
                      background: 'rgba(139, 92, 246, 0.1)',
                      color: '#8b5cf6',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    {selectedStudentIds.length === students.length && students.length > 0 ? 'Deselect All' : 'Select All Students'}
                  </button>
                </div>

                <div style={{
                  maxHeight: '160px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: '6px'
                }}>
                  {students
                    .filter(s => !studentSearch || s.name?.toLowerCase().includes(studentSearch.toLowerCase()) || s.email?.toLowerCase().includes(studentSearch.toLowerCase()))
                    .map(student => {
                      const isSelected = selectedStudentIds.includes(student.id);
                      return (
                        <div
                          key={student.id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedStudentIds(selectedStudentIds.filter(id => id !== student.id));
                            } else {
                              setSelectedStudentIds([...selectedStudentIds, student.id]);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            padding: '6px 10px',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? '#8b5cf6' : isLight ? 'rgba(200, 218, 240, 0.8)' : 'rgba(255, 255, 255, 0.1)'}`,
                            background: isSelected ? 'rgba(139, 92, 246, 0.12)' : isLight ? '#f8fafc' : 'rgba(15, 23, 42, 0.5)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {student.name}
                            </span>
                            <span style={{ fontSize: '0.68rem', opacity: 0.7, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {student.email}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {students.length === 0 && (
                    <div style={{ padding: '12px', textAlign: 'center', color: '#94a3b8', fontSize: '0.8rem', gridColumn: '1 / -1' }}>
                      No registered students found in database.
                    </div>
                  )}
                </div>
              </div>
            )}
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
              disabled={uploading}
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
                cursor: uploading ? 'not-allowed' : 'pointer',
                opacity: uploading ? 0.7 : 1,
                boxShadow: '0 6px 20px rgba(2, 132, 199, 0.35)'
              }}
            >
              <Upload size={16} />
              {uploading ? 'Uploading to Database...' : 'Upload File'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
export default UploadMaterialModal;
