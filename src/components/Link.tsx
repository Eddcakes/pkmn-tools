import React from "react";
import NextLink from "next/link";
import {
  getButtonClasses,
  type ButtonVariant,
  type ButtonSize,
} from "../utils/buttonStyles";

interface LinkProps extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  variant?: "default" | "button";
  buttonVariant?: ButtonVariant;
  size?: ButtonSize;
  children: React.ReactNode;
}

export function Link({
  href,
  variant = "default",
  buttonVariant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: LinkProps) {
  const defaultLinkClasses =
    "text-blue-600 hover:text-blue-700 hover:underline transition-colors";

  const linkClasses =
    variant === "button"
      ? getButtonClasses(buttonVariant, size, "inline-block text-center")
      : defaultLinkClasses;

  return (
    <NextLink href={href} className={`${linkClasses} ${className}`} {...props}>
      {children}
    </NextLink>
  );
}
