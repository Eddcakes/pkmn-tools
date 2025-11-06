import React from "react";
import {
  getButtonClasses,
  type ButtonVariant,
  type ButtonSize
} from "../utils/buttonStyles";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const disabledClasses =
    "disabled:bg-gray-400 disabled:cursor-not-allowed disabled:hover:bg-gray-400";

  return (
    <button
      className={getButtonClasses(
        variant,
        size,
        `${disabledClasses} ${className}`
      )}
      {...props}
    >
      {children}
    </button>
  );
}
