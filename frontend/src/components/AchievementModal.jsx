import { getAchievementIcon, getRarityConfig } from "../lib/achievementUtils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Lock, Trophy } from 'lucide-react';

export const AchievementModal = ({ achievement, isOpen, onClose }) => {
  if (!achievement) return null;

  const IconComponent = getAchievementIcon(achievement.icon);
  const config = getRarityConfig(achievement.rarity);
  const progress = achievement.user_progress || { current: 0, target: 1, completed: false };
  const isCompleted = achievement.is_completed || progress.completed;
  const progressPercentage = Math.min((progress.current / progress.target) * 100, 100);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`max-w-md ${config.bgColor}`}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <div className={`
              p-3 rounded-lg ${isCompleted ? config.badgeColor : 'bg-gray-200 dark:bg-gray-700'}
              ${isCompleted ? 'text-white' : 'text-gray-500'}
            `}>
              {isCompleted ? (
                <IconComponent className="w-6 h-6" />
              ) : (
                <Lock className="w-6 h-6" />
              )}
            </div>
            <div>
              <h3 className={`text-lg font-bold ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                {achievement.name}
              </h3>
              <Badge 
                variant="secondary" 
                className={`text-xs ${config.badgeColor} text-white border-0 mt-1`}
              >
                {achievement.rarity} • {achievement.points} pts
              </Badge>
            </div>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <p className={`${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
            {achievement.description}
          </p>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className={`text-sm font-medium ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                Progress
              </span>
              <span className={`text-sm font-medium ${config.textColor} ${!isCompleted ? 'opacity-60' : ''}`}>
                {progress.current}/{progress.target}
              </span>
            </div>
            <Progress 
              value={progressPercentage} 
              className={`h-3 ${!isCompleted ? 'opacity-60' : ''}`}
            />
            
            {isCompleted ? (
              <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">
                  Completed {achievement.completed_at ? new Date(achievement.completed_at).toLocaleDateString() : 'recently'}
                </span>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                {progress.target - progress.current} more to go!
              </p>
            )}
          </div>
          
          {achievement.criteria && (
            <div className="bg-muted/50 p-3 rounded-lg">
              <h4 className="text-sm font-medium mb-2">Achievement Details</h4>
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Category: <span className="capitalize">{achievement.category}</span></p>
                <p>Type: <span className="capitalize">{achievement.criteria.type?.replace('_', ' ')}</span></p>
                {achievement.criteria.filter && (
                  <p>Requirements: {JSON.stringify(achievement.criteria.filter)}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};