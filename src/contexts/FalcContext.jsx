import { createContext, useContext, useState, useEffect } from 'react';

const FalcContext = createContext();

export function FalcProvider({ children }) {
  const [falcMode, setFalcMode] = useState(() => {
    // Load from localStorage
    const saved = localStorage.getItem('falc-mode');
    return saved === 'true';
  });

  useEffect(() => {
    // Save to localStorage
    localStorage.setItem('falc-mode', falcMode);
    
    // Add class to body for CSS targeting
    if (falcMode) {
      document.body.classList.add('falc-mode');
    } else {
      document.body.classList.remove('falc-mode');
    }
  }, [falcMode]);

  const toggleFalcMode = () => setFalcMode(prev => !prev);

  return (
    <FalcContext.Provider value={{ falcMode, toggleFalcMode }}>
      {children}
    </FalcContext.Provider>
  );
}

export function useFalc() {
  const context = useContext(FalcContext);
  if (!context) {
    throw new Error('useFalc must be used within FalcProvider');
  }
  return context;
}
