import React from "react";

interface TooltipProps {
  text: string;
  color?: "gray" | "red" | "yellow" | "blue" | "green";
  position?: "top" | "bottom" | "left" | "right";
  children: React.ReactNode;
  delay?: number; // optional delay in ms before showing
}

export const Tooltip: React.FC<TooltipProps> = ({
  text,
  color = "gray",
  position = "top",
  children,
  delay = 0,
}) => {
  const colorMap = {
    gray: "bg-gray-800 text-white",
    red: "bg-red-700 text-white",
    yellow: "bg-yellow-500 text-white",
    blue: "bg-blue-600 text-white",
    green: "bg-green-600 text-white",
  };

  const positionClasses: Record<string, string> = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className="relative inline-block group">
      {children}
      <div
        className={`absolute z-50 px-2 py-2 text-xs rounded whitespace-nowrap opacity-0 pointer-events-none 
        group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200 ease-in-out shadow-md
        ${colorMap[color]} ${positionClasses[position]}`}
        style={{
          transitionDelay: `${delay}ms`,
        }}
      >
        {text} 
      </div>
    </div>
  );
};

export default Tooltip;
