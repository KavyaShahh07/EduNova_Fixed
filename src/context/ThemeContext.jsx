import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('edunova_theme') || 'dark';
  });

  const [reducedMotion, setReducedMotionState] = useState(() => {
    return localStorage.getItem('edunova_reduced_motion') === 'true';
  });

  const [highContrast, setHighContrastState] = useState(() => {
    return localStorage.getItem('edunova_high_contrast') === 'true';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('edunova_theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('edunova_reduced_motion', String(reducedMotion));
    if (reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
      document.body.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
      document.body.classList.remove('reduced-motion');
    }
  }, [reducedMotion]);

  useEffect(() => {
    localStorage.setItem('edunova_high_contrast', String(highContrast));
    if (highContrast) {
      document.documentElement.classList.add('high-contrast');
      document.body.classList.add('high-contrast');
    } else {
      document.documentElement.classList.remove('high-contrast');
      document.body.classList.remove('high-contrast');
    }
  }, [highContrast]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  const setReducedMotion = useCallback((val) => {
    setReducedMotionState(Boolean(val));
  }, []);

  const toggleReducedMotion = useCallback(() => {
    setReducedMotionState((prev) => !prev);
  }, []);

  const setHighContrast = useCallback((val) => {
    setHighContrastState(Boolean(val));
  }, []);

  const toggleHighContrast = useCallback(() => {
    setHighContrastState((prev) => !prev);
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    setTheme,
    toggleTheme,
    reducedMotion,
    setReducedMotion,
    toggleReducedMotion,
    highContrast,
    setHighContrast,
    toggleHighContrast
  }), [theme, toggleTheme, reducedMotion, setReducedMotion, toggleReducedMotion, highContrast, setHighContrast, toggleHighContrast]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
