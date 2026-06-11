import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, Text, View } from 'react-native';

import { LiveBadge } from '@/components/ui/LiveBadge';
import { TeamBadge } from '@/components/ui/TeamBadge';
import type { matchData } from '@/context/MatchesContext';

interface LiveHeroCardProps {
  match: matchData;
  onWatch: () => void;
}

export function LiveHeroCard({ match, onWatch }: LiveHeroCardProps) {

  return (
    <View className="mr-4 w-[320px] overflow-hidden rounded-3xl border border-border">
      <LinearGradient
        colors={['#1C1F2A', '#0B0C10', '#14161D']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        className="p-8">
        <View className="mb-4 flex-row items-center justify-between">
          <LiveBadge />
          <Text className="text-xs font-medium text-muted">{match.league_name}</Text>
        </View>

        <View className="mb-5 flex-row items-center justify-between">
          <View className="flex-1 items-center gap-2">
            <TeamBadge teamLogo={match.home_team_logo} teamName={match.home_team_name} size="lg" />
            <Text className="text-center text-sm font-semibold text-white" numberOfLines={1}>
              {match.home_team_name}
            </Text>
          </View>

          {/* <View className="mx-3 items-center">
            <Text className="text-4xl font-black tracking-tighter text-white">
              {match.homeTeamScore}
              <Text className="text-muted"> - </Text>
              {match.awayTeamScore}
            </Text>
          </View> */}
          <Text className="text-xs font-semibold text-muted">VS</Text>

          <View className="flex-1 items-center gap-2">
            <TeamBadge teamLogo={match.away_team_logo} teamName={match.away_team_name} size="lg" />
            <Text className="text-center text-sm font-semibold text-white" numberOfLines={1}>
              {match.away_team_name}
            </Text>
          </View>
        </View>

        {/* {match.venue && (
          <Text className="mb-4 text-center text-xs text-muted">{match.venue}</Text>
        )} */}

        <Pressable
          onPress={onWatch}
          className="flex-row items-center justify-center gap-2 rounded-2xl bg-neon py-3.5 active:opacity-90">
          <Ionicons name="play" size={18} color="#0B0C10" />
          <Text className="text-base font-bold text-void">Watch Now</Text>
        </Pressable>
      </LinearGradient>
    </View>
  );
}
