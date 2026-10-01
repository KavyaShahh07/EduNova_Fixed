import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  Sparkles,
  Award,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Play,
  RotateCcw,
  Search,
  Filter,
  Layers,
  BookOpen,
  Zap,
  TrendingUp,
  ChevronRight,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { quizApi, subjectApi, gamificationApi } from '../../lib/apiClient';
import { EduNovaHeroBanner } from '../../components/common/EduNovaHeroBanner';
import { Button } from '../../components/common/Button';
import { SubjectSelect } from '../../components/common/SubjectSelect';

export const QuizzesPage = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [myAttempts, setMyAttempts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState(null);

  // Search & Filter
  const [search, setSearch] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('ALL');
  const [activeTab, setActiveTab] = useState('catalog'); // 'catalog' | 'history'

  // AI Quiz Generator Modal
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [aiForm, setAiForm] = useState({
    subjectId: '',
    topic: '',
    difficulty: 'MEDIUM',
    count: 5
  });

  // Active Quiz Execution State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  const notify = (message, type = 'success') => {
    setNotice({ message, type });
    setTimeout(() => setNotice(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [quizzesRes, subsRes, attemptsRes] = await Promise.all([
        quizApi.getQuizzes().catch(() => ({ data: [] })),
        subjectApi.getAllSubjects().catch(() => ({ data: [] })),
        quizApi.getMyAttempts().catch(() => ({ data: [] }))
      ]);

      const qList = Array.isArray(quizzesRes?.data) ? quizzesRes.data : (Array.isArray(quizzesRes) ? quizzesRes : []);
      const sList = Array.isArray(subsRes?.data) ? subsRes.data : (Array.isArray(subsRes) ? subsRes : []);
      const aList = Array.isArray(attemptsRes?.data) ? attemptsRes.data : (Array.isArray(attemptsRes) ? attemptsRes : []);

      setQuizzes(qList);
      setSubjects(sList);
      setMyAttempts(aList);
      if (sList.length > 0 && !aiForm.subjectId) {
        setAiForm(prev => ({ ...prev, subjectId: sList[0].id }));
      }
    } catch (err) {
      notify(err.message || 'Failed to load quizzes', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartQuiz = async (quiz) => {
    setLoading(true);
    try {
      const full = await quizApi.getQuiz(quiz.id);
      const data = full?.data || quiz;
      if (!data.questions || data.questions.length === 0) {
        notify('This quiz does not have any questions registered yet.', 'error');
        return;
      }
      setActiveQuiz(data);
      setCurrentQIndex(0);
      setUserAnswers({});
      setQuizResult(null);
    } catch (err) {
      notify(err.message || 'Could not load quiz questions', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiQuiz = async (e) => {
    e.preventDefault();
    if (!aiForm.subjectId) {
      notify('Please select a subject', 'error');
      return;
    }
    setGenerating(true);
    try {
      const res = await quizApi.generateAiQuiz({
        subjectId: aiForm.subjectId,
        topic: aiForm.topic.trim() || undefined,
        difficulty: aiForm.difficulty,
        count: Number(aiForm.count) || 5
      });

      if (res && res.data) {
        notify('Gemini AI generated a new quiz and saved it to the database!');
        setIsAiModalOpen(false);
        await loadData();
        // Immediately start the new AI quiz
        setActiveQuiz(res.data);
        setCurrentQIndex(0);
        setUserAnswers({});
        setQuizResult(null);
      }
    } catch (err) {
      notify(err.message || 'Gemini AI Quiz generation failed. Please try again.', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const handleSelectOption = (optIndex) => {
    setUserAnswers(prev => ({
      ...prev,
      [currentQIndex]: optIndex
    }));
  };

  const handleSubmitQuiz = async () => {
    if (!activeQuiz || !activeQuiz.questions) return;
    setSubmitting(true);
    try {
      const formattedAnswers = activeQuiz.questions.map((q, idx) => ({
        questionId: q.id,
        selectedOptionIndex: typeof userAnswers[idx] === 'number' ? userAnswers[idx] : -1
      }));
      const res = await quizApi.submitQuiz(activeQuiz.id, formattedAnswers);
      if (res && res.data) {
        setQuizResult(res.data);
        // Refresh attempts & metrics
        quizApi.getMyAttempts().then(r => setMyAttempts(r.data || []));
      }
    } catch (err) {
      notify(err.message || 'Failed to submit quiz answers', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredQuizzes = quizzes.filter(q => {
    const matchesSearch = !search ||
      q.title?.toLowerCase().includes(search.toLowerCase()) ||
      q.subject?.name?.toLowerCase().includes(search.toLowerCase()) ||
      q.topic?.title?.toLowerCase().includes(search.toLowerCase());

    const matchesSub = selectedSubjectId === 'ALL' || q.subjectId === selectedSubjectId;

    return matchesSearch && matchesSub;
  });

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '16px 20px 80px' }}>
      <EduNovaHeroBanner
        title="Interactive Quizzes & Question Bank"
        subtitle="Challenge your mastery with curriculum-aligned diagnostic tests or generate unlimited new assessments with Gemini AI."
        badge="Adaptive Assessment Engine"
        badgeIcon={HelpCircle}
        primaryAction={{
          label: 'Generate with Gemini AI',
          onClick: () => setIsAiModalOpen(true),
          icon: Sparkles
        }}
        secondaryAction={{
          label: 'Refresh Quizzes',
          onClick: loadData,
          icon: RefreshCw
        }}
      />

      {notice && (
        <div style={{
          padding: '14px 20px',
          borderRadius: '16px',
          marginTop: '20px',
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

      {/* ── ACTIVE QUIZ RUNNER ── */}
      {activeQuiz ? (
        <div style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '28px',
          marginTop: '24px',
          boxShadow: '0 12px 36px rgba(0,0,0,0.1)'
        }}>
          {!quizResult ? (
            <div>
              {/* Runner Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                <div>
                  <span style={{
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    color: 'var(--accent-primary)',
                    background: 'rgba(2, 132, 199, 0.12)',
                    padding: '4px 10px',
                    borderRadius: '8px'
                  }}>
                    {activeQuiz.subject?.name || 'Quiz'} · {activeQuiz.difficulty || 'MEDIUM'}
                  </span>
                  <h2 style={{ margin: '8px 0 0 0', fontSize: '1.4rem', fontWeight: 800 }}>
                    {activeQuiz.title}
                  </h2>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 700 }}>
                    Question {currentQIndex + 1} of {activeQuiz.questions.length}
                  </span>
                  <Button variant="outline" size="sm" onClick={() => setActiveQuiz(null)}>
                    Exit Quiz
                  </Button>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ height: '6px', width: '100%', background: 'var(--bg-tertiary)', borderRadius: '6px', overflow: 'hidden', marginBottom: '28px' }}>
                <div style={{
                  height: '100%',
                  width: `${((currentQIndex + 1) / activeQuiz.questions.length) * 100}%`,
                  background: 'linear-gradient(90deg, #0284c7, #10b981)',
                  transition: 'width 0.3s ease'
                }} />
              </div>

              {/* Question Box */}
              {activeQuiz.questions[currentQIndex] && (
                <div>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700, lineHeight: 1.5, marginBottom: '24px', color: 'var(--text-primary)' }}>
                    {activeQuiz.questions[currentQIndex].questionText || activeQuiz.questions[currentQIndex].text}
                  </h3>

                  {/* Options */}
                  <div style={{ display: 'grid', gap: '12px' }}>
                    {(activeQuiz.questions[currentQIndex].options || []).map((opt, optIdx) => {
                      const isSelected = userAnswers[currentQIndex] === optIdx;
                      return (
                        <div
                          key={optIdx}
                          onClick={() => handleSelectOption(optIdx)}
                          style={{
                            padding: '16px 20px',
                            borderRadius: '14px',
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--border-color)'}`,
                            background: isSelected ? 'rgba(2, 132, 199, 0.1)' : 'var(--bg-primary)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '14px',
                            transition: 'all 0.15s ease'
                          }}
                        >
                          <div style={{
                            width: '28px',
                            height: '28px',
                            borderRadius: '50%',
                            border: `2px solid ${isSelected ? 'var(--accent-primary)' : 'var(--text-muted)'}`,
                            background: isSelected ? 'var(--accent-primary)' : 'transparent',
                            color: isSelected ? '#fff' : 'inherit',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 800,
                            fontSize: '0.85rem'
                          }}>
                            {String.fromCharCode(65 + optIdx)}
                          </div>
                          <span style={{ fontSize: '0.98rem', fontWeight: isSelected ? 700 : 500 }}>
                            {opt}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Navigation Controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '32px' }}>
                <Button
                  variant="outline"
                  disabled={currentQIndex === 0}
                  onClick={() => setCurrentQIndex(prev => prev - 1)}
                >
                  Previous
                </Button>

                {currentQIndex < activeQuiz.questions.length - 1 ? (
                  <Button
                    onClick={() => setCurrentQIndex(prev => prev + 1)}
                  >
                    Next Question
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmitQuiz}
                    disabled={submitting}
                    style={{ background: '#10b981' }}
                  >
                    {submitting ? 'Submitting...' : 'Complete & Submit Quiz'}
                  </Button>
                )}
              </div>
            </div>
          ) : (
            /* Results Screen */
            <div style={{ textAlign: 'center', padding: '20px 0' }}>
              <div style={{
                width: '72px',
                height: '72px',
                borderRadius: '50%',
                background: quizResult.accuracy >= 60 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)',
                color: quizResult.accuracy >= 60 ? '#10b981' : '#ef4444',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}>
                <Award size={36} />
              </div>

              <h2 style={{ fontSize: '1.8rem', fontWeight: 800, margin: '0 0 6px 0' }}>
                {quizResult.accuracy >= 60 ? 'Quiz Completed Successfully!' : 'Quiz Attempt Finished'}
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', margin: '0 0 24px 0' }}>
                Score: <strong>{quizResult.score} / {quizResult.totalQuestions}</strong> ({quizResult.accuracy}%)
              </p>

              {quizResult.xpAwarded > 0 && (
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 18px',
                  borderRadius: '9999px',
                  background: 'rgba(245, 158, 11, 0.15)',
                  color: '#f59e0b',
                  fontWeight: 800,
                  fontSize: '0.92rem',
                  marginBottom: '28px'
                }}>
                  <Zap size={18} /> +{quizResult.xpAwarded} XP Recorded in Database!
                </div>
              )}

              {/* Detailed Question Review */}
              {quizResult.detailedReview && quizResult.detailedReview.length > 0 && (
                <div style={{ textAlign: 'left', marginTop: '24px', display: 'grid', gap: '14px' }}>
                  <h4 style={{ margin: '0 0 10px 0', fontSize: '1.1rem', fontWeight: 800 }}>Answer Review & Explanations</h4>
                  {quizResult.detailedReview.map((rev, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: '16px 18px',
                        borderRadius: '14px',
                        border: `1px solid ${rev.isCorrect ? 'rgba(16, 185, 129, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
                        background: rev.isCorrect ? 'rgba(16, 185, 129, 0.05)' : 'rgba(239, 68, 68, 0.05)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        {rev.isCorrect ? <CheckCircle2 size={16} color="#10b981" /> : <AlertTriangle size={16} color="#ef4444" />}
                        <strong style={{ fontSize: '0.95rem' }}>Question {idx + 1}: {rev.questionText}</strong>
                      </div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                        Your Answer: <strong>{rev.userOption || 'Unanswered'}</strong> · Correct: <strong>{rev.correctOption}</strong>
                      </div>
                      {rev.explanation && (
                        <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginLeft: '24px', marginTop: '4px' }}>
                          💡 <em>{rev.explanation}</em>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
                <Button onClick={() => setActiveQuiz(null)}>
                  Return to Quizzes Catalog
                </Button>
                <Button variant="outline" onClick={() => handleStartQuiz(activeQuiz)}>
                  <RotateCcw size={16} /> Retake Quiz
                </Button>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* ── CATALOG VIEW ── */
        <div style={{ marginTop: '28px' }}>
          {/* Controls Bar */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '14px',
            marginBottom: '20px'
          }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => setActiveTab('catalog')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'catalog' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: activeTab === 'catalog' ? '#fff' : 'inherit',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                All Quizzes ({filteredQuizzes.length})
              </button>
              <button
                onClick={() => setActiveTab('history')}
                style={{
                  padding: '9px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  background: activeTab === 'history' ? 'var(--accent-primary)' : 'var(--bg-secondary)',
                  color: activeTab === 'history' ? '#fff' : 'inherit',
                  fontWeight: 700,
                  fontSize: '0.88rem',
                  cursor: 'pointer'
                }}
              >
                My Attempts ({myAttempts.length})
              </button>
            </div>

            {/* Search and Subject Filter */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <Search size={15} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input
                  type="text"
                  placeholder="Search quizzes..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    padding: '8px 12px 8px 32px',
                    borderRadius: '10px',
                    border: '1px solid var(--border-color)',
                    background: 'var(--bg-secondary)',
                    color: 'inherit',
                    fontSize: '0.85rem'
                  }}
                />
              </div>

              <select
                value={selectedSubjectId}
                onChange={(e) => setSelectedSubjectId(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-color)',
                  background: 'var(--bg-secondary)',
                  color: 'inherit',
                  fontSize: '0.85rem'
                }}
              >
                <option value="ALL">All Subjects</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          {activeTab === 'catalog' ? (
            loading ? (
              <div style={{ textAlign: 'center', padding: '60px' }}>
                <RefreshCw size={32} className="spin" style={{ color: 'var(--accent-primary)', marginBottom: '12px' }} />
                <p style={{ color: 'var(--text-muted)' }}>Loading quizzes from database...</p>
              </div>
            ) : filteredQuizzes.length === 0 ? (
              <div style={{
                textAlign: 'center',
                padding: '60px 20px',
                background: 'var(--bg-secondary)',
                borderRadius: '20px',
                border: '1px dashed var(--border-color)'
              }}>
                <HelpCircle size={44} style={{ color: 'var(--accent-primary)', opacity: 0.6, marginBottom: '12px' }} />
                <h4 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 800 }}>No Quizzes Available</h4>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', margin: '6px 0 16px 0' }}>
                  Generate an AI quiz on any topic using Google Gemini or wait for instructors to publish quizzes.
                </p>
                <Button onClick={() => setIsAiModalOpen(true)}>
                  <Sparkles size={16} /> Generate Quiz with Gemini AI
                </Button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '18px' }}>
                {filteredQuizzes.map(q => (
                  <div
                    key={q.id}
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border-color)',
                      borderRadius: '18px',
                      padding: '20px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      gap: '16px'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: 'rgba(2, 132, 199, 0.12)',
                          color: 'var(--accent-primary)'
                        }}>
                          {q.subject?.name || 'General Subject'}
                        </span>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '8px',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          background: q.difficulty === 'ADVANCED' ? 'rgba(239, 68, 68, 0.12)' : 'rgba(16, 185, 129, 0.12)',
                          color: q.difficulty === 'ADVANCED' ? '#ef4444' : '#10b981'
                        }}>
                          {q.difficulty || 'MEDIUM'}
                        </span>
                      </div>

                      <h4 style={{ margin: '4px 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>
                        {q.title}
                      </h4>

                      {q.topic?.title && (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px' }}>
                          Topic: <strong>{q.topic.title}</strong>
                        </span>
                      )}

                      <div style={{ display: 'flex', gap: '12px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        <span>❓ {q.totalQuestions || q._count?.questions || 5} Questions</span>
                        <span>👥 {q.attemptsCount || q._count?.attempts || 0} Attempts</span>
                      </div>
                    </div>

                    <Button onClick={() => handleStartQuiz(q)}>
                      <Play size={15} /> Start Quiz
                    </Button>
                  </div>
                ))}
              </div>
            )
          ) : (
            /* My Attempts List */
            <div style={{ background: 'var(--bg-secondary)', borderRadius: '20px', border: '1px solid var(--border-color)', padding: '24px' }}>
              <h3 style={{ margin: '0 0 16px 0', fontSize: '1.2rem', fontWeight: 800 }}>
                Your Quiz Performance & History ({myAttempts.length})
              </h3>

              {myAttempts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  You haven't attempted any quizzes yet. Take a quiz to record your score!
                </div>
              ) : (
                <div style={{ display: 'grid', gap: '12px' }}>
                  {myAttempts.map(att => (
                    <div
                      key={att.id}
                      style={{
                        padding: '14px 18px',
                        borderRadius: '14px',
                        border: '1px solid var(--border-color)',
                        background: 'var(--bg-primary)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: '14px',
                        flexWrap: 'wrap'
                      }}
                    >
                      <div>
                        <strong style={{ fontSize: '1rem' }}>{att.quiz?.title || 'Subject Quiz'}</strong>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Date: {new Date(att.completedAt || att.createdAt).toLocaleDateString()} · Subject: {att.quiz?.subject?.name || 'Academic'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{
                            fontSize: '1.1rem',
                            fontWeight: 800,
                            color: (att.score / Math.max(1, att.totalQuestions)) >= 0.6 ? '#10b981' : '#f59e0b'
                          }}>
                            {Math.round((att.score / Math.max(1, att.totalQuestions)) * 100)}%
                          </span>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {att.score} / {att.totalQuestions} Correct
                          </div>
                        </div>

                        {att.xpAwarded > 0 && (
                          <span style={{ padding: '4px 10px', borderRadius: '8px', background: 'rgba(245, 158, 11, 0.15)', color: '#f59e0b', fontSize: '0.75rem', fontWeight: 800 }}>
                            +{att.xpAwarded} XP
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── AI QUIZ GENERATION MODAL ── */}
      {isAiModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(8px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 99999,
          padding: '20px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-color)',
            borderRadius: '20px',
            padding: '24px',
            maxWidth: '520px',
            width: '100%',
            boxShadow: '0 12px 36px rgba(0,0,0,0.4)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={20} color="var(--accent-primary)" />
                Generate Quiz with Gemini AI
              </h3>
              <button
                onClick={() => setIsAiModalOpen(false)}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '0 0 16px 0' }}>
              Google Gemini AI will dynamically generate original multiple-choice questions grounded in curriculum subjects and store the quiz directly in PostgreSQL.
            </p>

            <form onSubmit={handleGenerateAiQuiz} style={{ display: 'grid', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Select Subject *
                </label>
                <SubjectSelect
                  value={aiForm.subjectId}
                  onChange={(e, val) => setAiForm({ ...aiForm, subjectId: val || e.target.value })}
                  subjects={subjects}
                  placeholder="Select Subject..."
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                  Topic or Chapter Focus (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Newton Laws of Motion, SQL Joins, Organic Reactions"
                  value={aiForm.topic}
                  onChange={(e) => setAiForm({ ...aiForm, topic: e.target.value })}
                  style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Difficulty
                  </label>
                  <select
                    value={aiForm.difficulty}
                    onChange={(e) => setAiForm({ ...aiForm, difficulty: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
                  >
                    <option value="BEGINNER">BEGINNER</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="ADVANCED">ADVANCED</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', marginBottom: '6px' }}>
                    Number of Questions
                  </label>
                  <select
                    value={aiForm.count}
                    onChange={(e) => setAiForm({ ...aiForm, count: e.target.value })}
                    style={{ width: '100%', padding: '10px 12px', borderRadius: '10px', border: '1px solid var(--border-color)', background: 'var(--bg-primary)', color: 'inherit' }}
                  >
                    <option value={5}>5 Questions</option>
                    <option value={10}>10 Questions</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <Button type="button" variant="outline" onClick={() => setIsAiModalOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={generating}>
                  {generating ? (
                    <>
                      <RefreshCw size={15} className="spin" /> Generating with Gemini...
                    </>
                  ) : (
                    <>
                      <Sparkles size={15} /> Generate & Start Quiz
                    </>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default QuizzesPage;
