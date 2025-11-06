"use client";
import { useState } from "react";

interface CardImageProps {
  imageUrl: string;
  cardName: string;
  width?: number;
  height?: number;
}

export function CardImage({
  imageUrl,
  cardName,
  width = 192,
  height = 256,
}: CardImageProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleImageLoad = () => {
    setImageLoaded(true);
    setImageError(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setImageLoaded(false);
  };

  return (
    <div className="relative">
      {/* Loading placeholder */}
      {!imageLoaded && !imageError && (
        <div
          className="bg-gray-100 rounded flex items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div className="text-gray-500 text-sm">Loading...</div>
        </div>
      )}

      {/* Error placeholder */}
      {imageError && (
        <div
          className="bg-gray-100 rounded flex flex-col items-center justify-center"
          style={{ width: `${width}px`, height: `${height}px` }}
        >
          <div className="text-gray-500 text-sm text-center mb-2">
            Image not available
          </div>
          <div className="text-gray-400 text-xs text-center px-2">
            {cardName}
          </div>
        </div>
      )}

      {/* Card image */}
      <img
        src={imageUrl}
        alt={cardName}
        className={`w-80 h-auto rounded ${imageLoaded ? "block" : "hidden"}`}
        onLoad={handleImageLoad}
        onError={handleImageError}
      />

      {/* Card name caption */}
      {imageLoaded && (
        <div className="mt-2 text-xs text-gray-600 text-center">{cardName}</div>
      )}
    </div>
  );
}
