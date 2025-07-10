// File: frontend/src/components/AchievementGallery.jsx
// REPLACE the existing AchievementGallery with this version that has proper React imports

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Trophy } from 'lucide-react';
import { AchievementCard } from './AchievementCard';

// Achievement Gallery Component
export const AchievementGallery = ({ achievements, onAchievementClick }) => {
  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('rarity');

  const filteredAchievements = achievements.filter(achievement => {
    if (filter === 'completed') return achievement.is_completed;
    if (filter === 'incomplete') return !achievement.is_completed;
    if (filter !== 'all') return achievement.category === filter;
    return true;
  });

  const sortedAchievements = filteredAchievements.sort((a, b) => {
    if (sortBy === 'rarity') {
      const rarityOrder = { 'mythic': 4, 'rare': 3, 'uncommon': 2, 'common': 1 };
      return rarityOrder[b.rarity] - rarityOrder[a.rarity];
    }
    if (sortBy === 'points') return b.points - a.points;
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const categories = ['all', 'completed', 'incomplete', 'collection', 'deck', 'discovery', 'mastery'];

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={filter === category ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(category)}
              className="text-xs"
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Button>
          ))}
        </div>
        
        <select 
          className="px-3 py-1 border rounded-md text-sm bg-background"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
        >
          <option value="rarity">Sort by Rarity</option>
          <option value="points">Sort by Points</option>
          <option value="name">Sort by Name</option>
        </select>
      </div>

      {/* Achievement Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sortedAchievements.map(achievement => (
          <AchievementCard
            key={achievement.id}
            achievement={achievement}
            onClick={() => onAchievementClick(achievement)}
            showProgress={true}
          />
        ))}
      </div>

      {sortedAchievements.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No achievements found matching your filters.</p>
        </div>
      )}
    </div>
  );
};

// ALSO, fix the AchievementTab.jsx by adding the missing component definitions:

// File: frontend/src/components/AchievementTab.jsx
// ADD these component definitions right before the return statement in AchievementTab

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
            <Target className="w-8 h-8 text-blue-500" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-muted-foreground">Recent</p>
              <p className="text-2xl font-bold">{recentAchievements.length}</p>
              <p className="text-xs text-muted-foreground">this week</p>
            </div>
            <Calendar className="w-8 h-8 text-purple-500" />
          </div>
        </CardContent>
      </Card>
    </div>

    {/* Progress Overview */}
    <Card>
      <CardHeader>
        <CardTitle>Progress Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Overall Progress</span>
              <span>{completedAchievements.length}/{achievements.length}</span>
            </div>
            <Progress value={completionRate} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>

    {/* Recent Achievements */}
    {recentAchievements.length > 0 && (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
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
  </div>
);

const AllAchievementsView = () => (
  <AchievementGallery 
    achievements={achievements}
    onAchievementClick={setSelectedAchievement}
  />
);