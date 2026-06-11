import { useRouter } from 'expo-router';
import { useMemo, useState, useEffect } from 'react';
import { ScrollView, BackHandler, StatusBar, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DashboardHeader } from '@/components/dashboard/DashboardHeader';
import { LeagueFilterRow } from '@/components/dashboard/LeagueFilterRow';
import { LiveHeroCarousel } from '@/components/dashboard/LiveHeroCarousel';
import { MatchListSection } from '@/components/dashboard/MatchListSection';
import { EmptyMatchesState, LoadingState, ErrorState } from '@/components/dashboard/StatusStates';
import { useMatches } from '@/context/MatchesContext';

export default function DashboardScreen() {
  const router = useRouter();
  const { matches, leagues, scheduledMatchIds, setScheduledMatchIds, isLoading, error, filterMatchesByLeague, getLiveMatches, getUpcomingMatches, refreshData } = useMatches();
  const [selectedLeague, setSelectedLeague] = useState<string>('All');

  useEffect(() => {
    const backAction = () => {
      BackHandler.exitApp();
      return true;
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, []);

  const filteredMatches = useMemo(
    () => filterMatchesByLeague(selectedLeague),
    [selectedLeague, matches],
  );
  const liveMatches = useMemo(() => getLiveMatches(selectedLeague), [filteredMatches]);
  const upcomingMatches = useMemo(() => getUpcomingMatches(selectedLeague), [filteredMatches]);

  const openMatch = (matchId: string) => {
    router.push({ pathname: '/match/[id]', params: { id: matchId } });
  };

  if (isLoading) {
    return (
      <SafeAreaView className="flex-1 bg-void" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <LoadingState />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView className="flex-1 bg-void" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <ErrorState message={error} onRetry={refreshData} />
      </SafeAreaView>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <SafeAreaView className="flex-1 bg-void" edges={['top']}>
        <StatusBar barStyle="light-content" />
        <DashboardHeader onRefresh={refreshData} />
        <EmptyMatchesState onRefresh={refreshData} />
      </SafeAreaView>
    );
  }

  return (
    <View className="flex-1 bg-void">
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <ScrollView
          className="flex-1"
          contentContainerClassName="px-4 pb-10"
          stickyHeaderIndices={[0]}
        >
          <View className="bg-void pt-2">
            <DashboardHeader onRefresh={refreshData} />
          </View>
          <LiveHeroCarousel matches={liveMatches} onWatchMatch={openMatch} />
          <LeagueFilterRow
            leagues={leagues}
            selectedLeague={selectedLeague}
            onSelect={setSelectedLeague}
          />
          <MatchListSection
            title="Live Now"
            matches={liveMatches}
            notifiedIds={scheduledMatchIds}
            setScheduledMatchIds={setScheduledMatchIds}
            onMatchPress={openMatch}
          />
          <MatchListSection
            title="Upcoming"
            matches={upcomingMatches}
            notifiedIds={scheduledMatchIds}
            setScheduledMatchIds={setScheduledMatchIds}
            onMatchPress={openMatch}
          />
          <View className="h-4" />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
