import type { ButtonHTMLAttributes, ReactNode } from "react";
import {
  BUTTON_BASE_CLASSES,
  BUTTON_VARIANTS,
  type ButtonVariant
} from "../utils/buttonStyles";

const ICON_BUTTON_SIZES = {
  xs: "p-1",
  sm: "p-1.5",
  md: "p-2",
  lg: "p-3"
} as const;

type IconButtonSize = keyof typeof ICON_BUTTON_SIZES;

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: IconButtonSize;
  icon: ReactNode;
  "aria-label": string;
}

export function IconButton({
  variant = "ghost",
  size = "md",
  icon,
  className = "",
  "aria-label": ariaLabel,
  ...props
}: IconButtonProps) {
  const disabledClasses =
    "disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent";

  const buttonClasses =
    `${BUTTON_BASE_CLASSES} ${BUTTON_VARIANTS[variant]} ${ICON_BUTTON_SIZES[size]} ${disabledClasses} ${className}`.trim();

  return (
    <button
      type="button"
      className={buttonClasses}
      aria-label={ariaLabel}
      {...props}
    >
      {icon}
    </button>
  );
}
