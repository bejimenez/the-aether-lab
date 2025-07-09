import React, { useEffect, useState } from 'react';
import { Trophy, Star, Sparkles, Crown, Zap } from 'lucide-react';

const ConfettiPiece = ({ color, delay, duration }) => {
  const randomX = Math.random() * 100;
  const randomRotation = Math.random() * 360;
  
  return (
    <div
      className="absolute w-2 h-2 opacity-90"
      style={{
        left: `${randomX}%`,
        backgroundColor: color,
        animationDelay: `${delay}ms`,
        animationDuration: `${duration}ms`,
        transform: `rotate(${randomRotation}deg)`,
        animation: 'confettiFall linear forwards'
      }}
    />
  );
};

const Sparkle = ({ delay, left, top, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-3 h-3',
    lg: 'w-4 h-4'
  };
  
  return (
    <Sparkles
      className={`absolute ${sizeClasses[size]} text-yellow-400 opacity-80`}
      style={{
        left: `${left}%`,
        top: `${top}%`,
        animationDelay: `${delay}ms`,
        animation: 'sparkle 1.5s ease-in-out forwards'
      }}
    />
  );
};

const AchievementCelebration = ({ achievement, onComplete }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const confettiColors = [
    '#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8'
  ];
  
  const rarityConfig = {
    common: {
      bgColor: 'from-gray-500 to-gray-700',
      textColor: 'text-white',
      icon: Star,
      sparkleCount: 5,
      confettiCount: 20
    },
    uncommon: {
      bgColor: 'from-green-500 to-green-700',
      textColor: 'text-white',
      icon: Trophy,
      sparkleCount: 8,
      confettiCount: 35
    },
    rare: {
      bgColor: 'from-blue-500 to-blue-700',
      textColor: 'text-white',
      icon: Zap,
      sparkleCount: 12,
      confettiCount: 50
    },
    mythic: {
      bgColor: 'from-purple-500 via-pink-500 to-red-500',
      textColor: 'text-white',
      icon: Crown,
      sparkleCount: 20,
      confettiCount: 80
    }
  };
  
  const config = rarityConfig[achievement?.rarity || 'common'];
  const IconComponent = config.icon;
  
  useEffect(() => {
    if (achievement) {
      setIsVisible(true);
      setShowConfetti(true);
      
      // Auto-dismiss after 5 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [achievement]);
  
  const handleClose = () => {
    setIsVisible(false);
    setShowConfetti(false);
    setTimeout(() => {
      onComplete();
    }, 300);
  };
  
  if (!achievement || !isVisible) return null;
  
  return (
    <>
      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-100vh) rotateZ(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotateZ(720deg);
            opacity: 0;
          }
        }
        
        @keyframes sparkle {
          0%, 100% {
            transform: scale(0) rotate(0deg);
            opacity: 0;
          }
          50% {
            transform: scale(1) rotate(180deg);
            opacity: 1;
          }
        }
        
        @keyframes achievementSlide {
          0% {
            transform: translateY(-100px) scale(0.8);
            opacity: 0;
          }
          15% {
            transform: translateY(20px) scale(1.1);
            opacity: 1;
          }
          25% {
            transform: translateY(0) scale(1);
          }
          85% {
            transform: translateY(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translateY(-20px) scale(0.95);
            opacity: 0;
          }
        }
        
        @keyframes iconBounce {
          0%, 100% {
            transform: scale(1) rotate(0deg);
          }
          25% {
            transform: scale(1.2) rotate(-5deg);
          }
          75% {
            transform: scale(1.2) rotate(5deg);
          }
        }
        
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
      `}</style>
      
      {/* Overlay */}
      <div className="fixed inset-0 z-50 pointer-events-none overflow-hidden">
        {/* Confetti */}
        {showConfetti && Array.from({ length: config.confettiCount }).map((_, i) => (
          <ConfettiPiece
            key={`confetti-${i}`}
            color={confettiColors[i % confettiColors.length]}
            delay={i * 50}
            duration={3000 + Math.random() * 2000}
          />
        ))}
        
        {/* Sparkles */}
        {Array.from({ length: config.sparkleCount }).map((_, i) => (
          <Sparkle
            key={`sparkle-${i}`}
            delay={i * 200}
            left={Math.random() * 100}
            top={20 + Math.random() * 60}
            size={['sm', 'md', 'lg'][Math.floor(Math.random() * 3)]}
          />
        ))}
        
        {/* Achievement Card */}
        <div className="absolute inset-0 flex items-center justify-center p-4 pointer-events-auto">
          <div
            className={`
              relative max-w-md w-full mx-auto
              bg-gradient-to-br ${config.bgColor}
              rounded-2xl shadow-2xl border border-white/20
              overflow-hidden
            `}
            style={{
              animation: 'achievementSlide 5s ease-out forwards'
            }}
            onClick={handleClose}
          >
            {/* Shimmer effect */}
            <div 
              className="absolute inset-0 opacity-30"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
                backgroundSize: '200% 100%',
                animation: 'shimmer 2s ease-in-out infinite'
              }}
            />
            
            {/* Content */}
            <div className="relative p-6 text-center">
              {/* Achievement Unlocked Header */}
              <div className="mb-4">
                <h2 className={`text-sm font-bold ${config.textColor} opacity-90 tracking-widest uppercase`}>
                  Achievement Unlocked!
                </h2>
              </div>
              
              {/* Icon */}
              <div className="mb-4 flex justify-center">
                <div 
                  className="relative p-4 rounded-full bg-white/20 border border-white/30"
                  style={{
                    animation: 'iconBounce 2s ease-in-out infinite'
                  }}
                >
                  <IconComponent className={`w-8 h-8 ${config.textColor}`} />
                  
                  {/* Ring effect around icon */}
                  <div className="absolute inset-0 rounded-full border-2 border-white/40 animate-ping" />
                </div>
              </div>
              
              {/* Achievement Name */}
              <h3 className={`text-xl font-bold ${config.textColor} mb-2`}>
                {achievement.name}
              </h3>
              
              {/* Achievement Description */}
              <p className={`${config.textColor} opacity-90 text-sm mb-4 leading-relaxed`}>
                {achievement.description}
              </p>
              
              {/* Rarity Badge */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 border border-white/30">
                <div className={`w-2 h-2 rounded-full ${
                  achievement.rarity === 'mythic' ? 'bg-yellow-300' :
                  achievement.rarity === 'rare' ? 'bg-blue-300' :
                  achievement.rarity === 'uncommon' ? 'bg-green-300' :
                  'bg-gray-300'
                }`} />
                <span className={`text-xs font-medium ${config.textColor} opacity-90 capitalize`}>
                  {achievement.rarity}
                </span>
                <span className={`text-xs ${config.textColor} opacity-70`}>
                  +{achievement.points} pts
                </span>
              </div>
              
              {/* Close hint */}
              <div className="mt-4 pt-4 border-t border-white/20">
                <p className={`text-xs ${config.textColor} opacity-60`}>
                  Click anywhere to continue
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// Demo component to show the celebration in action
const AchievementDemo = () => {
  const [currentAchievement, setCurrentAchievement] = useState(null);
  
  const sampleAchievements = [
    {
      id: 1,
      name: "First Steps",
      description: "Add your first card to the collection",
      rarity: "common",
      points: 5
    },
    {
      id: 2,
      name: "Century Club",
      description: "Collect 100 unique cards",
      rarity: "uncommon",
      points: 25
    },
    {
      id: 3,
      name: "Rare Collector",
      description: "Collect 10 rare cards",
      rarity: "rare",
      points: 30
    },
    {
      id: 4,
      name: "Mythic Hunter",
      description: "Collect your first mythic rare card",
      rarity: "mythic",
      points: 50
    }
  ];
  
  const triggerAchievement = (achievement) => {
    setCurrentAchievement(achievement);
  };
  
  const handleCelebrationComplete = () => {
    setCurrentAchievement(null);
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-8 text-center">
          MTG Achievement System Demo
        </h1>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Try Different Achievement Rarities</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {sampleAchievements.map((achievement) => (
              <button
                key={achievement.id}
                onClick={() => triggerAchievement(achievement)}
                className={`
                  p-4 rounded-xl border-2 transition-all duration-200 hover:scale-105
                  ${achievement.rarity === 'common' ? 'bg-gray-600 border-gray-500 hover:bg-gray-500' : ''}
                  ${achievement.rarity === 'uncommon' ? 'bg-green-600 border-green-500 hover:bg-green-500' : ''}
                  ${achievement.rarity === 'rare' ? 'bg-blue-600 border-blue-500 hover:bg-blue-500' : ''}
                  ${achievement.rarity === 'mythic' ? 'bg-gradient-to-r from-purple-600 to-pink-600 border-purple-500 hover:from-purple-500 hover:to-pink-500' : ''}
                `}
              >
                <div className="text-white text-left">
                  <h3 className="font-bold text-sm mb-1">{achievement.name}</h3>
                  <p className="text-xs opacity-90 mb-2">{achievement.description}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-xs opacity-75 capitalize">{achievement.rarity}</span>
                    <span className="text-xs">+{achievement.points} pts</span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
        
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-white">
            <div>
              <h3 className="font-bold mb-2">🎊 Celebration Effects</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Animated confetti with physics</li>
                <li>• Sparkling effects</li>
                <li>• Rarity-based intensity</li>
                <li>• Smooth slide animations</li>
              </ul>
            </div>
            <div>
              <h3 className="font-bold mb-2">🏆 Achievement Display</h3>
              <ul className="text-sm space-y-1 opacity-90">
                <li>• Rarity-based styling</li>
                <li>• Icon animations</li>
                <li>• Shimmer effects</li>
                <li>• Point rewards</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      
      <AchievementCelebration 
        achievement={currentAchievement}
        onComplete={handleCelebrationComplete}
      />
    </div>
  );
};

export default AchievementDemo;
export { AchievementCelebration };