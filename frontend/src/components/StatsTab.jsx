import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';

const StatsTab = ({ stats, decks, loading }) => {
  const [expandedSections, setExpandedSections] = useState({});
  
  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Calculate deckCount from decks array
  const deckCount = decks?.length || 0;

  console.log('StatsTab received stats:', stats);

  const processedStats = stats || {};

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {[...Array(4)].map((_, j) => (
                  <div key={j} className="h-4 bg-muted rounded"></div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Row 1: Core Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <CollectionOverviewCard stats={stats} deckCount={deckCount} />
        <ColorDistributionCard colorStats={processedStats.color_distribution} />
        <RarityDistributionCard rarityStats={processedStats.rarity_distribution} />
      </div>

      {/* Row 2: Type Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <CardTypesCard typeStats={processedStats.type_distribution} />
        <CreatureAnalysisCard creatureStats={processedStats.creature_analysis} />
      </div>

      {/* Row 3: Advanced Analysis */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <TribalTypesCard 
          tribalStats={processedStats.tribal_analysis} 
          expanded={expandedSections.tribal}
          onToggle={() => toggleSection('tribal')}
        />
        <FormatLegalityCard formatStats={processedStats.format_legality} />
        <SetAnalysisCard setStats={processedStats.set_distribution} />
      </div>

      {/* Row 4: Unique Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <MultiColorAnalysisCard colorStats={processedStats.color_distribution} />
        <KeywordsCard 
          keywordStats={processedStats.keyword_analysis}
          expanded={expandedSections.keywords}
          onToggle={() => toggleSection('keywords')}
        />
      </div>
    </div>
  );
};

// Function to process current backend data into enhanced format


const CollectionOverviewCard = ({ stats, deckCount }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📊 Collection Overview
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Cards:</span>
            <span className="font-bold text-lg">{stats?.total_cards?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Unique Cards:</span>
            <span className="font-semibold">{stats?.unique_cards?.toLocaleString() || 0}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Total Decks:</span>
            <span className="font-semibold">{deckCount}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">Average CMC:</span>
            <span className="font-semibold">{stats?.average_cmc || 'N/A'}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ColorDistributionCard = ({ colorStats }) => {
  if (!colorStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎨 Color Distribution
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No color data available</div>
        </CardContent>
      </Card>
    );
  }

  const colorEmojis = {
    'W': '⚪', 'U': '🔵', 'B': '⚫', 'R': '🔴', 'G': '🟢'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎨 Color Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Mono Colors */}
          {Object.keys(colorStats.mono_color || {}).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Mono Color</h4>
              <div className="grid grid-cols-5 gap-1">
                {Object.entries(colorStats.mono_color).map(([color, data]) => (
                  <div key={color} className="text-center">
                    <div className="text-lg">{colorEmojis[color]}</div>
                    <div className="text-xs font-medium">{data.count}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Multicolor Summary */}
          <div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Multicolor:</span>
              <span className="font-semibold">{colorStats.total_multicolor || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Colorless:</span>
              <span className="font-semibold">{colorStats.colorless || 0}</span>
            </div>
          </div>

          {/* Top Guilds */}
          {Object.keys(colorStats.guilds || {}).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Top Guilds</h4>
              <div className="space-y-1">
                {Object.entries(colorStats.guilds)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .slice(0, 3)
                  .map(([guild, data]) => (
                    <div key={guild} className="flex justify-between items-center">
                      <span className="text-xs">{guild}:</span>
                      <span className="text-xs font-medium">{data.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const RarityDistributionCard = ({ rarityStats }) => {
  console.log('RarityDistributionCard received:', rarityStats);

  const rarityEmojis = {
    'common': '⚪',
    'uncommon': '🔘', 
    'rare': '🟡',
    'mythic': '🟠'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💎 Rarity Distribution
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rarityStats && Array.isArray(rarityStats) && rarityStats.length > 0 ? (
            rarityStats.map(({ rarity, count, percentage }) => (
              <div key={rarity} className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <span>{rarityEmojis[rarity] || '⚪'}</span>
                  <span className="text-sm capitalize">{rarity}:</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{count}</span>
                  <Badge variant="outline" className="text-xs">
                    {percentage}%
                  </Badge>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-muted-foreground">No rarity data available</div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const CardTypesCard = ({ typeStats }) => {
  if (!typeStats?.categories) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🃏 Card Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No type data available</div>
        </CardContent>
      </Card>
    );
  }

  const typeEmojis = {
    'creatures': '🦾', 'instants': '⚡', 'sorceries': '📜', 'artifacts': '⚙️',
    'enchantments': '✨', 'planeswalkers': '👑', 'lands': '🏔️', 'other': '❓'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🃏 Card Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(typeStats.categories).map(([type, data]) => (
            <div key={type} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{typeEmojis[type]}</span>
                <span className="text-sm capitalize">{type}:</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.count}</span>
                <Badge variant="outline" className="text-xs">
                  {data.percentage}%
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const CreatureAnalysisCard = ({ creatureStats }) => {
  console.log('CreatureAnalysisCard received:', creatureStats);
  
  if (!creatureStats || Object.keys(creatureStats).length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🦾 Creature Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Creature analysis not available in current backend
          </div>
        </CardContent>
      </Card>
    );
  }

  const rangeLabels = {
    'utility': '🔧 Utility (0-1/0-1)',
    'efficient': '⚖️ Efficient (2-3/2-3)', 
    'threats': '💪 Threats (4+/4+)',
    'high_power': '⚔️ High Power (5+)',
    'high_toughness': '🛡️ High Toughness (5+)',
    'variable': '🔀 Variable (*/X)'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🦾 Creature Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(creatureStats).map(([range, data]) => (
            <div key={range} className="flex justify-between items-center">
              <span className="text-sm">{rangeLabels[range] || range}:</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{data.count || data}</span>
                {data.percentage && (
                  <Badge variant="outline" className="text-xs">
                    {data.percentage}%
                  </Badge>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const TribalTypesCard = ({ tribalStats, expanded, onToggle }) => {
  console.log('TribalTypesCard received:', tribalStats);
  
  if (!tribalStats || !Array.isArray(tribalStats) || tribalStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🏛️ Tribal Types
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Tribal analysis not available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCount = expanded ? tribalStats.length : 5;
  const visibleTribes = tribalStats.slice(0, displayCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🏛️ Tribal Types
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleTribes.map(({ tribe, count }) => (
            <div key={tribe} className="flex justify-between items-center">
              <span className="text-sm">{tribe}:</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
          {tribalStats.length > 5 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="w-full mt-2"
            >
              {expanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              {expanded ? 'Show Less' : `Show All ${tribalStats.length}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const FormatLegalityCard = ({ formatStats }) => {
  const formatEmojis = {
    'standard': '🆕', 'modern': '🔄', 'legacy': '📜', 'extended': '📏'
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          ⚖️ Format Legality
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {Object.entries(formatEmojis).map(([format, emoji]) => (
            <div key={format} className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <span>{emoji}</span>
                <span className="text-sm capitalize">{format}:</span>
              </div>
              <span className="font-semibold">{formatStats?.[format] || 0}</span>
            </div>
          ))}
          <div className="text-xs text-muted-foreground mt-2">
            * Format legality requires Scryfall integration
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const SetAnalysisCard = ({ setStats }) => {
  console.log('SetAnalysisCard received:', setStats);
  
  if (!setStats || !Array.isArray(setStats) || setStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📦 Set Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Set analysis not available
          </div>
        </CardContent>
      </Card>
    );
  }

  const topSets = setStats.slice(0, 5);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          📦 Set Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {topSets.map(({ set_name, set_code, total_cards, unique_cards }) => (
            <div key={set_code} className="space-y-1">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium truncate">{set_name}</span>
                <Badge variant="outline" className="text-xs">{set_code}</Badge>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{unique_cards} unique</span>
                <span>{total_cards} total</span>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const MultiColorAnalysisCard = ({ colorStats }) => {
  if (!colorStats) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🌈 Multi-Color Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">No color data available</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🌈 Multi-Color Analysis
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Guilds */}
          {colorStats.guilds && Object.keys(colorStats.guilds).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Guilds (2-Color)</h4>
              <div className="space-y-1">
                {Object.entries(colorStats.guilds)
                  .sort(([,a], [,b]) => b.count - a.count)
                  .slice(0, 5)
                  .map(([guild, data]) => (
                    <div key={guild} className="flex justify-between items-center">
                      <span className="text-sm">{guild}:</span>
                      <span className="font-semibold">{data.count}</span>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Shards/Wedges */}
          {colorStats.shards_wedges && Object.keys(colorStats.shards_wedges).length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Shards/Wedges (3-Color)</h4>
              <div className="space-y-1">
                {Object.entries(colorStats.shards_wedges).map(([name, data]) => (
                  <div key={name} className="flex justify-between items-center">
                    <span className="text-sm">{name}:</span>
                    <span className="font-semibold">{data.count}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Quads and Reapers */}
          {colorStats.quads && colorStats.quads.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">⚔️ Quads (4-Color):</span>
              <span className="font-semibold">{colorStats.quads.reduce((sum, quad) => sum + quad.count, 0)}</span>
            </div>
          )}
          
          {colorStats.reapers && colorStats.reapers.length > 0 && (
            <div className="flex justify-between items-center">
              <span className="text-sm">👑 Reapers (5-Color):</span>
              <span className="font-semibold">{colorStats.reapers.reduce((sum, reaper) => sum + reaper.count, 0)}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

const KeywordsCard = ({ keywordStats, expanded, onToggle }) => {
  console.log('KeywordsCard received:', keywordStats);
  
  if (!keywordStats || !Array.isArray(keywordStats) || keywordStats.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🎯 Keywords & Mechanics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-muted-foreground">
            Keyword analysis not available
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayCount = expanded ? keywordStats.length : 8;
  const visibleKeywords = keywordStats.slice(0, displayCount);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🎯 Keywords & Mechanics
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {visibleKeywords.map(({ keyword, count }) => (
            <div key={keyword} className="flex justify-between items-center">
              <span className="text-sm">{keyword}:</span>
              <span className="font-semibold">{count}</span>
            </div>
          ))}
          {keywordStats.length > 8 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onToggle}
              className="w-full mt-2"
            >
              {expanded ? <ChevronDown className="w-4 h-4 mr-1" /> : <ChevronRight className="w-4 h-4 mr-1" />}
              {expanded ? 'Show Less' : `Show All ${keywordStats.length}`}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default StatsTab;