import React, { useRef, useEffect, useState } from 'react';
import { Calendar, MapPin, Clock, Zap, Flame } from 'lucide-react';
import { WorkoutData } from '../types';

interface WorkoutHistoryProps {
  workouts: WorkoutData[];
}

const WorkoutHistory: React.FC<WorkoutHistoryProps> = ({ workouts }) => {
  const [visibleWorkouts, setVisibleWorkouts] = useState<WorkoutData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const ITEMS_PER_PAGE = 5;

  useEffect(() => {
    // Initialize with first batch
    setVisibleWorkouts(workouts.slice(0, ITEMS_PER_PAGE));
  }, [workouts]);

  useEffect(() => {
    // Intersection Observer for infinite scroll
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && !isLoading && visibleWorkouts.length < workouts.length) {
          setIsLoading(true);
          
          // Simulate loading delay for better UX
          setTimeout(() => {
            const nextBatch = workouts.slice(
              visibleWorkouts.length,
              visibleWorkouts.length + ITEMS_PER_PAGE
            );
            setVisibleWorkouts(prev => [...prev, ...nextBatch]);
            setIsLoading(false);
          }, 500);
        }
      },
      {
        threshold: 0.1,
      }
    );

    if (sentinelRef.current) {
      observerRef.current.observe(sentinelRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [visibleWorkouts, workouts, isLoading]);

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    return `${minutes}m ${seconds % 60}s`;
  };

  const formatDistance = (meters: number) => {
    return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(2)}km`;
  };

  const formatSpeed = (mps: number) => {
    return `${(mps * 3.6).toFixed(1)} km/h`;
  };

  if (workouts.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-gray-400">
        <p>No workouts yet. Start your first workout!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {visibleWorkouts.map((workout, index) => (
        <div
          key={workout.id}
          className="backdrop-blur-sm bg-white/5 rounded-xl p-4 border border-white/10 hover:border-white/20 transition-all duration-300 transform hover:scale-[1.02] group"
          style={{
            animationDelay: `${index * 0.1}s`,
            animation: 'fadeInUp 0.5s ease-out forwards'
          }}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-blue-400" />
              <span className="text-sm text-gray-300">{formatDate(workout.startTime)}</span>
            </div>
            <div className="flex items-center space-x-1">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="text-sm text-orange-300">{workout.calories} cal</span>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="flex items-center space-x-2">
              <MapPin className="h-4 w-4 text-green-400" />
              <div>
                <p className="text-xs text-gray-400">Distance</p>
                <p className="font-semibold">{formatDistance(workout.distance)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Duration</p>
                <p className="font-semibold">{formatTime(workout.duration)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-yellow-400" />
              <div>
                <p className="text-xs text-gray-400">Avg Speed</p>
                <p className="font-semibold">{formatSpeed(workout.averageSpeed)}</p>
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Zap className="h-4 w-4 text-red-400" />
              <div>
                <p className="text-xs text-gray-400">Max Speed</p>
                <p className="font-semibold">{formatSpeed(workout.maxSpeed)}</p>
              </div>
            </div>
          </div>

          {/* Progress bar showing relative distance */}
          <div className="mt-4">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Route Progress</span>
              <span>{workout.route.length} points</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 group-hover:from-blue-400 group-hover:to-purple-400"
                style={{
                  width: `${Math.min((workout.distance / 5000) * 100, 100)}%`
                }}
              ></div>
            </div>
          </div>
        </div>
      ))}

      {/* Loading indicator */}
      {isLoading && (
        <div className="flex items-center justify-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      )}

      {/* Sentinel for infinite scroll */}
      {visibleWorkouts.length < workouts.length && (
        <div ref={sentinelRef} className="h-4"></div>
      )}

      {/* End of list indicator */}
      {visibleWorkouts.length === workouts.length && workouts.length > 0 && (
        <div className="text-center py-8 text-gray-400">
          <p>All workouts loaded</p>
        </div>
      )}
    </div>
  );
};

export default WorkoutHistory;