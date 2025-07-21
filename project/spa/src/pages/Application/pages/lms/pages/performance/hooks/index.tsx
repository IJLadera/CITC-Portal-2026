import React, { useContext, createContext, useState, ReactNode } from 'react';


interface PerformanceContextType {
  evaluated: boolean;
  submitEvaluation: () => void;
}

const PerformanceContext = createContext<PerformanceContextType | undefined>(undefined);

interface PerformanceProps {
  children: ReactNode;
}

const PerformanceProvider:React.FC<PerformanceProps> = ({ children}) => {
  const [evaluated, setEvaluated] = useState<boolean>(false);

  const submitEvaluation = () => {
    setEvaluated(true);
  }
  return (
    <PerformanceProvider>
      { children }
    </PerformanceProvider>
  )
}

export default PerformanceProvider
