import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Trophy, Star, Crown, Gem, Lock, Calendar, Target, Award } from 'lucide-react';

// Icon mapping for achievements
export const getAchievementIcon = (iconName) => {
  const icons = {
    'star': Star,
    'trophy': Trophy,
    'crown': Crown,
    'gem': Gem,
    'award': Award,
    'target': Target,
    'calendar': Calendar,
    'layers': Award, // Default for deck achievements
    'bookmark': Star,
    'archive': Trophy,
    'construction': Award,
    'cpu': Gem,
    'user': Crown,
    'zap': Star,
    'heart': Trophy,
    'wand': Crown,
    'sparkles': Star
  };
  return icons[iconName] || Trophy;
};

// Rarity color mapping
export const getRarityConfig = (rarity) => {
  const configs = {
    common: {
      bgColor: 'bg-gray-100 dark:bg-gray-800',
      borderColor: 'border-gray-300 dark:border-gray-600',
      textColor: 'text-gray-700 dark:text-gray-300',
      badgeColor: 'bg-gray-500',
      glowColor: 'shadow-gray-500/20'
    },
    uncommon: {
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      borderColor: 'border-green-300 dark:border-green-600',
      textColor: 'text-green-700 dark:text-green-300',
      badgeColor: 'bg-green-500',
      glowColor: 'shadow-green-500/20'
    },
    rare: {
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      borderColor: 'border-blue-300 dark:border-blue-600',
      textColor: 'text-blue-700 dark:text-blue-300',
      badgeColor: 'bg-blue-500',
      glowColor: 'shadow-blue-500/20'
    },
    mythic: {
      bgColor: 'bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
      borderColor: 'border-purple-300 dark:border-purple-600',
      textColor: 'text-purple-700 dark:text-purple-300',
      badgeColor: 'bg-gradient-to-r from-purple-500 to-pink-500',
      glowColor: 'shadow-purple-500/30'
    }
  };
  return configs[rarity] || configs.common;
};

// Individual Achievement Card Component
export const AchievementCard = ({ achievement, onClick, showProgress = true }) => {
  const IconComponent = getAchievementIcon(achievement.icon);
  const config = getRarityConfig(achievement.rarity);
  const progress = achievement.user_progress || { current: 0, target: 1, completed: false };
  const isCompleted = achievement.is_completed || progress.completed;
  const progressPercentage = Math.min((progress.current / progress.target) * 100, 100);

  return (
    <Card 
      className={`
        relative overflow-hidden transition-all duration-300 hover:scale-[1.02] cursor-pointer
        ${config.bgColor} ${config.borderColor} ${isCompleted ? config.glowColor + ' shadow-lg' : ''}
        ${isCompleted ? 'ring-2 ring-opacity-50' : ''}
      `}
      onClick={onClick}
    >
      {/* Completion glow effect */}
      {isCompleted && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse" />
      )}
      
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`
              p-2 rounded-lg ${isCompleted ? config.badgeColor : 'bg-gray-200 dark:bg-gray-700'}
              ${isCompleted ? 'text-white' : 'text-gray-500'}
            `}>
              {isCompleted ? (
                <IconComponent className="w-5 h-5" />
              ) : (
                <Lock className="w-5 h-5" />
              )}
            </div>
            <div>
              <CardTitle className={`text-sm ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                {achievement.name}
              </CardTitle>
              <Badge 
                variant="secondary" 
                className={`text-xs ${config.badgeColor} text-white border-0 mt-1`}
              >
                {achievement.rarity} • {achievement.points} pts
              </Badge>
            </div>
          </div>
          
          {isCompleted && (
            <div className="text-yellow-500">
              <Trophy className="w-5 h-5" />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <p className={`text-xs ${config.textColor} ${!isCompleted ? 'opacity-60' : ''} mb-3`}>
          {achievement.description}
        </p>
        
        {showProgress && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-xs ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                Progress
              </span>
              <span className={`text-xs font-medium ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                {progress.current}/{progress.target}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={`h-2 ${!isCompleted ? 'opacity-60' : ''}`}
            />
            {isCompleted && achievement.completed_at && (
              <p className="text-xs text-muted-foreground">
                Completed {new Date(achievement.completed_at).toLocaleDateString()}
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};