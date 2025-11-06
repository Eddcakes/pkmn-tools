import type { ReactNode } from "react";

interface ModalFooterProps {
  children: ReactNode;
  className?: string;
}

export function ModalFooter({ children, className = "" }: ModalFooterProps) {
  return (
    <div
      className={`flex justify-end gap-3 pt-4 border-t border-gray-200 mt-6 ${className}`}
    >
      {children}
    </div>
  );
}
