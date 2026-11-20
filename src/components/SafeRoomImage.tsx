import { useState } from 'react';
import { Building2 } from 'lucide-react';
import { resolveAssetPath } from '../utils/basePath';

interface SafeRoomImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export function SafeRoomImage({
  src,
  alt,
  className = '',
  fallbackTitle,
}: SafeRoomImageProps) {
  const [hasError, setHasError] = useState(false);

  if (hasError || !src) {
    return (
      <div
        role="img"
        aria-label={alt}
        className={`flex flex-col items-center justify-center bg-[#F2EFE9] text-[#57534E] p-4 text-center ${className}`}
      >
        <Building2 className="w-8 h-8 text-[#78716C] mb-2" aria-hidden="true" />
        <span className="text-xs font-medium text-[#57534E] line-clamp-2">
          {fallbackTitle ?? alt}
        </span>
      </div>
    );
  }

  const resolvedSrc = resolveAssetPath(src);

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setHasError(true)}
      className={className}
    />
  );
}
