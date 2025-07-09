import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trophy, Star, Target, Calendar, Award, TrendingUp, Users, Crown } from 'lucide-react';
import { AchievementCard } from './AchievementCard';
import { AchievementModal } from './AchievementModal';
import { AchievementGallery } from './AchievementGallery';

const AchievementTab = ({ 
  achievements = [], 
  loading = false, 
  onRefresh = () => {} 
}) => {
  const [selectedAchievement, setSelectedAchievement] = useState(null);
  const [activeView, setActiveView] = useState('overview');

  // Calculate statistics
  const completedAchievements = achievements.filter(a => a.is_completed);
  const totalPoints = completedAchievements.reduce((sum, a) => sum + (a.points || 0), 0);
  const recentAchievements = completedAchievements
    .filter(a => a.completed_at)
    .sort((a, b) => new Date(b.completed_at) - new Date(a.completed_at))
    .slice(0, 5);

  const categoryStats = achievements.reduce((stats, achievement) => {
    const category = achievement.category || 'other';
    if (!stats[category]) {
      stats[category] = { total: 0, completed: 0 };
    }
    stats[category].total++;
    if (achievement.is_completed) {
      stats[category].completed++;
    }
    return stats;
  }, {});

  const rarityStats = achievements.reduce((stats, achievement) => {
    const rarity = achievement.rarity || 'common';
    if (!stats[rarity]) {
      stats[rarity] = { total: 0, completed: 0 };
    }
    stats[rarity].total++;
    if (achievement.is_completed) {
      stats[rarity].completed++;
    }
    return stats;
  }, {});

  const completionRate = achievements.length > 0 
    ? Math.round((completedAchievements.length / achievements.length) * 100)
    : 0;

  // Get achievements close to completion
  const almostCompleted = achievements
    .filter(a => !a.is_completed && a.user_progress)
    .filter(a => {
      const progress = a.user_progress;
      const percentage = (progress.current / progress.target) * 100;
      return percentage >= 50; // 50% or more complete
    })
    .sort((a, b) => {
      const aProgress = (a.user_progress.current / a.user_progress.target) * 100;
      const bProgress = (b.user_progress.current / b.user_progress.target) * 100;
      return bProgress - aProgress;
    })
    .slice(0, 6);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading achievements...</p>
        </div>
      </div>
    );
  }

  const OverviewView = () => (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Points</p>
                <p className="text-2xl font-bold">{totalPoints}</p>
              </div>
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{completedAchievements.length}</p>
                <p className="text-xs text-muted-foreground">of {achievements.length}</p>
              </div>
              <Award className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Completion Rate</p>
                <p className="text-2xl font-bold">{completionRate}%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent</p>
                <p className="text-2xl font-bold">{recentAchievements.length}</p>
                <p className="text-xs text-muted-foreground">this month</p>
              </div>
              <Calendar className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Progress by Category */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            Progress by Category
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Object.entries(categoryStats).map(([category, stats]) => (
              <div key={category} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium capitalize">{category}</span>
                  <span className="text-sm text-muted-foreground">
                    {stats.completed}/{stats.total}
                  </span>
                </div>
                <Progress 
                  value={(stats.completed / stats.total) * 100} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Achievements */}
      {recentAchievements.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="w-5 h-5" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentAchievements.map(achievement => (
                <div 
                  key={achievement.id}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => setSelectedAchievement(achievement)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{achievement.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {new Date(achievement.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    +{achievement.points} pts
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Almost Completed */}
      {almostCompleted.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="w-5 h-5" />
              Almost There
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {almostCompleted.map(achievement => (
                <AchievementCard
                  key={achievement.id}
                  achievement={achievement}
                  onClick={() => setSelectedAchievement(achievement)}
                  showProgress={true}
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rarity Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="w-5 h-5" />
            Rarity Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(rarityStats).map(([rarity, stats]) => {
              const rarityColors = {
                common: 'text-gray-600',
                uncommon: 'text-green-600',
                rare: 'text-blue-600',
                mythic: 'text-purple-600'
              };
              
              return (
                <div key={rarity} className="text-center">
                  <div className={`text-2xl font-bold ${rarityColors[rarity]}`}>
                    {stats.completed}
                  </div>
                  <div className="text-sm text-muted-foreground capitalize">
                    {rarity}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    of {stats.total}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const AllAchievementsView = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">All Achievements</h2>
        <Button variant="outline" size="sm" onClick={onRefresh}>
          Refresh
        </Button>
      </div>
      <AchievementGallery
        achievements={achievements}
        onAchievementClick={setSelectedAchievement}
      />
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Achievements</h1>
          <p className="text-muted-foreground">
            Track your progress and unlock rewards
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">{totalPoints} points</span>
        </div>
      </div>

      {/* View Toggle */}
      <div className="flex gap-2">
        <Button
          variant={activeView === 'overview' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('overview')}
        >
          Overview
        </Button>
        <Button
          variant={activeView === 'all' ? 'default' : 'outline'}
          size="sm"
          onClick={() => setActiveView('all')}
        >
          All Achievements
        </Button>
      </div>

      {/* Content */}
      {activeView === 'overview' ? <OverviewView /> : <AllAchievementsView />}

      {/* Empty State */}
      {achievements.length === 0 && (
        <div className="text-center py-12">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">No Achievements Yet</h3>
          <p className="text-muted-foreground mb-4">
            Start collecting cards and building decks to unlock achievements!
          </p>
          <Button onClick={onRefresh}>
            Refresh Achievements
          </Button>
        </div>
      )}

      {/* Achievement Details Modal */}
      <AchievementModal
        achievement={selectedAchievement}
        isOpen={!!selectedAchievement}
        onClose={() => setSelectedAchievement(null)}
      />
    </div>
  );
};

export default AchievementTab;