import React, { useState } from 'react';
import {
  Users,
  Repeat,
  MessageSquare,
  Calendar,
  TrendingUp,
  FolderGit2,
  UserPlus,
  Clock,
  Video,
  Plus
} from 'lucide-react';

export const LearningNetworkSection = ({
  onOpenChat,
  onRequestExchange,
  onOpenScheduler,
  candidates = [],
  activeExchanges = [],
  upcomingMeetings = [],
  requests = [],
  onAcceptRequest,
  onDeclineRequest
}) => {
  const [networkTab, setNetworkTab] = useState('people'); // 'people' | 'exchanges' | 'messages' | 'sessions' | 'projects'

  const trendingSkills = [
    { name: 'React 19 & Next.js', category: 'Web Dev', learners: 48, growth: '+24%' },
    { name: 'Python for AI & ML', category: 'AI', learners: 62, growth: '+38%' },
    { name: 'CBSE Class 10 Math', category: 'School', learners: 35, growth: '+15%' },
    { name: 'Figma Auto Layout', category: 'UI/UX', learners: 29, growth: '+18%' },
    { name: 'DSA & LeetCode Patterns', category: 'Algorithms', learners: 54, growth: '+31%' }
  ];

  const projectPartners = [
    {
      title: 'AI Education Assistant Web App',
      roles: 'Frontend Developer (React), UI/UX Designer',
      author: 'Priya Verma',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      stack: 'React, Node.js, OpenAI API'
    },
    {
      title: 'Smart Exam Study Planner Mobile App',
      roles: 'Backend Developer (Node.js), QA Specialist',
      author: 'Dev Patel',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
      stack: 'React Native, Express, MongoDB'
    }
  ];

  return (
    <div style={{ marginTop: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION HEADER */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#38bdf8', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
            Interactive Peer Ecosystem
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', margin: 0 }}>
            YOUR LEARNING NETWORK
          </h2>
        </div>

        {/* Network Sub-Tabs */}
        <div style={{ display: 'flex', gap: '6px', background: 'rgba(12, 16, 36, 0.8)', padding: '6px', borderRadius: '14px', border: '1px solid rgba(255,255,255,0.12)' }}>
          {[
            { id: 'people', label: 'People', icon: Users, badge: candidates.length },
            { id: 'exchanges', label: 'Exchanges', icon: Repeat, badge: activeExchanges.length + requests.length },
            { id: 'messages', label: 'Messages', icon: MessageSquare },
            { id: 'sessions', label: 'Sessions', icon: Calendar, badge: upcomingMeetings.length },
            { id: 'projects', label: 'Project Partners', icon: FolderGit2, badge: projectPartners.length }
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = networkTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setNetworkTab(tab.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '10px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  border: 'none',
                  background: isActive ? 'linear-gradient(135deg, #06b6d4, #6366f1)' : 'transparent',
                  color: isActive ? '#fff' : '#94a3b8',
                  transition: 'all 0.15s ease'
                }}
              >
                <Icon size={14} />
                {tab.label}
                {tab.badge > 0 && (
                  <span style={{
                    padding: '1px 6px',
                    borderRadius: '999px',
                    background: isActive ? 'rgba(255,255,255,0.25)' : 'rgba(6, 182, 212, 0.2)',
                    color: isActive ? '#fff' : '#38bdf8',
                    fontSize: '0.7rem'
                  }}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB TAB 1: PEOPLE */}
      {networkTab === 'people' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
          {candidates.length > 0 ? (
            candidates.slice(0, 4).map((candidate) => (
              <div
                key={candidate.id}
                style={{
                  padding: '20px',
                  borderRadius: '20px',
                  background: 'rgba(12, 16, 36, 0.9)',
                  border: '1px solid rgba(255, 255, 255, 0.12)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <img src={candidate.avatar} alt={candidate.name} style={{ width: '48px', height: '48px', borderRadius: '14px', objectFit: 'cover' }} />
                  <div>
                    <h4 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#fff', margin: 0 }}>{candidate.name}</h4>
                    <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '2px 0 0 0' }}>{candidate.education || 'Peer Learner'}</p>
                  </div>
                </div>

                <div style={{ padding: '10px', borderRadius: '12px', background: '#050814', fontSize: '0.78rem' }}>
                  <span style={{ color: '#38bdf8', fontWeight: 700, display: 'block' }}>
                    Teaches: {candidate.skillsToTeach?.[0]?.name || candidate.matchedCandidateSkill || 'Academics'}
                  </span>
                  <span style={{ color: '#c084fc', fontWeight: 700, display: 'block', marginTop: '2px' }}>
                    Wants: {candidate.skillsToLearn?.[0]?.name || candidate.matchedUserSkill || 'Skill'}
                  </span>
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => onRequestExchange(candidate)}
                    className="se-btn se-btn-primary"
                    style={{ flex: 1, padding: '8px 12px', fontSize: '0.78rem', justifyContent: 'center' }}
                  >
                    <UserPlus size={14} /> Request Exchange
                  </button>
                  <button
                    onClick={onOpenChat}
                    className="se-btn se-btn-secondary"
                    style={{ padding: '8px 12px', fontSize: '0.78rem' }}
                  >
                    <MessageSquare size={14} /> Chat
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div style={{ color: '#94a3b8', padding: '24px', textAlign: 'center', gridColumn: '1 / -1' }}>
              No candidates found matching filters.
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 2: EXCHANGES */}
      {networkTab === 'exchanges' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {activeExchanges.length > 0 || requests.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {[...activeExchanges, ...requests].map((ex, idx) => (
                <div
                  key={ex.id || idx}
                  style={{
                    padding: '20px',
                    borderRadius: '20px',
                    background: 'rgba(12, 16, 36, 0.9)',
                    border: '1px solid rgba(6, 182, 212, 0.3)',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <img src={ex.peerAvatar || ex.sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={ex.peerName || ex.sender?.name} style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                      <div>
                        <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: 0 }}>{ex.peerName || ex.sender?.name || 'Peer Tutor'}</h4>
                        <span style={{ fontSize: '0.72rem', color: '#94a3b8' }}>Skill Swap Proposal</span>
                      </div>
                    </div>
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '999px',
                      fontSize: '0.72rem',
                      fontWeight: 800,
                      background: ex.status === 'ACCEPTED' ? 'rgba(34, 197, 94, 0.18)' : 'rgba(245, 158, 11, 0.18)',
                      color: ex.status === 'ACCEPTED' ? '#22c55e' : '#fbbf24',
                      border: ex.status === 'ACCEPTED' ? '1px solid rgba(34, 197, 94, 0.4)' : '1px solid rgba(245, 158, 11, 0.4)'
                    }}>
                      {ex.status || 'PENDING'}
                    </span>
                  </div>

                  <div style={{ padding: '10px 14px', borderRadius: '12px', background: '#050814', fontSize: '0.8rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ color: '#38bdf8', fontWeight: 700 }}>{ex.skillOffered || 'Teaching'}</span>
                    <Repeat size={14} color="#a855f7" />
                    <span style={{ color: '#c084fc', fontWeight: 700 }}>{ex.skillWanted || 'Learning'}</span>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    {ex.status === 'ACCEPTED' ? (
                      <>
                        <button onClick={() => onOpenScheduler(ex)} className="se-btn se-btn-primary" style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center' }}>
                          <Calendar size={14} /> Schedule Session
                        </button>
                        <button onClick={onOpenChat} className="se-btn se-btn-secondary" style={{ fontSize: '0.78rem' }}>
                          <MessageSquare size={14} /> Chat
                        </button>
                      </>
                    ) : (
                      <>
                        {onAcceptRequest && (
                          <button onClick={() => onAcceptRequest(ex.id)} className="se-btn se-btn-primary" style={{ flex: 1, fontSize: '0.78rem', justifyContent: 'center' }}>
                            Accept
                          </button>
                        )}
                        {onDeclineRequest && (
                          <button onClick={() => onDeclineRequest(ex.id)} className="se-btn se-btn-secondary" style={{ fontSize: '0.78rem' }}>
                            Decline
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 24px', borderRadius: '20px', background: 'rgba(12, 16, 36, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'center' }}>
              <Repeat size={32} color="#06b6d4" style={{ marginBottom: '8px' }} />
              <h4 style={{ color: '#fff', margin: '0 0 4px 0' }}>No Active Exchanges Yet</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: 0 }}>Request a skill swap from the "People" tab to start learning together!</p>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 3: MESSAGES */}
      {networkTab === 'messages' && (
        <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(12, 16, 36, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MessageSquare size={18} color="#38bdf8" /> Peer Chat Conversations
            </h4>
            <button onClick={onOpenChat} className="se-btn se-btn-primary" style={{ fontSize: '0.8rem' }}>
              Open Chat Room
            </button>
          </div>

          {activeExchanges.length > 0 || requests.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '12px' }}>
              {[...activeExchanges, ...requests].map((ex, i) => (
                <div key={ex.id || i} onClick={onOpenChat} style={{ padding: '14px', borderRadius: '16px', background: '#050814', border: '1px solid rgba(255,255,255,0.1)', cursor: 'pointer', display: 'flex', gap: '12px', alignItems: 'center' }}>
                  <img src={ex.peerAvatar || ex.sender?.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={ex.peerName || ex.sender?.name} style={{ width: '42px', height: '42px', borderRadius: '12px' }} />
                  <div style={{ flex: 1, overflow: 'hidden' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 800, color: '#fff' }}>
                      <span>{ex.peerName || ex.sender?.name || 'Peer Learner'}</span>
                      <span style={{ fontSize: '0.7rem', color: '#38bdf8', fontWeight: 700 }}>{ex.status || 'Active'}</span>
                    </div>
                    <p style={{ fontSize: '0.76rem', color: '#cbd5e1', margin: '2px 0 0 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                      Exchange: {ex.skillOffered} ↔ {ex.skillWanted}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '24px', textAlign: 'center', background: '#050814', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.08)' }}>
              <MessageSquare size={32} color="#38bdf8" style={{ marginBottom: '8px' }} />
              <h4 style={{ color: '#fff', margin: '0 0 4px 0', fontSize: '0.95rem' }}>No Active Peer Chats Yet</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.82rem', margin: '0 0 14px 0' }}>Request or accept a skill swap proposal to unlock peer chat messages.</p>
              <button onClick={onOpenChat} className="se-btn se-btn-secondary" style={{ fontSize: '0.78rem' }}>
                Open General Chat
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 4: SESSIONS */}
      {networkTab === 'sessions' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#06b6d4" /> Scheduled Peer Sessions
            </h4>
            <button onClick={() => onOpenScheduler(candidates[0])} className="se-btn se-btn-primary" style={{ fontSize: '0.8rem' }}>
              <Plus size={14} /> Schedule New Session
            </button>
          </div>

          {upcomingMeetings.length > 0 ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px' }}>
              {upcomingMeetings.map((meet, idx) => (
                <div key={meet.id || idx} style={{ padding: '20px', borderRadius: '20px', background: 'rgba(12, 16, 36, 0.9)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img src={meet.participantAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'} alt={meet.participantName || meet.title} style={{ width: '40px', height: '40px', borderRadius: '12px' }} />
                    <div>
                      <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', margin: 0 }}>{meet.title || 'Peer Session'}</h4>
                      <span style={{ fontSize: '0.74rem', color: '#94a3b8' }}>With {meet.participantName || 'Peer Tutor'}</span>
                    </div>
                  </div>

                  <div style={{ padding: '10px', borderRadius: '12px', background: '#050814', fontSize: '0.78rem', display: 'flex', justifyContent: 'space-between', color: '#38bdf8' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Clock size={13} /> {meet.date || meet.startTime || 'Scheduled'}</span>
                    <span style={{ fontWeight: 800 }}>{meet.duration ? `${meet.duration} mins` : '45 mins'}</span>
                  </div>

                  <button onClick={onOpenChat} className="se-btn se-btn-primary" style={{ fontSize: '0.78rem', justifyContent: 'center' }}>
                    <Video size={14} /> Join Video Call Room
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ padding: '32px 24px', borderRadius: '20px', background: 'rgba(12, 16, 36, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)', textAlign: 'center' }}>
              <Calendar size={36} color="#06b6d4" style={{ marginBottom: '10px' }} />
              <h4 style={{ color: '#fff', margin: '0 0 6px 0', fontSize: '1.05rem', fontWeight: 800 }}>No Scheduled Peer Sessions Yet</h4>
              <p style={{ color: '#94a3b8', fontSize: '0.84rem', margin: '0 auto 16px auto', maxWidth: '420px' }}>
                When you request or schedule a peer session, your confirmed appointments and video call room links will appear here.
              </p>
              <button onClick={() => onOpenScheduler(candidates[0])} className="se-btn se-btn-primary" style={{ fontSize: '0.8rem', display: 'inline-flex' }}>
                <Plus size={14} /> Schedule First Session
              </button>
            </div>
          )}
        </div>
      )}

      {/* SUB TAB 5: PROJECT PARTNERS */}
      {networkTab === 'projects' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '16px' }}>
          {projectPartners.map((proj, idx) => (
            <div
              key={idx}
              style={{
                padding: '20px',
                borderRadius: '20px',
                background: 'rgba(12, 16, 36, 0.9)',
                border: '1px solid rgba(168, 85, 247, 0.3)',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <FolderGit2 size={20} color="#a855f7" />
                <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#fff', margin: 0 }}>{proj.title}</h4>
              </div>
              <p style={{ fontSize: '0.8rem', color: '#94a3b8', margin: 0 }}>
                Looking for: <strong style={{ color: '#38bdf8' }}>{proj.roles}</strong>
              </p>
              <div style={{ fontSize: '0.75rem', color: '#cbd5e1', padding: '8px 12px', borderRadius: '10px', background: '#050814' }}>
                Tech Stack: {proj.stack}
              </div>
              <button
                onClick={onOpenChat}
                className="se-btn se-btn-purple"
                style={{ padding: '8px 14px', fontSize: '0.8rem', justifyContent: 'center' }}
              >
                Join Project Group Chat
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TRENDING SKILLS WIDGET */}
      <div style={{ padding: '24px', borderRadius: '24px', background: 'rgba(12, 16, 36, 0.9)', border: '1px solid rgba(255, 255, 255, 0.12)' }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <TrendingUp size={18} color="#38bdf8" /> Trending Peer Exchange Skills
        </h3>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px' }}>
          {trendingSkills.map((sk, idx) => (
            <div
              key={idx}
              style={{
                padding: '12px 16px',
                borderRadius: '16px',
                background: '#050814',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}
            >
              <div>
                <span style={{ fontSize: '0.88rem', fontWeight: 800, color: '#fff', display: 'block' }}>{sk.name}</span>
                <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{sk.learners} active learners</span>
              </div>
              <span style={{ padding: '2px 8px', borderRadius: '8px', background: 'rgba(34, 197, 94, 0.15)', color: '#22c55e', fontSize: '0.75rem', fontWeight: 800 }}>
                {sk.growth}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
