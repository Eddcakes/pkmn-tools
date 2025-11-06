"use client";

import React from "react";
import {
  getCardImageFromDisplayName,
  isValidCardFormat,
} from "../utils/cardImages";
import { useTooltip } from "../hooks/useTooltip";
import { Tooltip } from "./Tooltip";
import { CardImage } from "./CardImage";

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
    handleMouseLeave,
  } = useTooltip({
    delay: 300,
    offset: 10,
    tooltipWidth: 250,
    tooltipHeight: 350,
  });

  const shouldShowTooltip = imageUrl && hasValidFormat;

  // Clone children and add hover props to interactive elements
  const enhancedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      return React.cloneElement(child, {
        onMouseEnter: shouldShowTooltip ? handleMouseEnter : undefined,
        onMouseLeave: shouldShowTooltip ? handleMouseLeave : undefined,
        ref: shouldShowTooltip ? triggerRef : undefined,
        className: `${(child.props as any).className || ""} ${
          hasValidFormat ? "cursor-help" : "cursor-default"
        }`.trim(),
      } as any);
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
