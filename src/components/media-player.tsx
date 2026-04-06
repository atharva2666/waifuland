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
        className="w-full h-auto object-contain rounded-lg"
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
      width={1920}
      height={1080}
      className="w-full h-auto object-contain"
      unoptimized={src.endsWith('.gif')}
      priority={priority}
    />
  );
}
