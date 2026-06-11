import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, TouchableWithoutFeedback, StyleSheet } from 'react-native';
import Video, { ResizeMode } from 'react-native-video';
import { Ionicons } from '@expo/vector-icons';
import { parseServerStream } from '@/utils/streamParser';

interface VideoPlayerProps {
  videoRef: any;
  activeServer: any;
  isPaused: boolean;
  setIsPaused: (val: boolean) => void;
  isFullscreen: boolean;
  toggleFullscreenMode: () => void;
  showControls: boolean;
  setShowControls: (val: boolean) => void;
  isLoading: boolean;
  setIsLoading: (val: boolean) => void;
  isBuffering: boolean;
  setIsBuffering: (val: boolean) => void;
  isDead: boolean;
  setIsDead: (val: boolean) => void;
  deadReason: string;
  setDeadReason: (val: string) => void;
  handleScreenTap: () => void;
  startControlsTimeout: () => void;
  onRetry: () => void;
}

export default function VideoPlayer({
  videoRef,
  activeServer,
  isPaused,
  setIsPaused,
  isFullscreen,
  toggleFullscreenMode,
  showControls,
  setShowControls,
  isLoading,
  setIsLoading,
  isBuffering,
  setIsBuffering,
  isDead,
  setIsDead,
  deadReason,
  setDeadReason,
  handleScreenTap,
  startControlsTimeout,
  onRetry,
}: VideoPlayerProps) {

  const isSpinnerVisible = isLoading || isBuffering;

  const handlePlaybackError = (error: any) => {
    const errorCode = error?.error?.errorCode;
    const errorString = error?.error?.errorString || '';

    if (errorCode === 21002 || errorString.includes('BEHIND_LIVE_WINDOW')) {
      setIsBuffering(true);
      videoRef.current?.seek(0);
      return;
    }
    if (errorCode === 22004 || errorString.includes('BAD_HTTP_STATUS')) {
      setIsDead(true);
      setIsLoading(false);
      setIsBuffering(false);
      setDeadReason('Failed to play this video. Try alternative channels below.');
      return;
    }
    if (errorCode === 26004 || errorString.includes('DRM')) {
      setIsDead(true);
      setIsLoading(false);
      setIsBuffering(false);
      setDeadReason('Failed to play this video. Try alternative channels below.');
      return;
    }
    setIsBuffering(true);
    videoRef.current?.seek(0);
  };

  return (
    <View style={isFullscreen ? styles.fullscreenContainer : styles.portraitContainer}>

      <Video
        ref={videoRef}
        source={parseServerStream(activeServer)}
        style={StyleSheet.absoluteFillObject}
        resizeMode={ResizeMode.CONTAIN}
        controls={false}
        paused={isPaused}
        automaticallyWaitsToMinimizeStalling={true}
        preferredForwardBufferDuration={15}
        bufferConfig={{
          minBufferMs: 5000,
          maxBufferMs: 30000,
          bufferForPlaybackMs: 2500,
          bufferForPlaybackAfterRebufferMs: 5000,
        }}
        onLoadStart={() => {
          setIsLoading(true);
          setShowControls(true);
        }}
        onLoad={() => {
          setIsLoading(false);
          setIsBuffering(false);
          startControlsTimeout();
        }}
        onBuffer={(e: any) => {
          setIsBuffering(e.isBuffering);
          if (e.isBuffering) setShowControls(true);
        }}
        onError={handlePlaybackError}
      />

      <View
        pointerEvents="box-none"
        className="absolute inset-0 justify-center items-center"
        style={{ backgroundColor: (showControls && !isSpinnerVisible) ? 'rgba(0, 0, 0, 0.45)' : 'transparent' }}
      >
        {/* Permanent full-frame catch surface container */}
        <TouchableWithoutFeedback onPress={handleScreenTap}>
          <View style={StyleSheet.absoluteFillObject} />
        </TouchableWithoutFeedback>

        {/* Central Action Target (Fades in/out or shows buffer state) */}
        {(showControls || isSpinnerVisible) && (
          <TouchableOpacity
            className="w-[65px] h-[65px] rounded-full bg-black/60 justify-center items-center border border-neon/30"
            onPress={() => {
              setIsPaused(!isPaused);
              startControlsTimeout();
            }}
            disabled={isSpinnerVisible}
          >
            {isSpinnerVisible ? (
              <ActivityIndicator size="large" color="#00ff88" />
            ) : (
              <Ionicons name={isPaused ? 'play' : 'pause'} size={38} color="#00ff88" />
            )}
          </TouchableOpacity>
        )}

        {/* Bottom Metadata & Screen Adjust Controls Belt */}
        {showControls && (
          <View className="absolute bottom-2.5 left-4 right-4 flex-row justify-between items-center">
            <Text className="text-red-500 font-bold text-[12px] tracking-wider bg-black/60 px-2 py-1 rounded">
              ● LIVE
            </Text>
            <TouchableOpacity className="bg-black/60 p-1.5 rounded" onPress={toggleFullscreenMode}>
              <Ionicons name={isFullscreen ? 'contract' : 'expand'} size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {isDead && (
        <View className="absolute inset-0 bg-[#0B0C10] justify-center items-center p-5">
          <Text className="text-white text-[13px] mb-4 text-center leading-5">{deadReason}</Text>
          {/* <TouchableOpacity
            className="bg-[#1f2833] py-2.5 px-5 rounded border border-[#00ff88]"
            onPress={onRetry}
          >
            <Text className="text-[#00ff88] font-bold text-[13px]">Refresh</Text>
          </TouchableOpacity> */}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  portraitContainer: {
    width: '100%',
    height: 230,
    backgroundColor: '#000',
    position: 'relative',
  },
  fullscreenContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
    position: 'relative',
  }
});