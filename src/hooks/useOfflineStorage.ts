import { useState, useEffect, useCallback } from 'react';
import { WorkoutData } from '../types';

interface OfflineStorageHook {
  workouts: WorkoutData[];
  pendingSyncCount: number;
  saveWorkout: (workout: WorkoutData) => void;
  syncPendingData: () => Promise<void>;
  clearStorage: () => void;
}

export const useOfflineStorage = (isOnline: boolean): OfflineStorageHook => {
  const [workouts, setWorkouts] = useState<WorkoutData[]>([]);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);

  const STORAGE_KEYS = {
    WORKOUTS: 'fittrack_workouts',
    PENDING_SYNC: 'fittrack_pending_sync'
  };

  // Load data from localStorage on mount
  useEffect(() => {
    try {
      const storedWorkouts = localStorage.getItem(STORAGE_KEYS.WORKOUTS);
      const pendingSync = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);

      if (storedWorkouts) {
        setWorkouts(JSON.parse(storedWorkouts));
      }

      if (pendingSync) {
        const pendingItems = JSON.parse(pendingSync);
        setPendingSyncCount(pendingItems.length);
      }
    } catch (error) {
      console.error('Error loading offline data:', error);
    }
  }, []);

  // Save workout to localStorage
  const saveWorkout = useCallback((workout: WorkoutData) => {
    try {
      const updatedWorkouts = [workout, ...workouts];
      setWorkouts(updatedWorkouts);
      localStorage.setItem(STORAGE_KEYS.WORKOUTS, JSON.stringify(updatedWorkouts));

      // Add to pending sync if offline
      if (!isOnline) {
        const pendingSync = JSON.parse(localStorage.getItem(STORAGE_KEYS.PENDING_SYNC) || '[]');
        const updatedPending = [...pendingSync, workout];
        localStorage.setItem(STORAGE_KEYS.PENDING_SYNC, JSON.stringify(updatedPending));
        setPendingSyncCount(updatedPending.length);
      }
    } catch (error) {
      console.error('Error saving workout:', error);
    }
  }, [workouts, isOnline]);

  // Sync pending data when online
  const syncPendingData = useCallback(async () => {
    if (!isOnline) return;

    try {
      const pendingSync = localStorage.getItem(STORAGE_KEYS.PENDING_SYNC);
      if (!pendingSync) return;

      const pendingItems: WorkoutData[] = JSON.parse(pendingSync);
      if (pendingItems.length === 0) return;

      // Simulate API sync (replace with actual API calls)
      for (const workout of pendingItems) {
        await new Promise(resolve => setTimeout(resolve, 500)); // Simulate network delay
        
        // In a real app, you would send the workout to your server here
        console.log('Syncing workout:', workout.id);
      }

      // Clear pending sync after successful upload
      localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      setPendingSyncCount(0);

      console.log(`Successfully synced ${pendingItems.length} workouts`);
    } catch (error) {
      console.error('Error syncing data:', error);
    }
  }, [isOnline]);

  // Auto-sync when coming back online
  useEffect(() => {
    if (isOnline && pendingSyncCount > 0) {
      syncPendingData();
    }
  }, [isOnline, pendingSyncCount, syncPendingData]);

  // Clear all storage
  const clearStorage = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEYS.WORKOUTS);
      localStorage.removeItem(STORAGE_KEYS.PENDING_SYNC);
      setWorkouts([]);
      setPendingSyncCount(0);
    } catch (error) {
      console.error('Error clearing storage:', error);
    }
  }, []);

  // Estimate storage usage
  useEffect(() => {
    const estimateStorageUsage = () => {
      try {
        let totalSize = 0;
        for (const key in localStorage) {
          if (key.startsWith('fittrack_')) {
            totalSize += localStorage[key].length;
          }
        }
        
        // Log storage usage (in KB)
        console.log(`Storage usage: ${(totalSize / 1024).toFixed(2)} KB`);
        
        // Warn if approaching storage limits (assuming 5MB limit)
        if (totalSize > 4 * 1024 * 1024) { // 4MB warning threshold
          console.warn('Approaching localStorage limit. Consider implementing data cleanup.');
        }
      } catch (error) {
        console.error('Error estimating storage usage:', error);
      }
    };

    estimateStorageUsage();
  }, [workouts]);

  return {
    workouts,
    pendingSyncCount,
    saveWorkout,
    syncPendingData,
    clearStorage
  };
};