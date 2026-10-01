import React, { useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  Plus,
  Clock,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Play,
  Edit3,
  Trash2,
  X,
  Tag,
  Sparkles,
  BookOpen,
  Award,
  Layers,
  Filter
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { Button } from '../common/Button';
import { normalizeDateStr } from '../../utils/dateUtils';

export const TaskCalendarView = ({
  tasks = [],
  onSelectTask,
  onAddTaskForDate,
  onEditTask,
  onDeleteTask,
  onUpdateStatus,
  onStartFocus,
  onToggleSubtask
}) => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedTaskDetails, setSelectedTaskDetails] = useState(null);

  const handleToggleSubtaskInModal = (subtaskId) => {
    if (!selectedTaskDetails) return;
    const updatedSubtasks = (selectedTaskDetails.subtasks || []).map(s => {
      if (s.id === subtaskId) {
        return { ...s, completed: !s.completed };
      }
      return s;
    });

    const completedCount = updatedSubtasks.filter(s => s.completed).length;
    const newStatus = completedCount === updatedSubtasks.length ? 'COMPLETED' : (completedCount > 0 ? 'IN_PROGRESS' : selectedTaskDetails.status);

    setSelectedTaskDetails({
      ...selectedTaskDetails,
      subtasks: updatedSubtasks,
      status: newStatus
    });

    if (onToggleSubtask) {
      onToggleSubtask(selectedTaskDetails.id, subtaskId);
    }
  };

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const totalDays = new Date(year, month + 1, 0).getDate();
    return { firstDay, totalDays, year, month };
  };

  const { firstDay, totalDays, year, month } = getDaysInMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(year, month + 1, 1));
  };

  const goToToday = () => {
    setCurrentMonth(new Date());
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysGrid = [];
  for (let i = 0; i < firstDay; i++) {
    daysGrid.push(null);
  }
  for (let d = 1; d <= totalDays; d++) {
    daysGrid.push(d);
  }

  // Get tasks for a specific day
  const getTasksForDay = (day) => {
    if (!day) return [];
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    
    return tasks.filter((t) => {
      if (!t.dueDate) return false;
      const tDate = normalizeDateStr(t.dueDate);
      return tDate === dateStr;
    });
  };

  const formatDateStr = (day) => {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'URGENT': return '#f43f5e';
      case 'HIGH': return '#f59e0b';
      case 'MEDIUM': return '#38bdf8';
      case 'LOW': return '#34d399';
      default: return '#64748b';
    }
  };

  const getPriorityBadgeBg = (priority) => {
    switch (priority) {
      case 'URGENT': return 'rgba(244, 63, 94, 0.18)';
      case 'HIGH': return 'rgba(245, 158, 11, 0.18)';
      case 'MEDIUM': return 'rgba(56, 189, 248, 0.18)';
      case 'LOW': return 'rgba(52, 211, 153, 0.18)';
      default: return 'rgba(148, 163, 184, 0.18)';
    }
  };

  // Get subjects list for subject filter dropdown
  const uniqueSubjects = Array.from(new Set(tasks.map(t => t.subject).filter(Boolean)));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* MAIN CALENDAR CONTAINER */}

      {/* 2. MAIN CALENDAR CONTAINER */}
      <div style={{
        background: isLight ? 'rgba(255, 255, 255, 0.90)' : 'rgba(15, 23, 42, 0.75)',
        backdropFilter: 'blur(28px)',
        WebkitBackdropFilter: 'blur(28px)',
        border: isLight ? '1.5px solid rgba(200, 220, 240, 0.9)' : '1px solid rgba(255, 255, 255, 0.16)',
        borderRadius: '24px',
        padding: '24px',
        boxShadow: isLight ? '0 16px 40px rgba(64, 100, 160, 0.08)' : '0 16px 40px rgba(0, 0, 0, 0.4)'
      }}>
        {/* Calendar Navigation Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
              <CalIcon size={24} color="#38bdf8" /> {monthNames[month]} {year}
            </h3>
            <button
              onClick={goToToday}
              style={{
                padding: '4px 10px',
                borderRadius: '10px',
                background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.18)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                color: isLight ? '#0284c7' : '#38bdf8',
                fontSize: '0.75rem',
                fontWeight: 800,
                cursor: 'pointer'
              }}
            >
              Today
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {onAddTaskForDate && (
              <Button
                onClick={() => onAddTaskForDate(formatDateStr(new Date().getDate()))}
                style={{
                  padding: '8px 16px',
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #0284c7 0%, #4f46e5 100%)',
                  color: '#ffffff',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <Plus size={16} /> Add Task
              </Button>
            )}

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={prevMonth}
                title="Previous Month"
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <ChevronLeft size={18} />
              </button>
              <button
                onClick={nextMonth}
                title="Next Month"
                style={{
                  padding: '8px 14px',
                  borderRadius: '12px',
                  background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.12)',
                  color: isLight ? '#0f172a' : '#ffffff',
                  cursor: 'pointer'
                }}
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Weekday Names Bar */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px', marginBottom: '12px', textAlign: 'center' }}>
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((w) => (
            <div key={w} style={{ fontSize: '0.8rem', fontWeight: 800, color: isLight ? '#64748b' : '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              {w}
            </div>
          ))}
        </div>

        {/* Month Days Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '8px' }}>
          {daysGrid.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} style={{ minHeight: '110px', borderRadius: '16px', background: 'transparent' }} />;
            }

            const dayTasks = getTasksForDay(day);
            const dateStr = formatDateStr(day);
            const isToday = new Date().getDate() === day && new Date().getMonth() === month && new Date().getFullYear() === year;

            return (
              <div
                key={`day-${day}`}
                style={{
                  minHeight: '115px',
                  borderRadius: '16px',
                  padding: '8px 10px',
                  background: isToday
                    ? (isLight ? 'rgba(56, 189, 248, 0.12)' : 'rgba(56, 189, 248, 0.18)')
                    : (isLight ? '#ffffff' : 'rgba(255,255,255,0.04)'),
                  border: isToday
                    ? '2px solid #38bdf8'
                    : (isLight ? '1px solid rgba(220,230,245,0.85)' : '1px solid rgba(255,255,255,0.08)'),
                  display: 'flex',
                  flexDirection: 'column',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  boxShadow: isToday ? '0 0 16px rgba(56, 189, 248, 0.25)' : 'none'
                }}
              >
                {/* Cell Top Bar: Date Number + Quick Add Task Button */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{
                    fontSize: '0.85rem',
                    fontWeight: isToday ? 900 : 700,
                    color: isToday ? '#38bdf8' : (isLight ? '#0f172a' : '#ffffff'),
                    background: isToday ? (isLight ? 'rgba(2, 132, 199, 0.15)' : 'rgba(56, 189, 248, 0.25)') : 'transparent',
                    padding: isToday ? '2px 8px' : '0',
                    borderRadius: '8px'
                  }}>
                    {day}
                  </span>

                  {dayTasks.length > 0 && (
                    <span style={{
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: '10px',
                      background: isLight ? 'rgba(99, 102, 241, 0.12)' : 'rgba(99, 102, 241, 0.25)',
                      color: isLight ? '#4f46e5' : '#818cf8'
                    }}>
                      {dayTasks.length} {dayTasks.length === 1 ? 'task' : 'tasks'}
                    </span>
                  )}

                  {onAddTaskForDate && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddTaskForDate(dateStr);
                      }}
                      title={`Add task for ${dateStr}`}
                      style={{
                        width: '22px',
                        height: '22px',
                        borderRadius: '6px',
                        background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.1)',
                        border: 'none',
                        color: isLight ? '#0284c7' : '#38bdf8',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.15)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                    >
                      <Plus size={14} />
                    </button>
                  )}
                </div>

                {/* Day Task Badges List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', maxHeight: '90px' }}>
                  {dayTasks.map((t) => {
                    const isDone = t.status === 'COMPLETED';
                    const priorityColor = getPriorityColor(t.priority);

                    return (
                      <div
                        key={t.id}
                        onClick={() => setSelectedTaskDetails(t)}
                        title={`${t.title} (${t.priority || 'MEDIUM'} Priority) - Click to view details`}
                        style={{
                          padding: '4px 6px',
                          borderRadius: '8px',
                          background: isDone
                            ? (isLight ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.2)')
                            : (isLight ? 'rgba(240, 246, 255, 0.95)' : 'rgba(30, 41, 59, 0.85)'),
                          borderLeft: `3px solid ${priorityColor}`,
                          borderTop: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : (isLight ? '1px solid rgba(220,230,245,0.9)' : '1px solid rgba(255,255,255,0.1)'),
                          borderRight: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : (isLight ? '1px solid rgba(220,230,245,0.9)' : '1px solid rgba(255,255,255,0.1)'),
                          borderBottom: isDone ? '1px solid rgba(16, 185, 129, 0.3)' : (isLight ? '1px solid rgba(220,230,245,0.9)' : '1px solid rgba(255,255,255,0.1)'),
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: isLight ? '#0f172a' : '#ffffff',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '4px',
                          transition: 'transform 0.15s ease, background 0.15s ease',
                          textDecoration: isDone ? 'line-through' : 'none',
                          opacity: isDone ? 0.75 : 1
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-1px)'}
                        onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                      >
                        <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                          {isDone ? '✓ ' : ''}{t.title}
                        </span>
                        {t.xpReward > 0 && (
                          <span style={{ fontSize: '0.62rem', color: '#f59e0b', fontWeight: 800, flexShrink: 0 }}>
                            +{t.xpReward}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. TASK FULL INFO QUICK OVERVIEW MODAL */}
      {selectedTaskDetails && (
        <div
          onClick={() => setSelectedTaskDetails(null)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: isLight ? 'rgba(15, 23, 42, 0.55)' : 'rgba(5, 8, 22, 0.85)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            cursor: 'pointer'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: '560px',
              background: isLight ? '#ffffff' : '#0f172a',
              border: isLight ? '1.5px solid rgba(200, 220, 240, 0.95)' : '1px solid rgba(255, 255, 255, 0.18)',
              borderRadius: '24px',
              padding: '28px',
              boxShadow: isLight ? '0 24px 60px rgba(15, 23, 42, 0.25)' : '0 24px 60px rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: '20px',
              animation: 'modalSlideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
              cursor: 'default'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: getPriorityBadgeBg(selectedTaskDetails.priority),
                    color: getPriorityColor(selectedTaskDetails.priority)
                  }}>
                    {selectedTaskDetails.priority || 'MEDIUM'} PRIORITY
                  </span>
                  <span style={{
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: '8px',
                    background: isLight ? 'rgba(2, 132, 199, 0.12)' : 'rgba(56, 189, 248, 0.18)',
                    color: isLight ? '#0284c7' : '#38bdf8'
                  }}>
                    {selectedTaskDetails.type || 'Study'}
                  </span>
                  {selectedTaskDetails.status === 'COMPLETED' && (
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      padding: '3px 10px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.18)',
                      color: '#10b981'
                    }}>
                      ✓ COMPLETED
                    </span>
                  )}
                </div>

                <h3 style={{ fontSize: '1.35rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: '4px 0 0', lineHeight: 1.3 }}>
                  {selectedTaskDetails.title}
                </h3>
              </div>

              <button
                onClick={() => setSelectedTaskDetails(null)}
                style={{
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.1)',
                  border: 'none',
                  borderRadius: '10px',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Quick Meta Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
              gap: '12px',
              background: isLight ? '#f8fafc' : 'rgba(255, 255, 255, 0.04)',
              borderRadius: '16px',
              padding: '14px',
              border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <BookOpen size={16} color="#38bdf8" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>Subject</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>{selectedTaskDetails.subject || 'General'}</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CalIcon size={16} color="#06b6d4" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>Due Date</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>
                    {selectedTaskDetails.dueDate ? selectedTaskDetails.dueDate.split('T')[0] : 'No date'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={16} color="#f59e0b" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>Duration</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: isLight ? '#0f172a' : '#ffffff' }}>{selectedTaskDetails.estimatedDuration || 30} mins</div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Award size={16} color="#10b981" />
                <div>
                  <div style={{ fontSize: '0.7rem', color: isLight ? '#64748b' : '#94a3b8', fontWeight: 700 }}>Reward</div>
                  <div style={{ fontSize: '0.82rem', fontWeight: 800, color: '#10b981' }}>+{selectedTaskDetails.xpReward || 50} XP</div>
                </div>
              </div>
            </div>

            {/* Description / Notes */}
            {selectedTaskDetails.description && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isLight ? '#475569' : '#cbd5e1' }}>
                  Description & Context:
                </span>
                <p style={{
                  fontSize: '0.88rem',
                  color: isLight ? '#1e293b' : '#e2e8f0',
                  margin: 0,
                  lineHeight: 1.5,
                  background: isLight ? '#f1f5f9' : 'rgba(255, 255, 255, 0.03)',
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255, 255, 255, 0.06)'
                }}>
                  {selectedTaskDetails.description}
                </p>
              </div>
            )}

            {/* Subtasks Checklist */}
            {Array.isArray(selectedTaskDetails.subtasks) && selectedTaskDetails.subtasks.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: isLight ? '#475569' : '#cbd5e1' }}>
                  Subtasks Checklist ({selectedTaskDetails.subtasks.filter(s => s.completed).length}/{selectedTaskDetails.subtasks.length}):
                </span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedTaskDetails.subtasks.map((st, i) => (
                    <div
                      key={st.id || i}
                      onClick={() => handleToggleSubtaskInModal(st.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        background: isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)',
                        border: isLight ? '1px solid #e2e8f0' : '1px solid rgba(255,255,255,0.1)',
                        fontSize: '0.84rem',
                        color: isLight ? '#0f172a' : '#ffffff',
                        cursor: 'pointer',
                        transition: 'all 0.15s ease'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = isLight ? 'rgba(241, 245, 249, 0.9)' : 'rgba(255,255,255,0.12)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = isLight ? '#f8fafc' : 'rgba(255,255,255,0.06)'}
                    >
                      {st.completed ? <CheckCircle2 size={18} color="#10b981" /> : <Circle size={18} color="#94a3b8" />}
                      <span style={{ textDecoration: st.completed ? 'line-through' : 'none', opacity: st.completed ? 0.7 : 1, fontWeight: 600 }}>
                        {st.title}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons Footer */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '10px', flexWrap: 'wrap', marginTop: '6px' }}>
              <div style={{ display: 'flex', gap: '8px' }}>
                {onUpdateStatus && (
                  <Button
                    onClick={() => {
                      const nextStatus = selectedTaskDetails.status === 'COMPLETED' ? 'NOT_STARTED' : 'COMPLETED';
                      onUpdateStatus(selectedTaskDetails.id, nextStatus);
                      setSelectedTaskDetails(null);
                    }}
                    style={{
                      background: selectedTaskDetails.status === 'COMPLETED' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.2)',
                      color: selectedTaskDetails.status === 'COMPLETED' ? '#ef4444' : '#10b981',
                      border: selectedTaskDetails.status === 'COMPLETED' ? '1px solid rgba(239, 68, 68, 0.4)' : '1px solid rgba(16, 185, 129, 0.4)',
                      fontWeight: 800,
                      fontSize: '0.8rem'
                    }}
                  >
                    {selectedTaskDetails.status === 'COMPLETED' ? 'Mark Incomplete' : '✓ Mark Complete'}
                  </Button>
                )}

                {onStartFocus && (
                  <Button
                    onClick={() => {
                      onStartFocus(selectedTaskDetails);
                      setSelectedTaskDetails(null);
                    }}
                    style={{
                      background: 'rgba(56, 189, 248, 0.15)',
                      color: '#38bdf8',
                      border: '1px solid rgba(56, 189, 248, 0.4)',
                      fontWeight: 800,
                      fontSize: '0.8rem'
                    }}
                  >
                    <Play size={14} /> Start Focus
                  </Button>
                )}
              </div>

              <div style={{ display: 'flex', gap: '8px' }}>
                {onEditTask && (
                  <button
                    onClick={() => {
                      onEditTask(selectedTaskDetails);
                      setSelectedTaskDetails(null);
                    }}
                    title="Edit Task"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: isLight ? '#f1f5f9' : 'rgba(255,255,255,0.08)',
                      border: isLight ? '1px solid #cbd5e1' : '1px solid rgba(255,255,255,0.12)',
                      color: isLight ? '#0f172a' : '#ffffff',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}
                  >
                    <Edit3 size={14} /> Edit
                  </button>
                )}

                {onDeleteTask && (
                  <button
                    onClick={() => {
                      onDeleteTask(selectedTaskDetails.id);
                      setSelectedTaskDetails(null);
                    }}
                    title="Delete Task"
                    style={{
                      padding: '8px 12px',
                      borderRadius: '10px',
                      background: 'rgba(239, 68, 68, 0.15)',
                      border: '1px solid rgba(239, 68, 68, 0.3)',
                      color: '#ef4444',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '0.78rem',
                      fontWeight: 800
                    }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskCalendarView;
