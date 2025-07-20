import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Trophy } from 'lucide-react';
import { getAchievementIcon, getRarityConfig } from '../lib/achievementUtils';

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