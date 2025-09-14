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

  return (
    <>
      <div
        ref={triggerRef as React.RefObject<HTMLDivElement>}
        onMouseEnter={shouldShowTooltip ? handleMouseEnter : undefined}
        onMouseLeave={shouldShowTooltip ? handleMouseLeave : undefined}
        className={`inline-block ${
          hasValidFormat ? "cursor-help" : "cursor-default"
        }`}
        title={
          hasValidFormat ? "Hover to preview card" : "No preview available"
        }
      >
        {children}
      </div>

      {shouldShowTooltip && (
        <Tooltip isVisible={isVisible} position={position}>
          <CardImage imageUrl={imageUrl} cardName={cardName} />
        </Tooltip>
      )}
    </>
  );
}
