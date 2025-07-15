import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Square, MapPin, Activity, TrendingUp, Settings, Share2 } from 'lucide-react';
import RouteCanvas from './components/RouteCanvas';
import PerformanceChart from './components/PerformanceChart';
import WorkoutHistory from './components/WorkoutHistory';
import NetworkStatus from './components/NetworkStatus';
import GestureHandler from './components/GestureHandler';
import VoiceCommands from './components/VoiceCommands';
import AchievementSystem from './components/AchievementSystem';
import SocialSharing from './components/SocialSharing';
import OfflineIndicator from './components/OfflineIndicator';
import { useGeolocation } from './hooks/useGeolocation';
import { useNetworkInfo } from './hooks/useNetworkInfo';
import { useBackgroundTasks } from './hooks/useBackgroundTasks';
import { useOfflineStorage } from './hooks/useOfflineStorage';
import { WorkoutData, RoutePoint } from './types';

function App() {
  const [isTracking, setIsTracking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentWorkout, setCurrentWorkout] = useState<WorkoutData | null>(null);
  const [route, setRoute] = useState<RoutePoint[]>([]);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [shareWorkout, setShareWorkout] = useState<WorkoutData | null>(null);
  const [currentView, setCurrentView] = useState<'dashboard' | 'history' | 'analytics'>('dashboard');
  
  const { location, accuracy, watchPosition, stopWatching } = useGeolocation();
  const { networkInfo, isOnline } = useNetworkInfo();
  const { scheduleTask } = useBackgroundTasks();
  const { workouts, pendingSyncCount, saveWorkout } = useOfflineStorage(isOnline);

  const startTimeRef = useRef<number | null>(null);
  const distanceRef = useRef<number>(0);
  const lastPositionRef = useRef<GeolocationPosition | null>(null);

  useEffect(() => {
    if (location && isTracking && !isPaused) {
      const newPoint: RoutePoint = {
        lat: location.coords.latitude,
        lng: location.coords.longitude,
        timestamp: Date.now(),
        speed: location.coords.speed || 0,
        accuracy: location.coords.accuracy
      };

      setRoute(prev => [...prev, newPoint]);

      // Calculate distance using background tasks
      if (lastPositionRef.current) {
        scheduleTask(() => {
          const distance = calculateDistance(
            lastPositionRef.current!.coords.latitude,
            lastPositionRef.current!.coords.longitude,
            location.coords.latitude,
            location.coords.longitude
          );
          distanceRef.current += distance;
        });
      }

      lastPositionRef.current = location;
    }
  }, [location, isTracking, isPaused, scheduleTask]);

  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371000; // Earth's radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const startWorkout = () => {
    setIsTracking(true);
    setIsPaused(false);
    startTimeRef.current = Date.now();
    distanceRef.current = 0;
    setRoute([]);
    watchPosition();
    
    setCurrentWorkout({
      id: Date.now().toString(),
      startTime: Date.now(),
      endTime: null,
      distance: 0,
      duration: 0,
      route: [],
      averageSpeed: 0,
      maxSpeed: 0,
      calories: 0
    });
  };

  const pauseWorkout = () => {
    setIsPaused(!isPaused);
  };

  const stopWorkout = () => {
    if (currentWorkout && startTimeRef.current) {
      const endTime = Date.now();
      const duration = endTime - startTimeRef.current;
      const avgSpeed = distanceRef.current / (duration / 1000);
      const maxSpeed = Math.max(...route.map(p => p.speed));
      const calories = Math.round(distanceRef.current * 0.05); // Rough calculation

      const finishedWorkout: WorkoutData = {
        ...currentWorkout,
        endTime,
        duration,
        distance: distanceRef.current,
        route,
        averageSpeed: avgSpeed,
        maxSpeed,
        calories
      };

      // Use background task to save workout data
      scheduleTask(() => {
        saveWorkout(finishedWorkout);
      });
    }

    setIsTracking(false);
    setIsPaused(false);
    setCurrentWorkout(null);
    stopWatching();
  };

  const handleVoiceCommand = (command: string) => {
    switch (command) {
      case 'START_WORKOUT':
        if (!isTracking) startWorkout();
        break;
      case 'STOP_WORKOUT':
        if (isTracking) stopWorkout();
        break;
      case 'PAUSE_WORKOUT':
        if (isTracking) pauseWorkout();
        break;
      case 'RESUME_WORKOUT':
        if (isTracking && isPaused) pauseWorkout();
        break;
      case 'SHOW_STATS':
        setCurrentView('analytics');
        break;
      case 'SHOW_HISTORY':
        setCurrentView('history');
        break;
      case 'RESET_TIMER':
        if (!isTracking) {
          distanceRef.current = 0;
          setRoute([]);
        }
        break;
      case 'TAKE_SCREENSHOT':
        // Implement screenshot functionality
        break;
    }
  };

  const handleGestureSwipeLeft = () => {
    const views: Array<typeof currentView> = ['dashboard', 'analytics', 'history'];
    const currentIndex = views.indexOf(currentView);
    const nextIndex = (currentIndex + 1) % views.length;
    setCurrentView(views[nextIndex]);
  };

  const handleGestureSwipeRight = () => {
    const views: Array<typeof currentView> = ['dashboard', 'analytics', 'history'];
    const currentIndex = views.indexOf(currentView);
    const prevIndex = currentIndex === 0 ? views.length - 1 : currentIndex - 1;
    setCurrentView(views[prevIndex]);
  };

  const handleAchievementUnlocked = (achievement: any) => {
    // Add haptic feedback
    if ('vibrate' in navigator) {
      navigator.vibrate([100, 50, 100, 50, 200]);
    }
    
    // Play achievement sound (if audio is enabled)
    try {
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.volume = 0.3;
      audio.play().catch(() => {}); // Ignore errors if audio fails
    } catch (error) {
      // Ignore audio errors
    }
  };

  const formatTime = (milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    return `${hours.toString().padStart(2, '0')}:${(minutes % 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`;
  };

  const formatDistance = (meters: number) => {
    return meters < 1000 ? `${Math.round(meters)}m` : `${(meters / 1000).toFixed(2)}km`;
  };

  const currentDuration = currentWorkout && startTimeRef.current ? 
    Date.now() - startTimeRef.current : 0;

  const renderCurrentView = () => {
    switch (currentView) {
      case 'analytics':
        return (
          <div className="space-y-6">
            <AchievementSystem 
              workouts={workouts} 
              onAchievementUnlocked={handleAchievementUnlocked}
            />
            {workouts.length > 0 && (
              <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <TrendingUp className="h-5 w-5 mr-2" />
                  Performance Analytics
                </h2>
                <PerformanceChart workouts={workouts} />
              </div>
            )}
          </div>
        );
      case 'history':
        return (
          <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Workout History</h2>
              {workouts.length > 0 && (
                <button
                  onClick={() => setShareWorkout(workouts[0])}
                  className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Share2 className="w-4 h-4" />
                  <span className="text-sm">Share Latest</span>
                </button>
              )}
            </div>
            <WorkoutHistory workouts={workouts} />
          </div>
        );
      default:
        return (
          <>
            {/* Current Workout Stats */}
            {(isTracking || currentWorkout) && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Duration</p>
                      <p className="text-2xl font-bold">{formatTime(currentDuration)}</p>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-full">
                      <Activity className="h-6 w-6 text-blue-400" />
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Distance</p>
                      <p className="text-2xl font-bold">{formatDistance(distanceRef.current)}</p>
                    </div>
                    <div className="p-3 bg-green-500/20 rounded-full">
                      <MapPin className="h-6 w-6 text-green-400" />
                    </div>
                  </div>
                </div>

                <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-300">Speed</p>
                      <p className="text-2xl font-bold">
                        {location?.coords.speed ? `${(location.coords.speed * 3.6).toFixed(1)} km/h` : '0 km/h'}
                      </p>
                    </div>
                    <div className="p-3 bg-purple-500/20 rounded-full">
                      <TrendingUp className="h-6 w-6 text-purple-400" />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Route Canvas */}
            <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4 flex items-center">
                <MapPin className="h-5 w-5 mr-2" />
                Live Route
              </h2>
              <RouteCanvas route={route} currentLocation={location} />
            </div>
          </>
        );
    }
  };

  return (
    <GestureHandler
      onSwipeLeft={handleGestureSwipeLeft}
      onSwipeRight={handleGestureSwipeRight}
      onDoubleTap={() => setCurrentView('dashboard')}
      onLongPress={() => setShowSettings(true)}
      className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 text-white"
    >
      {/* Offline Indicator */}
      <OfflineIndicator isOnline={isOnline} pendingSyncCount={pendingSyncCount} />

      {/* Header */}
      <div className="relative backdrop-blur-md bg-white/10 border-b border-white/20">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Activity className="h-8 w-8 text-purple-400" />
              <h1 className="text-2xl font-bold">FitTrack Pro</h1>
            </div>
            
            <div className="flex items-center space-x-4">
              <NetworkStatus networkInfo={networkInfo} isOnline={isOnline} />
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              >
                <Settings className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex space-x-1 mt-4 bg-white/5 rounded-xl p-1">
            {[
              { key: 'dashboard', label: 'Dashboard', icon: Activity },
              { key: 'analytics', label: 'Analytics', icon: TrendingUp },
              { key: 'history', label: 'History', icon: MapPin }
            ].map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setCurrentView(key as any)}
                className={`
                  flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg transition-all duration-200
                  ${currentView === key 
                    ? 'bg-white/20 text-white shadow-lg' 
                    : 'text-gray-300 hover:text-white hover:bg-white/10'
                  }
                `}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 space-y-6">
        {renderCurrentView()}

        {/* Control Buttons */}
        <div className="flex justify-center space-x-4">
          {!isTracking ? (
            <button
              onClick={startWorkout}
              className="flex items-center space-x-2 bg-green-500 hover:bg-green-600 px-8 py-4 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
            >
              <Play className="h-5 w-5" />
              <span>Start Workout</span>
            </button>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={pauseWorkout}
                className="flex items-center space-x-2 bg-yellow-500 hover:bg-yellow-600 px-6 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Pause className="h-5 w-5" />
                <span>{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
              <button
                onClick={stopWorkout}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-600 px-6 py-3 rounded-full font-semibold transition-all duration-200 transform hover:scale-105 shadow-lg"
              >
                <Square className="h-5 w-5" />
                <span>Stop</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Voice Commands */}
      <VoiceCommands
        onCommand={handleVoiceCommand}
        isEnabled={voiceEnabled}
        onToggle={() => setVoiceEnabled(!voiceEnabled)}
      />

      {/* Social Sharing Modal */}
      {shareWorkout && (
        <SocialSharing
          workout={shareWorkout}
          onClose={() => setShareWorkout(null)}
        />
      )}
    </GestureHandler>
  );
}

export default App;