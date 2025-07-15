import React, { useRef, useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

interface GestureHandlerProps {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onDoubleTap?: () => void;
  onLongPress?: () => void;
  children: React.ReactNode;
  className?: string;
}

const GestureHandler: React.FC<GestureHandlerProps> = ({
  onSwipeLeft,
  onSwipeRight,
  onDoubleTap,
  onLongPress,
  children,
  className = ''
}) => {
  const elementRef = useRef<HTMLDivElement>(null);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number; time: number } | null>(null);
  const [lastTap, setLastTap] = useState<number>(0);
  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);
  const [swipeIndicator, setSwipeIndicator] = useState<'left' | 'right' | null>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const handleTouchStart = (e: TouchEvent) => {
      const touch = e.touches[0];
      setTouchStart({
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now()
      });

      // Start long press timer
      if (onLongPress) {
        const timer = setTimeout(() => {
          onLongPress();
          // Add haptic feedback if available
          if ('vibrate' in navigator) {
            navigator.vibrate(50);
          }
        }, 500);
        setLongPressTimer(timer);
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      // Cancel long press on move
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      if (!touchStart) return;

      const touch = e.touches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;

      // Show swipe indicator for horizontal swipes
      if (Math.abs(deltaX) > 50 && Math.abs(deltaY) < 100) {
        setSwipeIndicator(deltaX > 0 ? 'right' : 'left');
      } else {
        setSwipeIndicator(null);
      }
    };

    const handleTouchEnd = (e: TouchEvent) => {
      // Clear long press timer
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }

      if (!touchStart) return;

      const touch = e.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const deltaTime = Date.now() - touchStart.time;

      // Check for swipe gestures
      if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 100 && deltaTime < 300) {
        if (deltaX > 0 && onSwipeRight) {
          onSwipeRight();
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        } else if (deltaX < 0 && onSwipeLeft) {
          onSwipeLeft();
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate(30);
          }
        }
      }

      // Check for double tap
      if (onDoubleTap && Math.abs(deltaX) < 10 && Math.abs(deltaY) < 10 && deltaTime < 300) {
        const now = Date.now();
        if (now - lastTap < 300) {
          onDoubleTap();
          // Add haptic feedback
          if ('vibrate' in navigator) {
            navigator.vibrate([30, 50, 30]);
          }
        }
        setLastTap(now);
      }

      setTouchStart(null);
      setSwipeIndicator(null);
    };

    element.addEventListener('touchstart', handleTouchStart, { passive: true });
    element.addEventListener('touchmove', handleTouchMove, { passive: true });
    element.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      element.removeEventListener('touchstart', handleTouchStart);
      element.removeEventListener('touchmove', handleTouchMove);
      element.removeEventListener('touchend', handleTouchEnd);
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [touchStart, lastTap, longPressTimer, onSwipeLeft, onSwipeRight, onDoubleTap, onLongPress]);

  return (
    <div ref={elementRef} className={`relative ${className}`}>
      {children}
      
      {/* Swipe Indicators */}
      {swipeIndicator && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className={`
            flex items-center justify-center w-16 h-16 rounded-full
            bg-white/20 backdrop-blur-md border border-white/30
            animate-pulse transform transition-all duration-200
            ${swipeIndicator === 'left' ? 'translate-x-8' : '-translate-x-8'}
          `}>
            {swipeIndicator === 'left' ? (
              <ChevronLeft className="w-8 h-8 text-white" />
            ) : (
              <ChevronRight className="w-8 h-8 text-white" />
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default GestureHandler;