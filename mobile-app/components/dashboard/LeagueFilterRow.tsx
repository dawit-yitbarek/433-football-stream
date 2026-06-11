import { Pressable, ScrollView, Text } from 'react-native';

interface LeagueFilterRowProps {
  leagues: string[];
  selectedLeague: string;
  onSelect: (league: string) => void;
}

export function LeagueFilterRow({ leagues, selectedLeague, onSelect }: LeagueFilterRowProps) {

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mb-6"
      contentContainerStyle={{ gap: 10, paddingRight: 16 }}>
      {leagues.map((league: string) => {
        const active = league === selectedLeague;
        return (
          <Pressable
            key={league}
            onPress={() => onSelect(league)}
            className={`rounded-full border px-5 py-2.5 ${active
              ? 'border-neon/50 bg-neon/15'
              : 'border-border bg-surface active:bg-surface-elevated'
              }`}>
            <Text
              className={`text-sm font-semibold ${active ? 'text-neon' : 'text-muted'}`}>
              {league}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
