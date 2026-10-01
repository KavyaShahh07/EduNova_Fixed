import React, { useState, useEffect, useRef } from 'react';
import {
  Bot,
  Send,
  RefreshCw,
  Sparkles,
  Target,
  MessageSquare,
  Plus,
  X,
  User,
  PanelRight,
  BookOpen
} from 'lucide-react';
import { useAI } from '../../context/AIContext';
import { useLearner } from '../../context/LearnerContext';
import { useTheme } from '../../context/ThemeContext';
import { useSubjects } from '../../hooks/useSubjects';
import { ChatMessage } from '../../components/ai/ChatMessage';
import { SuggestedPrompts } from '../../components/ai/SuggestedPrompts';
import { Card } from '../../components/common/Card';
import { useNavigate } from 'react-router-dom';
import { EduNovaHeroBanner } from '../../components/common/EduNovaHeroBanner';
import { aiApi } from '../../lib/apiClient';

export const AIAssistantPage = () => {
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { messages, sendMessage, isTyping, resetChat } = useAI();
  const { learner, learnerType } = useLearner();
  const { selectedSubjects } = useSubjects();
  const [inputText, setInputText] = useState('');
  const [activeSessionId, setActiveSessionId] = useState('current');
  const [historyTopics, setHistoryTopics] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showContextPanel, setShowContextPanel] = useState(true);
  const chatContainerRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    async function loadHistory() {
      try {
        setLoadingHistory(true);
        const res = await aiApi.getHistory({ limit: 10 });
        if (isMounted && res?.success && res.data?.history) {
          const formatted = res.data.history.map(conv => ({
            id: conv.id,
            title: conv.title || 'Study Discussion',
            time: conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Recent',
            category: conv.messages?.[0]?.content ? `${conv.messages.length} messages` : 'Socratic Chat'
          }));
          setHistoryTopics(formatted);
        }
      } catch (err) {
        console.warn('Failed to load chat history:', err?.message);
      } finally {
        if (isMounted) setLoadingHistory(false);
      }
    }
    loadHistory();
    return () => { isMounted = false; };
  }, []);

  const quickActionBtns = [
    { label: 'Explain this', prompt: 'Explain this concept clearly and concisely with key definitions.' },
    { label: 'Give me an example', prompt: 'Provide a real-world concrete code or visual example.' },
    { label: 'Quiz me', prompt: 'Create a 3-question practice quiz on this topic.' },
    { label: 'Give me practice questions', prompt: 'Give me 3 conceptual practice questions with step-by-step solutions.' },
    { label: 'Simplify it', prompt: 'Simplify this concept for a beginner using an intuitive analogy.' },
    { label: 'Show me step-by-step', prompt: 'Break down the solution step-by-step with clear numbered stages.' }
  ];

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
    const t1 = setTimeout(scrollToBottom, 50);
    const t2 = setTimeout(scrollToBottom, 200);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [messages, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;
    sendMessage(inputText);
    setInputText('');
  };

  const handlePromptSelect = (promptText) => {
    sendMessage(promptText);
  };

  // Compute dynamic learning context based on active track and user profile/subjects
  const getDynamicContext = () => {
    const type = (learnerType || learner?.learnerType || 'school').toLowerCase();
    const degree = learner?.education?.degree || learner?.education?.board;
    const firstSubject = selectedSubjects && selectedSubjects.length > 0 ? selectedSubjects[0] : null;

    if (type === 'college') {
      return {
        course: degree || 'Full-Stack Web Engineering',
        topic: firstSubject ? `${firstSubject.name} - Core Architecture` : 'React Hooks & State Hydration',
        progress: firstSubject?.progress || 78,
        weakAreas: (learner?.weakTopics && learner.weakTopics.length > 0)
          ? learner.weakTopics
          : ['DBMS Normalization (3NF)', 'Async Promise Error Recovery'],
        recommendedPractice: firstSubject
          ? `${firstSubject.name} Practical & REST Security Diagnostic`
          : 'Express Middleware & REST API Security Diagnostic',
        studyGoal: (learner?.goals && learner.goals.length > 0)
          ? (typeof learner.goals[0] === 'string' ? learner.goals[0] : `${learner.goals[0].title || 'Career Path'} (${learner.goals[0].progress || 64}% Ready)`)
          : 'Full Stack Developer Career Path (64% Ready)'
      };
    } else if (type === 'exam') {
      return {
        course: degree || 'JEE / NEET Prep Track',
        topic: firstSubject ? `${firstSubject.name} High Yield Drills` : 'Organic Reaction Kinetics & Mechanisms',
        progress: firstSubject?.progress || 82,
        weakAreas: (learner?.weakTopics && learner.weakTopics.length > 0)
          ? learner.weakTopics
          : ['Electrophilic Addition Mechanisms', 'Thermodynamics Numerical Drills'],
        recommendedPractice: 'Mock Speed Test - Physics & Chemistry High Yield',
        studyGoal: (learner?.goals && learner.goals.length > 0)
          ? (typeof learner.goals[0] === 'string' ? learner.goals[0] : `${learner.goals[0].title || 'AIR Target'} (${learner.goals[0].progress || 75}% Target)`)
          : 'Top 1000 AIR Competitive Rank (75% Ready)'
      };
    } else if (type === 'skill') {
      return {
        course: degree || 'Full-Stack Web Engineering',
        topic: firstSubject ? `${firstSubject.name} Optimization` : 'React Hooks & State Hydration',
        progress: firstSubject?.progress || 78,
        weakAreas: (learner?.weakTopics && learner.weakTopics.length > 0)
          ? learner.weakTopics
          : ['DBMS Normalization (3NF)', 'Async Promise Error Recovery'],
        recommendedPractice: 'Express Middleware & REST API Security Diagnostic',
        studyGoal: (learner?.goals && learner.goals.length > 0)
          ? (typeof learner.goals[0] === 'string' ? learner.goals[0] : `${learner.goals[0].title || 'Skill Goal'} (${learner.goals[0].progress || 64}% Ready)`)
          : 'Full Stack Developer Career Path (64% Ready)'
      };
    } else {
      // default: school
      return {
        course: degree || 'CBSE / ICSE Class 10 High School',
        topic: firstSubject ? `${firstSubject.name} Chapter Concepts` : 'Physics - Optics & Light Reflection',
        progress: firstSubject?.progress || 72,
        weakAreas: (learner?.weakTopics && learner.weakTopics.length > 0)
          ? learner.weakTopics
          : ['Ray Diagram Construction', 'Quadratic Word Problems'],
        recommendedPractice: 'NCERT Science Chapter Diagnostic Quiz',
        studyGoal: (learner?.goals && learner.goals.length > 0)
          ? (typeof learner.goals[0] === 'string' ? learner.goals[0] : `${learner.goals[0].title || 'Board Target'} (${learner.goals[0].progress || 80}% Target)`)
          : 'Class 10 Board Excellence (80% Ready)'
      };
    }
  };

  const contextData = getDynamicContext();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '40px' }}>

      {/* Header Bar WITH 3D GLASS ORB */}
      <EduNovaHeroBanner
        badge="✦ Neural Tutoring Engine"
        title="Sage AI Teaching Assistant"
        subtitle="Your intelligent 24/7 learning system — concept breakdowns, examples, quizzes, and personalized study guidance."
        stats={[
          { label: 'Online 24/7', subtext: 'Neural Assistant', icon: Bot, color: '#38bdf8', iconBg: 'rgba(56, 189, 248, 0.25)' },
          { label: learner?.level ? `Level ${learner.level}` : 'Active Learner', subtext: `${learner?.xp || 0} XP Earned`, icon: Sparkles, color: '#c084fc', iconBg: 'rgba(192, 132, 252, 0.25)' },
          { label: `${learner?.goals?.length || 0}`, subtext: 'Active Goals', icon: Target, color: '#34d399', iconBg: 'rgba(52, 211, 153, 0.25)' }
        ]}
      />

      {/* DYNAMIC SAAS AI LAYOUT: 2-Panel or 3-Panel */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showContextPanel ? '240px minmax(0, 1fr) 280px' : '260px minmax(0, 1fr)',
          gap: '20px',
          alignItems: 'start'
        }}
        className="ai-layout-grid"
      >

        {/* LEFT PANEL: History & Topics Navigation */}
        <div style={{
          background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'var(--glass-bg)',
          borderRadius: 'var(--radius-xl)',
          border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid var(--border-color)',
          boxShadow: isLight ? '0 16px 40px rgba(180, 200, 230, 0.35)' : 'none',
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          backdropFilter: 'blur(16px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '8px', borderBottom: isLight ? '1px solid rgba(200, 218, 240, 0.6)' : '1px solid var(--border-color)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#18345F' : '#fff', fontWeight: 800, fontSize: '0.9rem' }}>
              <MessageSquare size={16} color="#06b6d4" /> Recent Topics
            </div>
            <button
              onClick={() => {
                setActiveSessionId('current');
                resetChat();
              }}
              title="Start a new chat session"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '4px 8px',
                borderRadius: '8px',
                background: isLight ? 'rgba(6, 182, 212, 0.12)' : 'rgba(6, 182, 212, 0.2)',
                border: '1px solid rgba(6, 182, 212, 0.35)',
                color: isLight ? '#0284c7' : '#38bdf8',
                fontSize: '0.74rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              <Plus size={12} /> New
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {historyTopics.length > 0 ? (
              historyTopics.map((topic) => (
                <div
                  key={topic.id}
                  onClick={() => {
                    setActiveSessionId(topic.id);
                    sendMessage(`Let's discuss and explore key concepts of: ${topic.title}`);
                  }}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 'var(--radius-md)',
                    background: activeSessionId === topic.id ? (isLight ? 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))' : 'linear-gradient(135deg, rgba(6, 182, 212, 0.2), rgba(99, 102, 241, 0.2))') : (isLight ? 'rgba(240, 246, 255, 0.75)' : 'var(--bg-secondary)'),
                    border: activeSessionId === topic.id ? '1px solid rgba(6, 182, 212, 0.5)' : (isLight ? '1px solid rgba(200, 218, 240, 0.6)' : '1px solid var(--border-color)'),
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: activeSessionId === topic.id ? (isLight ? '#0284c7' : '#fff') : (isLight ? '#18345F' : 'var(--text-secondary)'), display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {topic.title}
                  </span>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: isLight ? '#52668a' : 'var(--text-muted)', marginTop: '4px' }}>
                    <span>{topic.category}</span>
                    <span>{topic.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <div
                style={{
                  padding: '12px',
                  borderRadius: 'var(--radius-md)',
                  background: isLight ? 'rgba(6, 182, 212, 0.1)' : 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.3)',
                  textAlign: 'center'
                }}
              >
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: isLight ? '#0284c7' : '#38bdf8', display: 'block' }}>
                  Current Session
                </span>
                <span style={{ fontSize: '0.72rem', color: isLight ? '#52668a' : 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  {messages.length > 0 ? `${messages.length} messages active` : 'Ask Sage AI anything'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* CENTER PANEL: Main Conversation Area & Form */}
        <div style={{ display: 'flex', flexDirection: 'column', borderRadius: 'var(--radius-xl)', border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid var(--border-color)', background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'var(--glass-bg)', overflow: 'hidden', boxShadow: isLight ? '0 16px 40px rgba(180, 200, 230, 0.35)' : 'var(--glass-shadow)', backdropFilter: 'blur(20px)' }}>

          {/* Chat Panel Integrated Header */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            borderBottom: isLight ? '1px solid rgba(200, 218, 240, 0.7)' : '1px solid var(--border-color)',
            background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(255, 255, 255, 0.04)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 10px #10b981' }} />
              <strong style={{ fontSize: '0.88rem', color: isLight ? '#18345F' : '#ffffff' }}>Sage Neural Session</strong>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button
                onClick={() => setShowContextPanel(!showContextPanel)}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: showContextPanel
                    ? (isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.25)')
                    : (isLight ? 'rgba(240, 246, 255, 0.85)' : 'rgba(255, 255, 255, 0.08)'),
                  border: showContextPanel
                    ? '1px solid rgba(6, 182, 212, 0.4)'
                    : (isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.16)'),
                  color: showContextPanel ? (isLight ? '#0284c7' : '#38bdf8') : (isLight ? '#52668a' : 'var(--text-secondary)'),
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
                title="Toggle Contextual Learning Panel"
              >
                <PanelRight size={13} /> {showContextPanel ? 'Hide Context' : 'Context Panel'}
              </button>

              <button
                onClick={resetChat}
                style={{
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  background: isLight ? 'rgba(240, 246, 255, 0.85)' : 'rgba(255, 255, 255, 0.08)',
                  border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.16)',
                  color: isLight ? '#0284c7' : 'var(--text-secondary)',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  cursor: 'pointer'
                }}
              >
                <RefreshCw size={13} /> Clear Chat
              </button>
            </div>
          </div>

          {/* Messages Feed Container */}
          <div
            ref={chatContainerRef}
            style={{
              height: '480px',
              maxHeight: '54vh',
              minHeight: '360px',
              padding: '24px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
              background: isLight ? 'rgba(240, 246, 255, 0.6)' : 'rgba(5, 8, 20, 0.5)'
            }}
          >
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} onPromptSelect={handlePromptSelect} />
            ))}

            {isTyping && (
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center', color: isLight ? '#0284c7' : '#38bdf8', fontSize: '0.85rem', padding: '12px 16px', background: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.12)', borderRadius: 'var(--radius-md)', border: '1px solid rgba(6, 182, 212, 0.3)', width: 'fit-content' }}>
                <Bot size={18} className="animate-spin-slow" />
                <span>Sage AI is formulating your personalized explanation...</span>
              </div>
            )}
          </div>

          {/* Quick Actions Buttons Row */}
          <div style={{
            display: 'flex',
            gap: '8px',
            overflowX: 'auto',
            padding: '10px 16px',
            background: isLight ? 'rgba(230, 240, 255, 0.8)' : 'var(--bg-tertiary)',
            borderTop: isLight ? '1px solid rgba(200, 218, 240, 0.7)' : '1px solid var(--border-color)',
            borderBottom: isLight ? '1px solid rgba(200, 218, 240, 0.7)' : '1px solid var(--border-color)'
          }}>
            {quickActionBtns.map((btn, idx) => (
              <button
                key={idx}
                onClick={() => handlePromptSelect(btn.prompt)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '9999px',
                  background: isLight ? 'rgba(6, 182, 212, 0.15)' : 'rgba(6, 182, 212, 0.12)',
                  border: '1px solid rgba(6, 182, 212, 0.35)',
                  color: isLight ? '#0284c7' : '#38bdf8',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease'
                }}
              >
                ⚡ {btn.label}
              </button>
            ))}
          </div>

          {/* Form Input Area */}
          <form onSubmit={handleSend} style={{ padding: '16px', display: 'flex', gap: '12px', background: isLight ? 'rgba(255, 255, 255, 0.85)' : 'var(--bg-secondary)', flexShrink: 0 }}>
            <input
              type="text"
              placeholder="Ask Sage AI to explain a topic, generate a quiz, or give step-by-step practice..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              style={{ flex: 1, height: '44px', borderRadius: 'var(--radius-md)', fontSize: '0.92rem', background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(15, 23, 42, 0.8)', color: isLight ? '#18345F' : '#ffffff', border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.15)' }}
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              style={{
                padding: '0 24px',
                height: '44px',
                borderRadius: 'var(--radius-md)',
                background: inputText.trim() ? 'linear-gradient(135deg, #06b6d4, #6366f1)' : 'var(--bg-tertiary)',
                color: '#fff',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                cursor: inputText.trim() ? 'pointer' : 'not-allowed',
                opacity: inputText.trim() ? 1 : 0.5,
                border: 'none',
                boxShadow: inputText.trim() ? '0 4px 15px rgba(6, 182, 212, 0.3)' : 'none'
              }}
            >
              <Send size={16} /> Send
            </button>
          </form>
        </div>

        {/* RIGHT PANEL: Closable & Dynamic Contextual Learning Panel */}
        {showContextPanel && (
          <div style={{
            background: isLight ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.88) 0%, rgba(235, 244, 255, 0.82) 100%)' : 'var(--glass-bg)',
            borderRadius: 'var(--radius-xl)',
            border: isLight ? '1px solid rgba(255, 255, 255, 0.95)' : '1px solid var(--border-color)',
            boxShadow: isLight ? '0 16px 40px rgba(180, 200, 230, 0.35)' : 'none',
            padding: '16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '14px',
            backdropFilter: 'blur(16px)'
          }}>
            {/* Panel Header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingBottom: '10px',
              borderBottom: isLight ? '1px solid rgba(200, 218, 240, 0.6)' : '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: isLight ? '#18345F' : '#fff', fontWeight: 800, fontSize: '0.92rem' }}>
                <User size={18} color="#c084fc" /> Contextual Learning Panel
              </div>
              <button
                onClick={() => setShowContextPanel(false)}
                title="Close Panel"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: isLight ? '#64748b' : '#94a3b8',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  transition: 'all 0.15s ease'
                }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Card 1: Current Course */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.55)',
              border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <span style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.55)', display: 'block', marginBottom: '2px' }}>
                Current Course:
              </span>
              <strong style={{ fontSize: '0.94rem', color: isLight ? '#0f172a' : '#ffffff', fontWeight: 800 }}>
                {contextData.course}
              </strong>
            </div>

            {/* Card 2: Current Topic */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.55)',
              border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)'
            }}>
              <span style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.55)', display: 'block', marginBottom: '2px' }}>
                Current Topic:
              </span>
              <strong style={{ fontSize: '0.94rem', color: isLight ? '#0284c7' : '#38bdf8', fontWeight: 800 }}>
                {contextData.topic}
              </strong>
            </div>

            {/* Card 3: Learning Progress */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(255, 255, 255, 0.75)' : 'rgba(15, 23, 42, 0.55)',
              border: isLight ? '1px solid rgba(200, 218, 240, 0.8)' : '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.74rem', color: isLight ? '#64748b' : 'rgba(255, 255, 255, 0.55)' }}>
                  Learning Progress:
                </span>
                <strong style={{ fontSize: '0.9rem', color: isLight ? '#059669' : '#34d399', fontWeight: 800 }}>
                  {contextData.progress}%
                </strong>
              </div>
              <div style={{ width: '100%', height: '6px', borderRadius: '9999px', background: isLight ? 'rgba(0, 0, 0, 0.08)' : 'rgba(255, 255, 255, 0.1)', overflow: 'hidden' }}>
                <div style={{ width: `${contextData.progress}%`, height: '100%', background: 'linear-gradient(90deg, #10b981, #34d399)', borderRadius: '9999px', transition: 'width 0.4s ease' }} />
              </div>
            </div>

            {/* Card 4: Target Weak Areas */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(254, 242, 242, 0.85)' : 'rgba(159, 18, 57, 0.15)',
              border: isLight ? '1px solid rgba(254, 202, 202, 0.8)' : '1px solid rgba(244, 63, 94, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '6px'
            }}>
              <strong style={{ fontSize: '0.84rem', color: isLight ? '#e11d48' : '#fb7185', fontWeight: 800 }}>
                Target Weak Areas:
              </strong>
              <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '0.78rem', color: isLight ? '#334155' : 'rgba(255, 255, 255, 0.85)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {contextData.weakAreas.map((area, idx) => (
                  <li key={idx}>{area}</li>
                ))}
              </ul>
            </div>

            {/* Card 5: Recommended Practice */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(240, 253, 250, 0.85)' : 'rgba(15, 118, 110, 0.15)',
              border: isLight ? '1px solid rgba(153, 246, 228, 0.8)' : '1px solid rgba(45, 212, 191, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px'
            }}>
              <strong style={{ fontSize: '0.84rem', color: isLight ? '#0d9488' : '#38bdf8', fontWeight: 800 }}>
                Recommended Practice:
              </strong>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#334155' : 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4 }}>
                {contextData.recommendedPractice}
              </span>
            </div>

            {/* Card 6: Study Goal */}
            <div style={{
              padding: '12px 14px',
              borderRadius: '12px',
              background: isLight ? 'rgba(250, 245, 255, 0.85)' : 'rgba(126, 34, 206, 0.15)',
              border: isLight ? '1px solid rgba(233, 213, 255, 0.8)' : '1px solid rgba(192, 132, 252, 0.3)',
              display: 'flex',
              flexDirection: 'column',
              gap: '4px',
              position: 'relative'
            }}>
              <strong style={{ fontSize: '0.84rem', color: isLight ? '#7e22ce' : '#c084fc', fontWeight: 800 }}>
                Study Goal:
              </strong>
              <span style={{ fontSize: '0.78rem', color: isLight ? '#334155' : 'rgba(255, 255, 255, 0.85)', lineHeight: 1.4, paddingRight: '36px' }}>
                {contextData.studyGoal}
              </span>

              {/* Floating purple bot button in the corner of study goal card */}
              <button
                onClick={() => sendMessage(`Help me work on my current study goal: ${contextData.studyGoal}`)}
                title="Ask Sage about Study Goal"
                style={{
                  position: 'absolute',
                  bottom: '8px',
                  right: '8px',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                  border: 'none',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(168, 85, 247, 0.4)',
                  transition: 'transform 0.15s ease'
                }}
              >
                <Bot size={18} />
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIAssistantPage;

