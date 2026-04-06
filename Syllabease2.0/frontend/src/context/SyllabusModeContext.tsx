import { createContext, useContext, useState, type ReactNode } from "react";

interface SyllabusModeContextType {
  isCommentMode: boolean;
  setIsCommentMode: (value: boolean) => void;
}

const SyllabusModeContext = createContext<SyllabusModeContextType | undefined>(undefined);

export const SyllabusModeProvider = ({ children }: { children: ReactNode }) => {
  const [isCommentMode, setIsCommentMode] = useState(false);

  return (
    <SyllabusModeContext.Provider value={{ isCommentMode, setIsCommentMode }}>
      {children}
    </SyllabusModeContext.Provider>
  );
};

export const useSyllabusMode = () => {
  const context = useContext(SyllabusModeContext);
  if (!context) {
    throw new Error("useSyllabusMode must be used within a SyllabusModeProvider");
  }
  return context;
};
