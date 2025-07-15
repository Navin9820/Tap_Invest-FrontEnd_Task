import { useCallback } from 'react';

export const useBackgroundTasks = () => {
  const scheduleTask = useCallback((task: () => void, options?: { timeout?: number }) => {
    if ('scheduler' in window && 'postTask' in (window as any).scheduler) {
      // Use modern Scheduler API if available
      (window as any).scheduler.postTask(task, { priority: 'background' });
    } else if ('requestIdleCallback' in window) {
      // Fallback to requestIdleCallback
      window.requestIdleCallback(() => {
        task();
      }, { timeout: options?.timeout || 5000 });
    } else {
      // Fallback to setTimeout with low priority
      setTimeout(task, 0);
    }
  }, []);

  const scheduleWorklet = useCallback((worklet: () => void) => {
    // Use requestIdleCallback for worklets that can be interrupted
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback((deadline) => {
        if (deadline.timeRemaining() > 0) {
          worklet();
        }
      });
    } else {
      setTimeout(worklet, 0);
    }
  }, []);

  return {
    scheduleTask,
    scheduleWorklet
  };
};