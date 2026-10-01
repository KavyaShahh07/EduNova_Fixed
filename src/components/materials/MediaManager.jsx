import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Video,
  FileText,
  Trash2,
  Eye,
  Download,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Play,
  Film,
  FolderPlus,
  ExternalLink,
  Layers,
  Users,
  UserCheck,
  Globe,
  Bell,
  CheckSquare,
  Square
} from 'lucide-react';
import { materialService } from '../../services/materialService';
import { adminApi, subjectApi } from '../../lib/apiClient';
import { Button } from '../common/Button';
import { SubjectSelect } from '../common/SubjectSelect';
import { MaterialViewer } from './MaterialViewer';

export const MediaManager = ({ isInstructor = false, userRole = 'INSTRUCTOR' }) => {
  const [materials, setMaterials] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [notice, setNotice] = useState(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [activePreview, setActivePreview] = useState(null);

  // Form State
  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState('');
  const [type, setType] = useState('VIDEO');
  const [subjectId, setSubjectId] = useState('');
  const [topicName, setTopicName] = useState('');
  const [description, setDescription] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const [targetAudience, setTargetAudience] = useState('GLOBAL'); // 'GLOBAL' | 'ALL_STUDENTS' | 'SELECTED_STUDENTS'
  const [selectedStudentIds, setSelectedStudentIds] = useState([]);
  const [studentSearch, setStudentSearch] = useState('');
  const fileInputRef = useRef(null);

  const notify = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [mats, subsRes, stus] = await Promise.all([
        materialService.fetchFromServer(),
        subjectApi.getAllSubjects().catch(() => ({ data: [] })),
        materialService.getTargetStudents().catch(() => [])
      ]);
      setMaterials(mats || []);
      setStudents(stus || []);
      const subs = Array.isArray(subsRes?.data) ? subsRes.data : (Array.isArray(subsRes) ? subsRes : []);
      setSubjects(subs);
      if (subs.length > 0 && !subjectId) {
        setSubjectId(subs[0].id);
      }
    } catch (err) {
      notify(err.message || 'Failed to load media materials', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => {
      materialService.fetchFromServer().then(m => setMaterials(m || []));
    };
    window.addEventListener('edunova_materials_updated', handleUpdate);
    return () => window.removeEventListener('edunova_materials_updated', handleUpdate);
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFile(file);
    if (!title) {
      const baseName = file.name.replace(/\.[^/.]+$/, '');
      setTitle(baseName.replace(/[-_]/g, ' '));
    }
    // Auto-detect type
    if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
      setType('VIDEO');
    } else if (file.type === 'application/pdf' || file.name.match(/\.pdf$/i)) {
      setType('DOCUMENT');
    } else if (file.name.match(/\.(ppt|pptx)$/i)) {
      setType('SLIDES');
    } else {
      setType('DOCUMENT');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile(file);
      if (!title) {
        const baseName = file.name.replace(/\.[^/.]+$/, '');
        setTitle(baseName.replace(/[-_]/g, ' '));
      }
      if (file.type.startsWith('video/') || file.name.match(/\.(mp4|webm|mov|mkv|avi)$/i)) {
        setType('VIDEO');
      } else {
        setType('DOCUMENT');
      }
    }
  };

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      notify('Please select a video or document file to upload', 'error');
      return;
    }
    if (!title.trim()) {
      notify('Please provide a title for the material', 'error');
      return;
    }
    if (targetAudience === 'SELECTED_STUDENTS' && selectedStudentIds.length === 0) {
      notify('Please select at least one student to deliver the file to', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('title', title.trim());
      formData.append('type', type);
      if (subjectId) formData.append('subjectId', subjectId);
      if (topicName.trim()) formData.append('topic', topicName.trim());
      if (description.trim()) formData.append('description', description.trim());
      formData.append('targetType', targetAudience);
      if (targetAudience === 'SELECTED_STUDENTS') {
        formData.append('studentIds', JSON.stringify(selectedStudentIds));
      }

      await materialService.uploadFileMaterial(formData);
      
      const successMsg = targetAudience === 'ALL_STUDENTS' 
        ? `"${title}" uploaded and dispatched to all students with push notifications!`
        : targetAudience === 'SELECTED_STUDENTS'
        ? `"${title}" uploaded and delivered to ${selectedStudentIds.length} targeted student(s)!`
        : `"${title}" uploaded successfully to database and media storage!`;
      notify(successMsg);

      // Reset form
      setSelectedFile(null);
      setTitle('');
      setDescription('');
      setTopicName('');
      setSelectedStudentIds([]);
      setTargetAudience('GLOBAL');
      if (fileInputRef.current) fileInputRef.current.value = '';

      await loadData();
    } catch (err) {
      notify(err.message || 'File upload failed. Ensure server is active.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (mat) => {
    if (!window.confirm(`Are you sure you want to delete "${mat.title}"? This will permanently remove the file.`)) {
      return;
    }
    try {
      await materialService.deleteMaterial(mat.id);
      notify(`"${mat.title}" deleted successfully.`);
      await loadData();
    } catch (err) {
      notify(err.message || 'Failed to delete material', 'error');
    }
  };

  const filteredMaterials = materials.filter(m => {
    const matchesSearch = !search ||
      m.title?.toLowerCase().includes(search.toLowerCase()) ||
      m.subjectName?.toLowerCase().includes(search.toLowerCase()) ||
      m.description?.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' ||
      (typeFilter === 'VIDEO' && (m.type === 'VIDEO' || m.fileUrl?.match(/\.(mp4|webm|mov|mkv|avi)$/i))) ||
      (typeFilter === 'DOCUMENT' && m.type !== 'VIDEO');

    return matchesSearch && matchesType;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {notice && (
        <div style={{
          padding: '12px 18px',
          borderRadius: '12px',
          background: notice.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
          color: notice.type === 'error' ? '#ef4444' : '#10b981',
          fontWeight: 700,
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          {notice.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}
          {notice.message}
        </div>
      )}

      {/* ── UPLOAD BOX ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{ marginBottom: '18px' }}>
          <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Upload size={22} color="var(--accent-primary)" />
            {isInstructor ? 'Upload Video Lecture or Study Material' : 'Admin Media & File Upload Hub'}
          </h3>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Upload lecture videos (.mp4, .webm, .mov) or educational files (.pdf, .docx, .pptx) directly to the server and database.
          </p>
        </div>

        <form onSubmit={handleUploadSubmit} style={{ display: 'grid', gap: '16px' }}>
          {/* Drag & Drop Area */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? 'var(--accent-primary)' : 'var(--border-color)'}`,
              borderRadius: '16px',
              padding: '28px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(2, 132, 199, 0.08)' : 'var(--bg-primary)',
              transition: 'all 0.2s ease'
            }}
          >
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".mp4,.webm,.mov,.mkv,.avi,.pdf,.docx,.pptx,.xlsx,.zip"
            />
            {selectedFile ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <CheckCircle2 size={36} color="#10b981" />
                <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{selectedFile.name}</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  Size: {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB · Click to change file
                </span>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                <Upload size={36} style={{ color: 'var(--accent-primary)', opacity: 0.8 }} />
                <strong style={{ fontSize: '0.98rem' }}>Drag & Drop Video or File here, or click to browse</strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Supported formats: MP4, WebM, MOV, MKV, PDF, DOCX, PPTX (up to 100MB)
                </span>
              </div>
            )}
          </div>

          {/* Form Fields Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Material Title *
              </label>
              <input
                required
                type="text"
                placeholder="e.g. Physics Chapter 3: Kinematics Video Lecture"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Material Type *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
              >
                <option value="VIDEO">Video Lecture (MP4 / WebM)</option>
                <option value="DOCUMENT">Document / PDF Guide</option>
                <option value="WORKSHEET">Practice Worksheet</option>
                <option value="SLIDES">Presentation Slides</option>
                <option value="LAB_REPORT">Lab Report / Code</option>
              </select>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Curriculum Subject *
              </label>
              <SubjectSelect
                value={subjectId}
                onChange={(e, val) => setSubjectId(val || e.target.value)}
                subjects={subjects}
                placeholder="Select Curriculum Subject..."
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Topic / Chapter (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Projectile Motion, Normalization"
                value={topicName}
                onChange={(e) => setTopicName(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
              Description & Key Takeaways
            </label>
            <textarea
              rows={2}
              placeholder="Provide a short overview of what students will learn from this file/video..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
            />
          </div>

          {/* ── TARGET AUDIENCE / RECIPIENT SELECTION ── */}
          <div style={{
            background: 'var(--bg-primary)',
            border: '1px solid var(--border-color)',
            borderRadius: '14px',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={16} color="var(--accent-primary)" /> Assign & Deliver To:
              </label>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {targetAudience === 'GLOBAL' && '🌐 Standard subject material (all enrolled students)'}
                {targetAudience === 'ALL_STUDENTS' && '📢 Broadcast to ALL registered students with instant notifications'}
                {targetAudience === 'SELECTED_STUDENTS' && `🎯 Delivering to ${selectedStudentIds.length} chosen student(s)`}
              </span>
            </div>

            {/* Selection Mode Pills */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setTargetAudience('GLOBAL')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'GLOBAL' ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                  background: targetAudience === 'GLOBAL' ? 'rgba(2, 132, 199, 0.12)' : 'var(--bg-secondary)',
                  color: targetAudience === 'GLOBAL' ? 'var(--accent-primary)' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textAlign: 'left'
                }}
              >
                <Globe size={18} />
                <div>
                  <div>Course Wide</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.72rem' }}>All subject students</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('ALL_STUDENTS')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'ALL_STUDENTS' ? '#10b981' : 'var(--border-color)'}`,
                  background: targetAudience === 'ALL_STUDENTS' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-secondary)',
                  color: targetAudience === 'ALL_STUDENTS' ? '#10b981' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textAlign: 'left'
                }}
              >
                <Bell size={18} />
                <div>
                  <div>All Students (Broadcast)</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.72rem' }}>Direct push notifications</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setTargetAudience('SELECTED_STUDENTS')}
                style={{
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: `1.5px solid ${targetAudience === 'SELECTED_STUDENTS' ? '#8b5cf6' : 'var(--border-color)'}`,
                  background: targetAudience === 'SELECTED_STUDENTS' ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-secondary)',
                  color: targetAudience === 'SELECTED_STUDENTS' ? '#8b5cf6' : 'inherit',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  fontWeight: 700,
                  fontSize: '0.82rem',
                  textAlign: 'left'
                }}
              >
                <UserCheck size={18} />
                <div>
                  <div>Particular Student(s)</div>
                  <div style={{ fontWeight: 400, opacity: 0.75, fontSize: '0.72rem' }}>Choose 1 or many students</div>
                </div>
              </button>
            </div>

            {/* Targeted Student Chooser */}
            {targetAudience === 'SELECTED_STUDENTS' && (
              <div style={{
                marginTop: '6px',
                padding: '14px',
                borderRadius: '10px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-secondary)'
              }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
                    <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', opacity: 0.6 }} />
                    <input
                      type="text"
                      placeholder="Search students by name or email..."
                      value={studentSearch}
                      onChange={(e) => setStudentSearch(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '7px 10px 7px 30px',
                        fontSize: '0.82rem',
                        borderRadius: '8px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        color: 'inherit'
                      }}
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const allIds = students.map(s => s.id);
                      setSelectedStudentIds(selectedStudentIds.length === allIds.length ? [] : allIds);
                    }}
                    style={{ fontSize: '0.75rem', padding: '6px 12px' }}
                  >
                    {selectedStudentIds.length === students.length && students.length > 0 ? 'Deselect All' : 'Select All Students'}
                  </Button>
                </div>

                <div style={{
                  maxHeight: '190px',
                  overflowY: 'auto',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(230px, 1fr))',
                  gap: '8px'
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
                            gap: '10px',
                            padding: '8px 12px',
                            borderRadius: '10px',
                            cursor: 'pointer',
                            border: `1px solid ${isSelected ? '#8b5cf6' : 'var(--border-color)'}`,
                            background: isSelected ? 'rgba(139, 92, 246, 0.12)' : 'var(--bg-primary)',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            style={{ cursor: 'pointer' }}
                          />
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            background: isSelected ? '#8b5cf6' : 'var(--accent-primary)',
                            color: '#fff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.75rem',
                            fontWeight: 700,
                            flexShrink: 0
                          }}>
                            {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, overflow: 'hidden' }}>
                            <span style={{ fontSize: '0.82rem', fontWeight: 700, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {student.name}
                            </span>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                              {student.email}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                  {students.length === 0 && (
                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem', gridColumn: '1 / -1' }}>
                      No active students found in the database.
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
            <Button
              type="submit"
              disabled={uploading || !selectedFile || (targetAudience === 'SELECTED_STUDENTS' && selectedStudentIds.length === 0)}
              style={{ minWidth: '200px' }}
            >
              {uploading ? (
                <>
                  <RefreshCw size={16} className="spin" /> Uploading & Dispatched...
                </>
              ) : (
                <>
                  <Upload size={16} /> Upload & Deliver Material
                </>
              )}
            </Button>
          </div>
        </form>
      </div>

      {/* ── UPLOADED MATERIALS DIRECTORY ── */}
      <div style={{
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-color)',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.06)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '14px',
          marginBottom: '20px'
        }}>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800 }}>
              Live Database Learning Materials ({filteredMaterials.length})
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              All uploaded video lectures and educational resources stored in PostgreSQL database.
            </p>
          </div>

          {/* Search and Filters */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative' }}>
              <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input
                type="text"
                placeholder="Search materials..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                style={{
                  padding: '8px 12px 8px 32px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-primary)',
                  color: 'inherit',
                  fontSize: '0.85rem'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              {['ALL', 'VIDEO', 'DOCUMENT'].map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: typeFilter === f ? 'var(--accent-primary)' : 'var(--bg-primary)',
                    color: typeFilter === f ? '#fff' : 'inherit',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  {f === 'ALL' ? 'All Files' : f === 'VIDEO' ? 'Videos' : 'Documents'}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={loadData}>
              <RefreshCw size={14} className={loading ? 'spin' : ''} /> Refresh
            </Button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px' }}>
            <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
            <p style={{ color: 'var(--text-muted)' }}>Loading materials from database...</p>
          </div>
        ) : filteredMaterials.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '60px 20px',
            background: 'var(--bg-primary)',
            borderRadius: '16px',
            border: '1px dashed var(--border-color)'
          }}>
            <Film size={44} style={{ color: 'var(--accent-primary)', opacity: 0.6, marginBottom: '12px' }} />
            <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>No Materials Found in Database</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '6px' }}>
              Use the upload form above to add your first video lecture or study document.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
            {filteredMaterials.map(mat => {
              const isVid = mat.type === 'VIDEO' || mat.fileUrl?.match(/\.(mp4|webm|mov|mkv|avi)$/i);
              return (
                <div
                  key={mat.id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '16px',
                    border: '1px solid var(--border-color)',
                    padding: '18px',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    gap: '12px'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <span style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '5px',
                          padding: '4px 10px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: isVid ? 'rgba(239, 68, 68, 0.15)' : 'rgba(2, 132, 199, 0.15)',
                          color: isVid ? '#ef4444' : '#0284c7'
                        }}>
                          {isVid ? <Video size={13} /> : <FileText size={13} />}
                          {isVid ? 'VIDEO LECTURE' : (mat.type || 'DOCUMENT')}
                        </span>

                        {mat.tags?.includes('target:all_students') ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'rgba(16, 185, 129, 0.15)',
                            color: '#10b981'
                          }}>
                            <Bell size={11} /> All Students
                          </span>
                        ) : mat.tags?.some(t => t.startsWith('target:')) ? (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'rgba(139, 92, 246, 0.15)',
                            color: '#8b5cf6'
                          }}>
                            <UserCheck size={11} /> Targeted ({mat.tags.filter(t => t.startsWith('target:')).length})
                          </span>
                        ) : (
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            background: 'rgba(2, 132, 199, 0.12)',
                            color: 'var(--accent-primary)'
                          }}>
                            <Globe size={11} /> Course Wide
                          </span>
                        )}
                      </div>

                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        {new Date(mat.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.02rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {mat.title}
                    </h4>

                    {mat.description && (
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: '0 0 10px 0', lineHeight: 1.45 }}>
                        {mat.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', gap: '10px', fontSize: '0.78rem', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                      {mat.subjectName && <span>📚 {mat.subjectName}</span>}
                      {mat.topic && <span>📌 {mat.topic}</span>}
                      {mat.fileSize && <span>💾 {(mat.fileSize / (1024 * 1024)).toFixed(1)} MB</span>}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                    <Button
                      size="sm"
                      style={{ flex: 1 }}
                      onClick={() => setActivePreview(mat)}
                    >
                      {isVid ? <><Play size={14} /> Watch Video</> : <><Eye size={14} /> View File</>}
                    </Button>

                    {mat.fileUrl && (
                      <a
                        href={mat.fileUrl.startsWith('http') ? mat.fileUrl : `http://localhost:5000${mat.fileUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        download
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '7px 10px',
                          borderRadius: '8px',
                          border: '1px solid var(--border-color)',
                          background: 'var(--bg-secondary)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer'
                        }}
                        title="Download / Open file directly"
                      >
                        <Download size={14} />
                      </a>
                    )}

                    <button
                      onClick={() => handleDelete(mat)}
                      style={{
                        padding: '7px 10px',
                        borderRadius: '8px',
                        border: 'none',
                        background: 'rgba(239, 68, 68, 0.1)',
                        color: '#ef4444',
                        cursor: 'pointer'
                      }}
                      title="Delete material"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Material Modal Preview */}
      {activePreview && (
        <MaterialViewer
          material={activePreview}
          onClose={() => setActivePreview(null)}
          onAskSage={() => {}}
        />
      )}
    </div>
  );
};

export default MediaManager;
