// Achievement Notification Toast Component
export const AchievementNotification = ({ achievement, onClose, autoClose = true }) => {
  const [isVisible, setIsVisible] = useState(true);
  const IconComponent = getAchievementIcon(achievement.icon);
  const config = getRarityConfig(achievement.rarity);

  // Auto-close after 5 seconds
  React.useEffect(() => {
    if (autoClose) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        setTimeout(onClose, 300); // Wait for animation to complete
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [autoClose, onClose]);

  if (!isVisible) return null;

  return (
    <div 
      className={`
        fixed top-4 right-4 z-50 transform transition-all duration-300
        ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
      `}
    >
      <Card className={`
        w-80 ${config.bgColor} ${config.borderColor} ${config.glowColor} shadow-xl
        border-l-4 ${config.badgeColor.includes('gradient') ? 'border-l-purple-500' : `border-l-${config.badgeColor.split('-')[1]}-500`}
      `}>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg ${config.badgeColor} text-white`}>
                <IconComponent className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">
                  🏆 Achievement Unlocked!
                </p>
                <h4 className={`font-bold ${config.textColor}`}>
                  {achievement.name}
                </h4>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { setIsVisible(false); setTimeout(onClose, 300); }}
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <p className={`text-sm ${config.textColor} mb-2`}>
            {achievement.description}
          </p>
          <div className="flex items-center justify-between">
            <Badge 
              variant="secondary" 
              className={`text-xs ${config.badgeColor} text-white border-0`}
            >
              {achievement.rarity}
            </Badge>
            <span className={`text-xs font-medium ${config.textColor}`}>
              +{achievement.points} pts
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};