import { createContext, useContext, useState, type ReactNode } from "react";

interface TOSModeContextType {
  isCommentMode: boolean;
  setIsCommentMode: (value: boolean) => void;
}

const TOSModeContext = createContext<TOSModeContextType | undefined>(undefined);

export const TOSModeProvider = ({ children }: { children: ReactNode }) => {
  const [isCommentMode, setIsCommentMode] = useState(false);

  return (
    <TOSModeContext.Provider value={{ isCommentMode, setIsCommentMode }}>
      {children}
    </TOSModeContext.Provider>
  );
};

export const useTOSMode = () => {
  const context = useContext(TOSModeContext);
  if (!context) {
    throw new Error("useTOSMode must be used within a TOSModeProvider");
  }
  return context;
};
