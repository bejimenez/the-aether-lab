import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const StatsTab = ({ stats, deckCount }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    <Card>
      <CardHeader>
        <CardTitle>Collection Overview</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span>Total Cards:</span>
            <span className="font-semibold">{stats.total_cards || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Unique Cards:</span>
            <span className="font-semibold">{stats.unique_cards || 0}</span>
          </div>
          <div className="flex justify-between">
            <span>Total Decks:</span>
            <span className="font-semibold">{deckCount}</span>
          </div>
        </div>
      </CardContent>
    </Card>
    {/* You can add more stat cards here later */}
  </div>
);

export default StatsTab;