import { Text, View } from 'react-native';

import { MatchCard } from '@/components/dashboard/MatchCard';
import type { matchData } from '@/context/MatchesContext';
import { toggleGameNotification } from "@/utils/toggleNotification";

interface MatchListSectionProps {
  title?: string;
  matches: matchData[];
  notifiedIds: string[];
  setScheduledMatchIds: React.Dispatch<React.SetStateAction<string[]>>
  onMatchPress: (matchId: string) => void;
}

export function MatchListSection({
  title,
  matches,
  notifiedIds,
  onMatchPress,
  setScheduledMatchIds,
}: MatchListSectionProps) {
  if (matches.length === 0) return null;

  return (
    <View className="mb-6">
      {title && <Text className="mb-3 text-lg font-bold text-white">{title}</Text>}
      {matches.map((match) => (
        <MatchCard
          key={match.id}
          match={match}
          isNotified={notifiedIds.includes(match.id)}
          onPress={() => onMatchPress(match.id)}
          onToggleNotify={() => toggleGameNotification(match, !notifiedIds.includes(match.id), setScheduledMatchIds)}
        />
      ))}
    </View>
  );
}
