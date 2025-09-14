import React from "react";

interface Position {
  x: number;
  y: number;
}

interface TooltipProps {
  isVisible: boolean;
  position: Position;
  children: React.ReactNode;
  className?: string;
}

export function Tooltip({
  isVisible,
  position,
  children,
  className = "",
}: TooltipProps) {
  if (!isVisible) return null;

  return (
    <div
      className={`fixed z-50 pointer-events-none ${className}`}
      style={{ left: position.x, top: position.y }}
    >
      <div className="bg-white border border-gray-300 rounded-lg shadow-lg p-2 max-w-xs">
        {children}
      </div>
    </div>
  );
}
