import React, { createContext, useCallback, useContext, useState } from "react";

const NoticeContext = createContext(null);

export function NoticeProvider({ children }) {
  const [notice, setNotice] = useState(null);
  const notify = useCallback((kind, text) => setNotice({ kind, text, key: Date.now() }), []);
  const clear = useCallback(() => setNotice(null), []);
  return (
    <NoticeContext.Provider value={{ notice, notify, clear }}>
      {children}
    </NoticeContext.Provider>
  );
}

export const useNotice = () => useContext(NoticeContext);
