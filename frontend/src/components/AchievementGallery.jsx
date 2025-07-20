import React from 'react';
import { AchievementCard } from './AchievementCard';

const AchievementGallery = ({ achievements, onAchievementClick }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {achievements.map(achievement => (
        <AchievementCard 
          key={achievement.id} 
          achievement={achievement} 
          onClick={() => onAchievementClick(achievement)} 
        />
      ))}
    </div>
  );
};

export { AchievementGallery };