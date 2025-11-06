"use client";

import React from "react";
import { useTooltip } from "../hooks/useTooltip";
import {
  getCardImageFromDisplayName,
  isValidCardFormat
} from "../utils/cardImages";
import { CardImage } from "./CardImage";
import { Tooltip } from "./Tooltip";

interface CardPreviewProps {
  cardName: string;
  children: React.ReactNode;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  triggerRef?: React.RefObject<HTMLElement>;
  className?: string;
}

export function CardPreview({ cardName, children }: CardPreviewProps) {
  const imageUrl = getCardImageFromDisplayName(cardName);
  const hasValidFormat = isValidCardFormat(cardName);

  const {
    isVisible,
    position,
    triggerRef,
    handleMouseEnter,
    handleMouseLeave
  } = useTooltip({
    delay: 300,
    offset: 10,
    tooltipWidth: 250,
    tooltipHeight: 350
  });

  const shouldShowTooltip = imageUrl && hasValidFormat;

  // Clone children and add hover props to interactive elements
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const existingClassName =
        typeof child.props === "object" &&
        child.props &&
        "className" in child.props
          ? String(child.props.className || "")
          : "";

      const newClassName = `${existingClassName} ${
        hasValidFormat ? "cursor-help" : "cursor-default"
      }`.trim();

      const newProps: Record<string, unknown> = {
        onMouseEnter: shouldShowTooltip ? handleMouseEnter : undefined,
        onMouseLeave: shouldShowTooltip ? handleMouseLeave : undefined,
        className: newClassName
      };

      if (shouldShowTooltip) {
        newProps.ref = triggerRef;
      }

      return React.cloneElement(child, newProps);
    }
    return child;
  });

  return (
    <>
      <div className="h-full items-center">{enhancedChildren}</div>

      {shouldShowTooltip && (
        <Tooltip isVisible={isVisible} position={position}>
          <CardImage imageUrl={imageUrl} cardName={cardName} />
        </Tooltip>
      )}
    </>
  );
}
