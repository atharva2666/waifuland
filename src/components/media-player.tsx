'use client';

import Image from 'next/image';

interface MediaPlayerProps {
  src: string;
  alt: string;
  priority?: boolean;
}

export function MediaPlayer({ src, alt, priority = false }: MediaPlayerProps) {
  const isVideo = /\.(mp4|webm)$/i.test(src);

  if (isVideo) {
    return (
      <video
        src={src}
        alt={alt}
        className="w-full h-full object-contain"
        controls
        autoPlay
        loop
        muted
        playsInline
      />
    );
  }

  // next/image handles jpg, png, and gif.
  // Using unoptimized for gifs ensures they animate correctly.
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
      className="object-contain"
      unoptimized={src.endsWith('.gif')}
      priority={priority}
    />
  );
}
