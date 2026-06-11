import { Text, View, Image } from 'react-native';

interface TeamBadgeProps {
  teamName: string;
  teamLogo: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeMap = {
  sm: { box: 'h-9 w-9', text: 'text-xs' },
  md: { box: 'h-12 w-12', text: 'text-sm' },
  lg: { box: 'h-16 w-16', text: 'text-base' },
};

export function TeamBadge({ teamName, teamLogo, size = 'md' }: TeamBadgeProps) {
  const sizes = sizeMap[size];

  return (
    <>
      {teamLogo ? (
        <Image
          source={{ uri: teamLogo }}
          className={`${sizes.box}`}
        />
      ) : (
        <View className={`${sizes.box} items-center justify-center rounded-2xl border border-white/10 overflow-hidden`}>
          <Text className={`${sizes.text} font-bold text-white`}>
            {teamName?.slice(0, 3).toUpperCase()}
          </Text>
        </View>
      )}
    </>
  );
};