import React, { useState, useRef } from 'react';
import {
  Play,
  CheckCircle,
  FileText,
  Bot,
  Video,
  FastForward,
  Bookmark,
  Sparkles,
  Download,
  Upload,
  BookOpen,
  Code2
} from 'lucide-react';
import { Button } from '../common/Button';
import { useAI } from '../../context/AIContext';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { getFileUrl, noteApi, showToast } from '../../lib/apiClient';
import { materialService } from '../../services/materialService';

export const LessonViewer = ({ moduleData, course, onCompleteModule }) => {
  const { openAIChat, sendMessage } = useAI();
  const { user } = useAuth() || {};
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const canManage = user?.role === 'ADMIN' || user?.role === 'INSTRUCTOR';

  const [activeSubTab, setActiveSubTab] = useState('video'); // 'video' | 'notes' | 'code'
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [attachedVideoUrl, setAttachedVideoUrl] = useState(moduleData.videoUrl || moduleData.fileUrl || null);
  const [savedNote, setSavedNote] = useState(false);

  const videoRef = useRef(null);
  const fileInputRef = useRef(null);

  const effectiveVideoUrl = attachedVideoUrl || moduleData.videoUrl || moduleData.fileUrl;

  const handleSpeedChange = (speed) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const handleAskSage = () => {
    openAIChat();
    sendMessage(`Explain the core engineering and theoretical concepts of module "${moduleData.title}" from course "${course?.title || 'Course'}" with step-by-step examples.`);
  };

  const handleSaveToPersonalNotes = async () => {
    try {
      await noteApi.createNote({
        title: `Lesson: ${moduleData.title}`,
        content: `Study notes for "${moduleData.title}" in course "${course?.title || 'Academic Course'}".\n\nKey Concepts:\n- Architectural foundations\n- Implementation details\n- Diagnostic review completed.`,
        category: course?.category || 'Course Lessons',
        tags: [course?.title || 'Course', 'LessonNote']
      });
      setSavedNote(true);
      showToast('Lesson saved to Smart Notes!', 'success');
      setTimeout(() => setSavedNote(false), 3000);
    } catch (err) {
      showToast('Could not save note to database: ' + err.message, 'error');
    }
  };

  const handleVideoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingVideo(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('title', `${course?.title || 'Course'} - ${moduleData.title}`);
      formData.append('type', 'Video');
      if (course?.id) formData.append('subjectId', course.id);

      const res = await materialService.uploadFileMaterial(formData);
      if (res && res.fileUrl) {
        setAttachedVideoUrl(res.fileUrl);
        showToast('Video lecture attached to module successfully!', 'success');
      }
    } catch (err) {
      showToast('Failed to upload video: ' + err.message, 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* Sub-tabs toolbar: Video Lecture vs Lecture Notes & Code */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => setActiveSubTab('video')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: activeSubTab === 'video' ? 'linear-gradient(135deg, #0284c7, #6366f1)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
              color: activeSubTab === 'video' ? '#fff' : (isLight ? '#334155' : '#cbd5e1'),
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <Video size={15} /> Video Lecture
          </button>
          <button
            onClick={() => setActiveSubTab('notes')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 16px',
              borderRadius: '12px',
              background: activeSubTab === 'notes' ? 'linear-gradient(135deg, #0284c7, #6366f1)' : (isLight ? 'rgba(0,0,0,0.06)' : 'rgba(255,255,255,0.06)'),
              color: activeSubTab === 'notes' ? '#fff' : (isLight ? '#334155' : '#cbd5e1'),
              border: 'none',
              fontWeight: 700,
              fontSize: '0.84rem',
              cursor: 'pointer'
            }}
          >
            <FileText size={15} /> Lesson Notes & Transcript
          </button>
        </div>

        {canManage && (
          <div>
            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="video/*"
              onChange={handleVideoUpload}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingVideo}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 14px',
                borderRadius: '10px',
                background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(2, 132, 199, 0.25)',
                color: isLight ? '#0284c7' : '#38bdf8',
                border: '1px solid rgba(2, 132, 199, 0.4)',
                fontWeight: 700,
                fontSize: '0.82rem',
                cursor: uploadingVideo ? 'not-allowed' : 'pointer'
              }}
            >
              <Upload size={14} /> {uploadingVideo ? 'Uploading Video...' : 'Upload Video to Module'}
            </button>
          </div>
        )}
      </div>

      {/* Main View Area */}
      {activeSubTab === 'video' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {effectiveVideoUrl ? (
            <div style={{
              borderRadius: '20px',
              overflow: 'hidden',
              background: '#040711',
              border: '1px solid var(--border-glow)',
              boxShadow: '0 12px 35px rgba(0, 0, 0, 0.6)'
            }}>
              <video
                ref={videoRef}
                controls
                src={getFileUrl(effectiveVideoUrl)}
                style={{ width: '100%', maxHeight: '480px', display: 'block' }}
              >
                Your browser does not support HTML5 video.
              </video>
            </div>
          ) : (
            <div style={{
              height: '380px',
              background: 'linear-gradient(135deg, #050b1e 0%, #0a1128 100%)',
              borderRadius: '24px',
              border: '1px solid var(--border-glow)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '24px',
              position: 'relative'
            }}>
              <div style={{
                width: '74px',
                height: '74px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #0284c7, #6366f1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 0 35px rgba(2, 132, 199, 0.5)',
                cursor: 'pointer',
                marginBottom: '16px'
              }}>
                <Play size={34} color="#fff" fill="#fff" style={{ marginLeft: '4px' }} />
              </div>

              <span style={{ fontSize: '0.78rem', fontWeight: 800, textTransform: 'uppercase', color: '#38bdf8', letterSpacing: '0.5px', marginBottom: '6px' }}>
                Interactive Lecture Module
              </span>
              <h3 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#ffffff', marginBottom: '8px', maxWidth: '580px' }}>
                {moduleData.title}
              </h3>
              <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
                Duration: {moduleData.duration ? (typeof moduleData.duration === 'number' ? `${moduleData.duration} mins` : moduleData.duration) : '45 mins'}
              </p>

              {canManage && (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    marginTop: '16px',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    padding: '8px 16px',
                    borderRadius: '10px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    border: '1px solid rgba(255, 255, 255, 0.25)',
                    color: '#fff',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <Upload size={14} /> Attach Video File (.mp4 / .webm)
                </button>
              )}
            </div>
          )}

          {/* Video Control & Speed Toolbar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(15, 23, 42, 0.7)',
            padding: '12px 18px',
            borderRadius: '14px',
            border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.08)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.8rem', fontWeight: 700, color: isLight ? '#5D7192' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <FastForward size={14} /> Playback Speed:
              </span>
              <div style={{ display: 'flex', gap: '4px' }}>
                {[0.75, 1, 1.25, 1.5, 2].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => handleSpeedChange(spd)}
                    style={{
                      padding: '4px 10px',
                      borderRadius: '8px',
                      fontSize: '0.76rem',
                      fontWeight: 700,
                      background: playbackSpeed === spd ? 'linear-gradient(135deg, #0284c7, #6366f1)' : 'transparent',
                      color: playbackSpeed === spd ? '#fff' : (isLight ? '#334155' : '#cbd5e1'),
                      border: playbackSpeed === spd ? 'none' : (isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.1)'),
                      cursor: 'pointer'
                    }}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={handleSaveToPersonalNotes}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '7px 14px',
                  borderRadius: '10px',
                  background: isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)',
                  color: isLight ? '#059669' : '#34d399',
                  border: '1px solid rgba(16, 185, 129, 0.3)',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                <Bookmark size={14} /> {savedNote ? 'Saved!' : 'Save to Smart Notes'}
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* Lesson Notes & Text Tab */
        <div style={{
          background: isLight ? 'rgba(255, 255, 255, 0.92)' : 'rgba(15, 23, 42, 0.85)',
          borderRadius: '20px',
          border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.12)',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
              {moduleData.title} — Comprehensive Guide
            </h3>
            <span style={{ fontSize: '0.8rem', color: isLight ? '#64748b' : '#94a3b8' }}>
              Verified Curriculum Material
            </span>
          </div>

          <div style={{ fontSize: '0.92rem', color: isLight ? '#334155' : '#cbd5e1', lineHeight: 1.65 }}>
            <p>
              In this module, you study the critical concepts of <strong>{moduleData.title}</strong>. 
              Review the architectural diagrams, theoretical proofs, and best practices. Follow along 
              with the live examples and verify edge conditions before advancing to the diagnostic assessment.
            </p>
            <div style={{ background: isLight ? 'rgba(240, 248, 255, 0.8)' : 'rgba(0, 0, 0, 0.3)', padding: '14px 18px', borderRadius: '12px', borderLeft: '3px solid #0284c7', margin: '14px 0' }}>
              <strong style={{ display: 'block', color: isLight ? '#0284c7' : '#38bdf8', marginBottom: '4px' }}>
                💡 Key Learning Outcomes:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '18px' }}>
                <li>Understand the end-to-end operational lifecycle and invariants.</li>
                <li>Implement scalable problem-solving patterns with time & space bounds.</li>
                <li>Identify common pitfalls and edge cases in competitive or production environments.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Lesson Control Toolbar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <Button variant="secondary" onClick={handleAskSage}>
          <Bot size={18} /> Ask Sage AI to Explain Lesson
        </Button>

        <Button onClick={() => onCompleteModule(moduleData.id)}>
          <CheckCircle size={18} /> Mark Module Completed (+50 XP)
        </Button>
      </div>
    </div>
  );
};

export default LessonViewer;
