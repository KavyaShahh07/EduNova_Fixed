import React, { useState, useMemo } from 'react';
import { X, Puzzle, CheckCircle2, Sparkles, Loader2 } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useGeminiGameContent } from '../../hooks/useGeminiGameContent';

export const ConceptMatchGameModal = ({ isOpen, onClose, onFinish, subjectData }) => {
  const { theme } = useTheme() || {};
  const isLight = theme === 'light';

  const [selectedTerm, setSelectedTerm] = useState(null);
  const [selectedDef, setSelectedDef] = useState(null);
  const [matchedPairs, setMatchedPairs] = useState([]);

  const { items: rawConcepts, loading: loadingAi } = useGeminiGameContent(
    'CONCEPT',
    subjectData?.name || 'Physics',
    [
      { concept: 'Refraction', match: 'Bending of light rays through media' },
      { concept: 'Ohm’s Law', match: 'Current proportional to voltage (V=IR)' },
      { concept: 'B-Tree Index', match: 'Self-balancing DB search tree' }
    ]
  );

  const { terms, definitions } = useMemo(() => {
    const list = (rawConcepts || []).slice(0, 5);
    const tList = list.map((c, i) => ({ id: `t_${i}`, text: c.concept || c.term || `Concept ${i + 1}` }));
    const dList = list
      .map((c, i) => ({ id: `d_${i}`, text: c.match || c.definition || `Match ${i + 1}`, pairTermId: `t_${i}` }))
      .sort(() => 0.5 - Math.random());
    return { terms: tList, definitions: dList };
  }, [rawConcepts]);

  if (!isOpen) return null;

  const handlePair = (termId, defObj) => {
    if (defObj.pairTermId === termId) {
      const newMatches = [...matchedPairs, termId];
      setMatchedPairs(newMatches);
      setSelectedTerm(null);
      setSelectedDef(null);

      if (newMatches.length === terms.length) {
        setTimeout(() => {
          onFinish({
            gameId: 'concept-match',
            gameTitle: '🧩 Concept Match Challenge',
            score: 400,
            accuracy: 100,
            xpEarned: 140,
            durationSeconds: 30
          });
        }, 500);
      }
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(5, 8, 22, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '660px',
          borderRadius: '28px',
          background: isLight
            ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.98) 0%, rgba(240, 246, 255, 0.95) 100%)'
            : 'linear-gradient(135deg, rgba(20, 30, 65, 0.95) 0%, rgba(12, 18, 42, 0.98) 100%)',
          border: isLight ? '1.5px solid rgba(255, 255, 255, 0.98)' : '1px solid rgba(255, 255, 255, 0.2)',
          boxShadow: '0 25px 65px rgba(0,0,0,0.5)',
          padding: '32px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Puzzle size={24} color="#10b981" />
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: isLight ? '#0f172a' : '#ffffff', margin: 0 }}>
              🧩 Concept Match Challenge
            </h2>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: isLight ? '#0f172a' : '#ffffff', cursor: 'pointer' }}>
            <X size={20} />
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          {/* Terms Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {terms.map(t => {
              const isMatched = matchedPairs.includes(t.id);
              const isSelected = selectedTerm === t.id;
              return (
                <button
                  key={t.id}
                  disabled={isMatched}
                  onClick={() => setSelectedTerm(t.id)}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: isMatched ? 'rgba(16, 185, 129, 0.2)' : (isSelected ? '#38bdf8' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.08)')),
                    border: isSelected ? '2px solid #38bdf8' : '1px solid rgba(255,255,255,0.15)',
                    color: isMatched ? '#10b981' : (isSelected ? '#ffffff' : (isLight ? '#0f172a' : '#ffffff')),
                    fontWeight: 800,
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {t.text} {isMatched && '✓'}
                </button>
              );
            })}
          </div>

          {/* Definitions Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {definitions.map(d => {
              const isMatched = matchedPairs.includes(d.pairTermId);
              return (
                <button
                  key={d.id}
                  disabled={isMatched || !selectedTerm}
                  onClick={() => selectedTerm && handlePair(selectedTerm, d)}
                  style={{
                    padding: '14px',
                    borderRadius: '16px',
                    background: isMatched ? 'rgba(16, 185, 129, 0.2)' : (isLight ? '#ffffff' : 'rgba(255,255,255,0.08)'),
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: isMatched ? '#10b981' : (isLight ? '#0f172a' : '#ffffff'),
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    textAlign: 'left',
                    cursor: 'pointer'
                  }}
                >
                  {d.text} {isMatched && '✓'}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
export default ConceptMatchGameModal;
