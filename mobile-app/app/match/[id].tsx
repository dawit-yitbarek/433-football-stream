import React, { useState, useRef, useEffect } from 'react';
import { View, Text, BackHandler, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { VideoRef } from 'react-native-video';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useMatches } from '@/context/MatchesContext';

import VideoPlayer from '@/components/stream/VideoPlayer';
import { ChannelSelector } from '@/components/stream/ChannelSelector';
import { MatchListSection } from '@/components/dashboard/MatchListSection';

export default function LiveMatchStreamScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams();
  const { matches, scheduledMatchIds, setScheduledMatchIds, getLiveMatches, getUpcomingMatches } = useMatches();

  // Guard clause: match not found
  const match = matches.find(m => m.id === id);
  if (!match) {
    return (
      <View className='flex-1 bg-void justify-center items-center gap-8 p-4'>
        <Text className="text-muted text-lg text-center">Match not found. It may have ended.</Text>
        <TouchableOpacity
          className="bg-surface py-2.5 px-5 rounded border border-cyan"
          onPress={() => router.replace('/')}
        >
          <Text className="text-cyan font-bold text-sm">Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const sortedMatches = [...getLiveMatches('All'), ...getUpcomingMatches('All')].filter(m => m.id !== id);

  // Guard clause: no servers available
  if (!match.servers || match.servers.length === 0) {
    return (
      <View className='flex-1 bg-void justify-center items-center gap-8 p-4'>
        <Text className="text-muted text-lg text-center">No live streaming channels available for this game.</Text>
        <TouchableOpacity
          className="bg-surface py-2.5 px-5 rounded border border-cyan"
          onPress={() => router.replace('/')}
        >
          <Text className="text-cyan font-bold text-sm">Back to Home</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const servers = match.servers.map(server => ({
    ...server,
    name: server.name.replace('Server', 'Channel')
  }));

  const videoRef = useRef<VideoRef>(null);
  const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [activeServerIndex, setActiveServerIndex] = useState<number>(0);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [showControls, setShowControls] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isBuffering, setIsBuffering] = useState<boolean>(false);
  const [isDead, setIsDead] = useState<boolean>(false);
  const [deadReason, setDeadReason] = useState<string>('');

  const startControlsTimeout = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 4000);
  };

  const handleScreenTap = () => {
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    if (showControls) {
      setShowControls(false);
    } else {
      setShowControls(true);
      startControlsTimeout();
    }
  };

  const toggleFullscreenMode = async () => {
    if (showControls) startControlsTimeout();

    if (!isFullscreen) {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      setIsFullscreen(true);
    } else {
      await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      setIsFullscreen(false);
    }
  };

  const handleServerChange = (index: number) => {
    setActiveServerIndex(index);
    setIsLoading(true);
    setIsBuffering(false);
    setIsDead(false);
    setDeadReason('');
    setShowControls(true);
    startControlsTimeout();
  };

  const openMatch = (matchId: string) => {
    router.push({ pathname: '/match/[id]', params: { id: matchId } });
  };

  useEffect(() => {
    if (servers && servers.length > 0) {
      startControlsTimeout();
    }
    return () => {
      if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };
  }, [servers]);

  useEffect(() => {
    const backAction = () => {
      if (isFullscreen) {
        toggleFullscreenMode();
        return true;
      } else {
        router.replace('/');
        return true;
      }
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
    return () => backHandler.remove();
  }, [isFullscreen]);

  const activeServer = servers[activeServerIndex];

  return (
    <View className="flex-1 bg-black">
      <VideoPlayer
        videoRef={videoRef}
        activeServer={activeServer}
        isPaused={isPaused}
        setIsPaused={setIsPaused}
        isFullscreen={isFullscreen}
        toggleFullscreenMode={toggleFullscreenMode}
        showControls={showControls}
        setShowControls={setShowControls}
        isLoading={isLoading}
        setIsLoading={setIsLoading}
        isBuffering={isBuffering}
        setIsBuffering={setIsBuffering}
        isDead={isDead}
        setIsDead={setIsDead}
        deadReason={deadReason}
        setDeadReason={setDeadReason}
        handleScreenTap={handleScreenTap}
        startControlsTimeout={startControlsTimeout}
        onRetry={() => handleServerChange(activeServerIndex)}
      />

      {!isFullscreen && (
        <ChannelSelector
          servers={servers}
          activeServerIndex={activeServerIndex}
          onServerChange={handleServerChange}
        />
      )}

      <ScrollView contentContainerClassName="px-6">
        <MatchListSection
          matches={sortedMatches}
          notifiedIds={scheduledMatchIds}
          onMatchPress={openMatch}
          setScheduledMatchIds={setScheduledMatchIds}
        />
      </ScrollView>
    </View>
  );
}