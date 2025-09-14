import { useState, useRef, useCallback, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

interface TooltipOptions {
  delay?: number;
  offset?: number;
  tooltipWidth?: number;
  tooltipHeight?: number;
}

interface UseTooltipReturn {
  isVisible: boolean;
  position: Position;
  triggerRef: React.RefObject<HTMLElement | null>;
  handleMouseEnter: (e: React.MouseEvent) => void;
  handleMouseLeave: () => void;
  showTooltip: () => void;
  hideTooltip: () => void;
}

export function useTooltip(options: TooltipOptions = {}): UseTooltipReturn {
  const {
    delay = 300,
    offset = 10,
    tooltipWidth = 250,
    tooltipHeight = 350,
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLElement | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const calculatePosition = useCallback(
    (triggerElement: HTMLElement): Position => {
      const rect = triggerElement.getBoundingClientRect();

      // Try to position to the right first
      let x = rect.right + offset;
      let y = rect.top;

      // Adjust if tooltip would go off screen horizontally
      if (x + tooltipWidth > window.innerWidth) {
        x = rect.left - tooltipWidth - offset;
      }

      // Adjust if tooltip would go off screen vertically
      if (y + tooltipHeight > window.innerHeight) {
        y = window.innerHeight - tooltipHeight - offset;
      }

      // Ensure minimum distance from edges
      x = Math.max(offset, x);
      y = Math.max(offset, y);

      return { x, y };
    },
    [offset, tooltipWidth, tooltipHeight]
  );

  const showTooltip = useCallback(() => {
    if (triggerRef.current) {
      const newPosition = calculatePosition(triggerRef.current);
      setPosition(newPosition);
      setIsVisible(true);
    }
  }, [calculatePosition]);

  const hideTooltip = useCallback(() => {
    setIsVisible(false);
  }, []);

  const handleMouseEnter = useCallback(
    (e: React.MouseEvent) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for showing tooltip
      timeoutRef.current = setTimeout(showTooltip, delay);
    },
    [delay, showTooltip]
  );

  const handleMouseLeave = useCallback(() => {
    // Clear timeout if mouse leaves before delay completes
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    hideTooltip();
  }, [hideTooltip]);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    isVisible,
    position,
    triggerRef,
    handleMouseEnter,
    handleMouseLeave,
    showTooltip,
    hideTooltip,
  };
}
