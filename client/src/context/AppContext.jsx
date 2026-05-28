/**
 * Context API foundation — optional complement to Zustand.
 */
import { createContext, useContext, useMemo, useState } from 'react';

const AppContext = createContext(null);

export function AppProvider({ children }) {
  const [ready, setReady] = useState(true);

  const value = useMemo(
    () => ({
      ready,
      setReady,
    }),
    [ready]
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) {
    throw new Error('useAppContext must be used within AppProvider');
  }
  return ctx;
}
