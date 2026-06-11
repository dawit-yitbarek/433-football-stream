import { ScrollView, View } from 'react-native';

import { LiveHeroCard } from '@/components/dashboard/LiveHeroCard';
import type { matchData } from '@/context/MatchesContext';

interface LiveHeroCarouselProps {
  matches: matchData[];
  onWatchMatch: (matchId: string) => void;
}

export function LiveHeroCarousel({ matches, onWatchMatch }: LiveHeroCarouselProps) {
  if (matches.length === 0) return null;

  return (
    <View className="mb-6">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        decelerationRate="fast"
        snapToInterval={336}
        contentContainerStyle={{ paddingRight: 16 }}>
        {matches.map((match) => (
          <LiveHeroCard key={match.id} match={match} onWatch={() => onWatchMatch(match.id)} />
        ))}
      </ScrollView>
    </View>
  );
}
