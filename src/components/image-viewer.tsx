'use client';

import { useEffect } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from './ui/button';
import { MediaPlayer } from './media-player';

interface ImageViewerProps {
  images: string[];
  activeIndex: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onPrev: () => void;
}

export function ImageViewer({
  images,
  activeIndex,
  isOpen,
  onClose,
  onNext,
  onPrev,
}: ImageViewerProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'ArrowRight') {
        onNext();
      } else if (event.key === 'ArrowLeft') {
        onPrev();
      } else if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onNext, onPrev, onClose]);

  if (!isOpen || images.length === 0) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-black/80 backdrop-blur-sm border-0 w-screen h-screen max-w-full rounded-none p-4 flex items-center justify-center">
        <DialogTitle className="sr-only">Image Viewer</DialogTitle>
        <DialogDescription className="sr-only">
          {`Viewing image ${activeIndex + 1} of ${
            images.length
          }. Use arrow keys to navigate.`}
        </DialogDescription>
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="relative max-w-[90vw] max-h-[90vh] flex items-center justify-center">
            <MediaPlayer
              src={images[activeIndex]}
              alt={`Image ${activeIndex + 1}`}
              objectFit="contain"
            />
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="absolute top-4 right-4 text-white bg-black/30 hover:bg-black/60 hover:text-white h-12 w-12 rounded-full z-10"
          >
            <X className="h-8 w-8" />
            <span className="sr-only">Close viewer</span>
          </Button>

          {images.length > 1 && (
            <>
              <Button
                variant="ghost"
                size="icon"
                onClick={onPrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/60 hover:text-white h-12 w-12 rounded-full"
              >
                <ChevronLeft className="h-8 w-8" />
                <span className="sr-only">Previous image</span>
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={onNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white bg-black/30 hover:bg-black/60 hover:text-white h-12 w-12 rounded-full"
              >
                <ChevronRight className="h-8 w-8" />
                <span className="sr-only">Next image</span>
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
