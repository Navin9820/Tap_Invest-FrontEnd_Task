import React, { useState, useEffect } from 'react';
import { Trophy, Star, Target, Zap, Award, Medal } from 'lucide-react';
import { WorkoutData } from '../types';

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  condition: (workouts: WorkoutData[]) => boolean;
  unlocked: boolean;
  unlockedAt?: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AchievementSystemProps {
  workouts: WorkoutData[];
  onAchievementUnlocked: (achievement: Achievement) => void;
}

const AchievementSystem: React.FC<AchievementSystemProps> = ({ workouts, onAchievementUnlocked }) => {
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first_workout',
      title: 'First Steps',
      description: 'Complete your first workout',
      icon: <Star className="w-6 h-6" />,
      condition: (workouts) => workouts.length >= 1,
      unlocked: false,
      rarity: 'common'
    },
    {
      id: 'distance_1km',
      title: 'Distance Walker',
      description: 'Cover 1km in a single workout',
      icon: <Target className="w-6 h-6" />,
      condition: (workouts) => workouts.some(w => w.distance >= 1000),
      unlocked: false,
      rarity: 'common'
    },
    {
      id: 'distance_5km',
      title: 'Distance Runner',
      description: 'Cover 5km in a single workout',
      icon: <Zap className="w-6 h-6" />,
      condition: (workouts) => workouts.some(w => w.distance >= 5000),
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: 'speed_demon',
      title: 'Speed Demon',
      description: 'Reach 20 km/h max speed',
      icon: <Zap className="w-6 h-6" />,
      condition: (workouts) => workouts.some(w => w.maxSpeed * 3.6 >= 20),
      unlocked: false,
      rarity: 'rare'
    },
    {
      id: 'consistency_week',
      title: 'Weekly Warrior',
      description: 'Work out 7 days in a row',
      icon: <Award className="w-6 h-6" />,
      condition: (workouts) => {
        if (workouts.length < 7) return false;
        const sortedWorkouts = workouts.sort((a, b) => a.startTime - b.startTime);
        let consecutiveDays = 1;
        let maxConsecutive = 1;
        
        for (let i = 1; i < sortedWorkouts.length; i++) {
          const prevDate = new Date(sortedWorkouts[i - 1].startTime).toDateString();
          const currDate = new Date(sortedWorkouts[i].startTime).toDateString();
          const dayDiff = (new Date(currDate).getTime() - new Date(prevDate).getTime()) / (1000 * 60 * 60 * 24);
          
          if (dayDiff === 1) {
            consecutiveDays++;
            maxConsecutive = Math.max(maxConsecutive, consecutiveDays);
          } else if (dayDiff > 1) {
            consecutiveDays = 1;
          }
        }
        
        return maxConsecutive >= 7;
      },
      unlocked: false,
      rarity: 'epic'
    },
    {
      id: 'marathon_distance',
      title: 'Marathon Master',
      description: 'Cover 42.2km total distance',
      icon: <Medal className="w-6 h-6" />,
      condition: (workouts) => {
        const totalDistance = workouts.reduce((sum, w) => sum + w.distance, 0);
        return totalDistance >= 42200;
      },
      unlocked: false,
      rarity: 'legendary'
    },
    {
      id: 'calorie_burner',
      title: 'Calorie Crusher',
      description: 'Burn 500 calories in a single workout',
      icon: <Trophy className="w-6 h-6" />,
      condition: (workouts) => workouts.some(w => w.calories >= 500),
      unlocked: false,
      rarity: 'epic'
    }
  ]);

  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);

  useEffect(() => {
    const updatedAchievements = achievements.map(achievement => {
      const shouldUnlock = !achievement.unlocked && achievement.condition(workouts);
      
      if (shouldUnlock) {
        const unlockedAchievement = {
          ...achievement,
          unlocked: true,
          unlockedAt: Date.now()
        };
        
        setNewAchievements(prev => [...prev, unlockedAchievement]);
        onAchievementUnlocked(unlockedAchievement);
        
        // Remove from new achievements after 5 seconds
        setTimeout(() => {
          setNewAchievements(prev => prev.filter(a => a.id !== achievement.id));
        }, 5000);
        
        return unlockedAchievement;
      }
      
      return achievement;
    });

    setAchievements(updatedAchievements);
  }, [workouts]);

  const getRarityColor = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'from-gray-400 to-gray-600';
      case 'rare': return 'from-blue-400 to-blue-600';
      case 'epic': return 'from-purple-400 to-purple-600';
      case 'legendary': return 'from-yellow-400 to-orange-600';
      default: return 'from-gray-400 to-gray-600';
    }
  };

  const getRarityBorder = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common': return 'border-gray-400/50';
      case 'rare': return 'border-blue-400/50';
      case 'epic': return 'border-purple-400/50';
      case 'legendary': return 'border-yellow-400/50';
      default: return 'border-gray-400/50';
    }
  };

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const progressPercentage = (unlockedCount / totalCount) * 100;

  return (
    <div className="space-y-6">
      {/* New Achievement Notifications */}
      <div className="fixed top-20 right-4 z-50 space-y-2">
        {newAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className="backdrop-blur-md bg-gradient-to-r from-yellow-500/20 to-orange-500/20 
                     rounded-xl p-4 border border-yellow-400/30 shadow-lg
                     animate-slideInRight transform transition-all duration-500"
          >
            <div className="flex items-center space-x-3">
              <div className={`
                p-2 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}
                shadow-lg animate-pulse
              `}>
                {achievement.icon}
              </div>
              <div>
                <div className="text-white font-semibold">Achievement Unlocked!</div>
                <div className="text-yellow-300 text-sm">{achievement.title}</div>
                <div className="text-gray-300 text-xs">{achievement.description}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Achievement Progress */}
      <div className="backdrop-blur-md bg-white/10 rounded-2xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-400" />
            Achievements
          </h2>
          <div className="text-sm text-gray-300">
            {unlockedCount}/{totalCount}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex justify-between text-sm text-gray-300 mb-2">
            <span>Progress</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-3">
            <div
              className="bg-gradient-to-r from-yellow-400 to-orange-500 h-3 rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            ></div>
          </div>
        </div>

        {/* Achievement Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`
                relative p-4 rounded-xl border transition-all duration-300
                ${achievement.unlocked 
                  ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)}/20 ${getRarityBorder(achievement.rarity)} shadow-lg` 
                  : 'bg-white/5 border-white/10 grayscale'
                }
                ${achievement.unlocked ? 'transform hover:scale-105' : ''}
              `}
            >
              {achievement.unlocked && (
                <div className="absolute -top-2 -right-2">
                  <div className={`
                    w-6 h-6 rounded-full bg-gradient-to-r ${getRarityColor(achievement.rarity)}
                    flex items-center justify-center shadow-lg
                  `}>
                    <Star className="w-3 h-3 text-white" />
                  </div>
                </div>
              )}

              <div className="flex items-start space-x-3">
                <div className={`
                  p-2 rounded-full transition-all duration-300
                  ${achievement.unlocked 
                    ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} shadow-lg` 
                    : 'bg-gray-600'
                  }
                `}>
                  {achievement.icon}
                </div>

                <div className="flex-1">
                  <h3 className={`font-semibold ${achievement.unlocked ? 'text-white' : 'text-gray-400'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`text-sm ${achievement.unlocked ? 'text-gray-200' : 'text-gray-500'}`}>
                    {achievement.description}
                  </p>
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className={`
                      text-xs px-2 py-1 rounded-full capitalize
                      ${achievement.unlocked 
                        ? `bg-gradient-to-r ${getRarityColor(achievement.rarity)} text-white` 
                        : 'bg-gray-600 text-gray-300'
                      }
                    `}>
                      {achievement.rarity}
                    </span>
                    
                    {achievement.unlocked && achievement.unlockedAt && (
                      <span className="text-xs text-gray-400">
                        {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AchievementSystem;