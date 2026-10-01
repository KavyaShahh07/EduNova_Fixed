import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search, GraduationCap, School, Code2, Award, Check, Layers, Sparkles } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

const TRACK_CONFIG = {
  ALL: { label: 'All Tracks', icon: Layers, color: '#38bdf8' },
  COLLEGE: { label: 'College', icon: GraduationCap, color: '#6366f1' },
  SCHOOL: { label: 'School', icon: School, color: '#38bdf8' },
  SKILLS: { label: 'Skills', icon: Code2, color: '#10b981' },
  EXAM: { label: 'Exam Prep', icon: Award, color: '#f59e0b' }
};

export const SubjectSelect = ({
  value,
  onChange,
  subjects = [],
  placeholder = 'Select a Subject...',
  disabled = false,
  className = '',
  style = {}
}) => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const containerRef = useRef(null);

  // Close popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Selected subject object
  const selectedSubject = subjects.find(s => s.id === value || s._id === value);

  // Filter subjects by active track & search query
  const filteredSubjects = subjects.filter(s => {
    const track = (s.educationType || s.track || 'COLLEGE').toUpperCase();
    if (activeTab !== 'ALL' && track !== activeTab) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = s.name?.toLowerCase().includes(q);
    const categoryMatch = s.category?.toLowerCase().includes(q);
    const boardMatch = s.board?.toLowerCase().includes(q);
    const degreeMatch = s.degree?.toLowerCase().includes(q);
    const examMatch = s.exam?.toLowerCase().includes(q);

    return nameMatch || categoryMatch || boardMatch || degreeMatch || examMatch;
  });

  const handleSelect = (sub) => {
    if (disabled) return;
    const selectedId = sub ? (sub.id || sub._id) : '';
    if (onChange) {
      const syntheticEvent = {
        target: { value: selectedId, name: 'subjectId' }
      };
      onChange(syntheticEvent, selectedId, sub);
    }
    setIsOpen(false);
  };

  const getSubMeta = (s) => {
    const track = (s.educationType || s.track || 'SCHOOL').toUpperCase();
    if (track === 'COLLEGE') {
      return [s.degree, s.branch, s.semester ? `Sem ${s.semester}` : ''].filter(Boolean).join(' • ') || 'College Curriculum';
    }
    if (track === 'SCHOOL') {
      return [s.board, s.class ? `Class ${s.class}` : ''].filter(Boolean).join(' • ') || 'School Curriculum';
    }
    if (track === 'SKILLS') {
      return [s.branch, s.degree].filter(Boolean).join(' • ') || 'Career Skill Track';
    }
    if (track === 'EXAM') {
      return s.exam || 'Competitive Exam Prep';
    }
    return s.category || 'General';
  };

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%', minWidth: '220px', ...style }} className={className}>
      
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '9px 14px',
          borderRadius: '14px',
          background: isLight ? '#ffffff' : 'rgba(15, 23, 42, 0.85)',
          border: isOpen
            ? '1.5px solid #38bdf8'
            : (isLight ? '1.5px solid rgba(200, 220, 245, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)'),
          color: isLight ? '#0f172a' : '#ffffff',
          fontSize: '0.86rem',
          fontWeight: 600,
          cursor: disabled ? 'not-allowed' : 'pointer',
          outline: 'none',
          boxShadow: isOpen ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none',
          transition: 'all 0.2s ease',
          boxSizing: 'border-box'
        }}
      >
        {selectedSubject ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
            <span style={{
              width: '10px',
              height: '10px',
              borderRadius: '50%',
              background: selectedSubject.color || TRACK_CONFIG[selectedSubject.educationType]?.color || '#38bdf8',
              flexShrink: 0,
              boxShadow: `0 0 8px ${selectedSubject.color || '#38bdf8'}`
            }} />
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.86rem', fontWeight: 700 }}>
              {selectedSubject.name}
            </span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '2px 7px',
              borderRadius: '999px',
              background: 'rgba(56, 189, 248, 0.15)',
              color: selectedSubject.color || '#38bdf8',
              border: `1px solid ${selectedSubject.color || '#38bdf8'}40`,
              flexShrink: 0,
              marginLeft: 'auto'
            }}>
              {selectedSubject.educationType || 'SUBJECT'}
            </span>
          </div>
        ) : (
          <span style={{ color: isLight ? '#64748b' : '#94a3b8', fontWeight: 500, fontSize: '0.85rem' }}>{placeholder}</span>
        )}

        <ChevronDown
          size={16}
          style={{
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
            color: isLight ? '#64748b' : '#94a3b8',
            flexShrink: 0,
            marginLeft: '8px'
          }}
        />
      </button>

      {/* Popover Dropdown Drawer */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          left: 0,
          minWidth: '340px',
          width: 'max(100%, 340px)',
          zIndex: 99999,
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.99) 0%, rgba(244, 248, 255, 0.98) 100%)'
            : 'linear-gradient(135deg, rgba(20, 27, 62, 0.98) 0%, rgba(11, 15, 38, 0.99) 100%)',
          borderRadius: '20px',
          border: isLight ? '1.5px solid rgba(190, 218, 250, 0.95)' : '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: isLight
            ? '0 20px 50px rgba(50, 90, 160, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.9)'
            : '0 30px 70px rgba(0, 0, 0, 0.88), inset 0 1px 1px rgba(255, 255, 255, 0.25)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: '14px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
          boxSizing: 'border-box'
        }}>
          
          {/* Track Filter Tabs */}
          <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '5px',
            alignItems: 'center'
          }}>
            {Object.entries(TRACK_CONFIG).map(([key, config]) => {
              const IconComp = config.icon;
              const isActive = activeTab === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '5px 9px',
                    borderRadius: '9px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    background: isActive
                      ? `${config.color}25`
                      : (isLight ? 'rgba(0,0,0,0.04)' : 'rgba(255,255,255,0.06)'),
                    border: isActive ? `1.5px solid ${config.color}` : '1px solid transparent',
                    color: isActive ? config.color : (isLight ? '#475569' : '#cbd5e1'),
                    transition: 'all 0.15s ease'
                  }}
                >
                  <IconComp size={12} />
                  {config.label}
                </button>
              );
            })}
          </div>

          {/* Live Search Input */}
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: isLight ? '#64748b' : '#94a3b8' }} />
            <input
              type="text"
              placeholder="Search subject title, board, degree..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              style={{
                width: '100%',
                padding: '8px 12px 8px 34px',
                borderRadius: '10px',
                background: isLight ? '#f1f5f9' : 'rgba(15, 23, 42, 0.75)',
                border: isLight ? '1px solid rgba(200, 218, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.14)',
                color: isLight ? '#0f172a' : '#ffffff',
                fontSize: '0.82rem',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {/* All Option when using as filter */}
          {value && (
            <div
              onClick={() => handleSelect(null)}
              style={{
                padding: '7px 12px',
                borderRadius: '10px',
                cursor: 'pointer',
                fontSize: '0.78rem',
                fontWeight: 700,
                color: '#38bdf8',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px dashed rgba(56, 189, 248, 0.3)',
                textAlign: 'center'
              }}
            >
              ✦ Show All Subjects (Clear Filter)
            </div>
          )}

          {/* Scrollable Subject Options List */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '250px',
            paddingRight: '4px'
          }}>
            {filteredSubjects.length === 0 ? (
              <div style={{ padding: '18px', textAlign: 'center', color: isLight ? '#64748b' : '#94a3b8', fontSize: '0.82rem' }}>
                No matching subjects found for this track.
              </div>
            ) : (
              filteredSubjects.map(s => {
                const subId = s.id || s._id;
                const isSelected = subId === value;
                const track = (s.educationType || s.track || 'SCHOOL').toUpperCase();
                const trackConf = TRACK_CONFIG[track] || TRACK_CONFIG.SCHOOL;
                const IconComp = trackConf.icon;
                const subColor = s.color || trackConf.color;

                return (
                  <div
                    key={subId}
                    onClick={() => handleSelect(s)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '12px',
                      padding: '10px 14px',
                      borderRadius: '14px',
                      cursor: 'pointer',
                      background: isSelected
                        ? (isLight ? 'rgba(56, 189, 248, 0.16)' : 'rgba(56, 189, 248, 0.22)')
                        : (isLight ? 'rgba(255, 255, 255, 0.85)' : 'rgba(255, 255, 255, 0.05)'),
                      border: isSelected
                        ? `1.5px solid ${subColor}`
                        : (isLight ? '1px solid rgba(215, 230, 248, 0.9)' : '1px solid rgba(255, 255, 255, 0.08)'),
                      boxShadow: isSelected ? `0 4px 15px ${subColor}25` : 'none',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    {/* Left Icon */}
                    <div style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '10px',
                      background: `${subColor}20`,
                      border: `1px solid ${subColor}40`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: subColor,
                      flexShrink: 0
                    }}>
                      <IconComp size={16} />
                    </div>

                    {/* Title & Metadata */}
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
                      <span style={{
                        fontSize: '0.86rem',
                        fontWeight: 700,
                        color: isLight ? '#0f172a' : '#ffffff',
                        lineHeight: 1.3,
                        wordBreak: 'break-word'
                      }}>
                        {s.name}
                      </span>
                      <span style={{ fontSize: '0.73rem', color: isLight ? '#64748b' : '#94a3b8', marginTop: '2px' }}>
                        {getSubMeta(s)}
                      </span>
                    </div>

                    {/* Right Badge & Checkmark */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '3px 9px',
                        borderRadius: '999px',
                        background: `${subColor}18`,
                        color: subColor,
                        border: `1px solid ${subColor}35`,
                        letterSpacing: '0.3px'
                      }}>
                        {track}
                      </span>
                      {isSelected && <Check size={16} color={subColor} style={{ strokeWidth: 2.5 }} />}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SubjectSelect;
