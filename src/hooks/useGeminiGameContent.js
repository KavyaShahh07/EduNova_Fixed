import { useState, useEffect } from 'react';
import { gameService } from '../services/gameService';

export const useGeminiGameContent = (gameType, subjectName = 'Physics', defaultItems = []) => {
  const [items, setItems] = useState(defaultItems);
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('local');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    gameService.getDynamicGameContent({
      gameType,
      subject: subjectName,
    })
      .then((data) => {
        if (!isMounted) return;
        if (data) {
          if (Array.isArray(data) && data.length > 0) {
            setItems(data);
            setProvider('gemini');
          } else if (typeof data === 'object') {
            setItems(data);
            setProvider('gemini');
          }
        }
      })
      .catch((err) => {
        console.warn(`[Gemini Game Engine] ${gameType} fallback active:`, err.message);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [gameType, subjectName]);

  return { items, loading, provider };
};

export default useGeminiGameContent;
