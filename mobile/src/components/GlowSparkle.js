import React, { useEffect, useMemo } from 'react';
import { Animated, Easing, Platform } from 'react-native';
import { Sparkles } from 'lucide-react-native';
import { colors } from '../lib/theme';

export default function GlowSparkle({ size = 16, color = colors.gold, strokeWidth = 1.5 }) {
  const glow = useMemo(() => new Animated.Value(1), []);

  useEffect(() => {
    const useNative = Platform.OS !== 'web';
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: 0,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(glow, {
          toValue: 1,
          duration: 1100,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glow]);

  const opacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 1] });
  const scale = glow.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.12] });

  return (
    <Animated.View style={{ opacity, transform: [{ scale }] }}>
      <Sparkles size={size} strokeWidth={strokeWidth} color={color} />
    </Animated.View>
  );
}
