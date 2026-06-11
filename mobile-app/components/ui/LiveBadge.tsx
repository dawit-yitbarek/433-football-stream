import { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

interface LiveBadgeProps {
  compact?: boolean;
}

export function LiveBadge({ compact }: LiveBadgeProps) {
  const opacity = useSharedValue(1);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.35, { duration: 700 }), withTiming(1, { duration: 700 })),
      -1,
      false,
    );
  }, [opacity]);

  const pulseStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <View className={`flex-row items-center ${compact ? 'gap-1.5' : 'gap-2'}`}>
      <View className="flex-row items-center rounded-full border border-neon/40 bg-neon/15 px-2.5 py-1">
        <Animated.View
          style={pulseStyle}
          className={`mr-1.5 rounded-full bg-neon ${compact ? 'h-1.5 w-1.5' : 'h-2 w-2'}`}
        />
        <Text className={`font-bold tracking-widest text-neon ${compact ? 'text-[10px]' : 'text-xs'}`}>
          LIVE
        </Text>
      </View>
    </View>
  );
}
