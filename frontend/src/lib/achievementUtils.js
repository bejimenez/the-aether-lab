import { Trophy, Star, Crown, Gem, Award, Target, Calendar, Zap, Wand, Sparkles, Heart } from 'lucide-react';

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
    'zap': Zap,
    'heart': Heart,
    'wand': Wand,
    'sparkles': Sparkles
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