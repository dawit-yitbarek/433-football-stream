import { Ionicons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

import { LiveBadge } from '@/components/ui/LiveBadge';
import { TeamBadge } from '@/components/ui/TeamBadge';
import type { matchData } from '@/context/MatchesContext';

interface MatchCardProps {
  match: matchData;
  isNotified: boolean;
  onPress: () => void;
  onToggleNotify: () => void;
}

function formatScheduledTime(timestamp: string | number): string {
  if (!timestamp) return '';

  const date = new Date(Number(timestamp) * 1000);

  if (isNaN(date.getTime())) return '';

  return date.toLocaleString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
}

export function MatchCard({ match, isNotified, onPress, onToggleNotify }: MatchCardProps) {
  const isLive = match.match_status === 'live';

  return (
    <View className="mb-3 overflow-hidden rounded-2xl border border-border bg-surface">
      <Pressable onPress={onPress} className="p-4 active:opacity-95">
        <View className="mb-3 flex-row items-center justify-between">
          <Text className="text-xs font-medium uppercase tracking-wide text-muted">
            {match.league_name}
          </Text>
          {isLive ? (
            <LiveBadge compact />
          ) : (
            <Text className="text-xs font-medium text-cyan">{formatScheduledTime(match.match_time)}</Text>
          )}
        </View>

        <View className="flex-row items-center justify-between">
          <View className="flex-1 flex-row items-center gap-3">
            <TeamBadge teamName={match.home_team_name} teamLogo={match.home_team_logo} size="sm" />
            <Text className="flex-1 text-sm font-semibold text-white" numberOfLines={1}>
              {match.home_team_name.slice(0, 3)}
            </Text>
          </View>

          <Text className="text-xs font-semibold text-muted">VS</Text>

          <View className="flex-1 flex-row items-center justify-end gap-3">
            <Text className="flex-1 text-right text-sm font-semibold text-white" numberOfLines={1}>
              {match.away_team_name.slice(0, 3)}
            </Text>
            <TeamBadge teamName={match.away_team_name} teamLogo={match.away_team_logo} size="sm" />
          </View>
        </View>

      </Pressable>

      {!isLive && (
        <Pressable
          onPress={onToggleNotify}
          hitSlop={12}
          className="mx-4 mb-4 flex-row items-center justify-end gap-2 self-end rounded-full border border-border bg-surface-elevated px-3 py-2 active:border-cyan/40">
          <Ionicons
            name={isNotified ? 'notifications' : 'notifications-outline'}
            size={16}
            color={isNotified ? '#00E5FF' : '#8B90A0'}
          />
          <Text className={`text-xs font-semibold ${isNotified ? 'text-cyan' : 'text-muted'}`}>
            {isNotified ? 'Notified' : 'Notify Me'}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
