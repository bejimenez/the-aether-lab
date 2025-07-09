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