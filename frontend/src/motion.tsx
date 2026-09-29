import { PropsWithChildren, useEffect } from "react";
import { Pressable, PressableProps, StyleProp, ViewStyle } from "react-native";
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { colors } from "./theme";

const ease = Easing.bezier(0.22, 1, 0.36, 1);

export function FadeIn({
  children,
  delay = 0,
  from = "up",
  style,
}: PropsWithChildren<{ delay?: number; from?: "up" | "down"; style?: StyleProp<ViewStyle> }>) {
  const entering = from === "down" ? FadeInDown.delay(delay).duration(620).easing(ease) : FadeInUp.delay(delay).duration(620).easing(ease);
  return (
    <Animated.View entering={entering} style={style}>
      {children}
    </Animated.View>
  );
}

export function PressScale({
  children,
  style,
  ...rest
}: PropsWithChildren<PressableProps & { style?: StyleProp<ViewStyle> }>) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <Pressable
      onPressIn={(e) => {
        scale.value = withSpring(0.97, { damping: 18, stiffness: 320 });
        rest.onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 14, stiffness: 240 });
        rest.onPressOut?.(e);
      }}
      {...rest}
    >
      <Animated.View style={[style, anim]}>{children}</Animated.View>
    </Pressable>
  );
}

export function PulseDot({ color = colors.brand, size = 7 }: { color?: string; size?: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 900, easing: ease }), withTiming(0, { duration: 900, easing: ease })),
      -1,
      false
    );
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    opacity: interpolate(pulse.value, [0, 1], [0.45, 1]),
    transform: [{ scale: interpolate(pulse.value, [0, 1], [0.75, 1.15]) }],
  }));
  return (
    <Animated.View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        style,
      ]}
    />
  );
}

export function InkLoader({ label = "INKING" }: { label?: string }) {
  const spin = useSharedValue(0);
  useEffect(() => {
    spin.value = withDelay(80, withRepeat(withTiming(1, { duration: 1400, easing: Easing.linear }), -1, false));
  }, [spin]);
  const ring = useAnimatedStyle(() => ({
    transform: [{ rotate: `${spin.value * 360}deg` }],
  }));
  return (
    <Animated.View style={{ alignItems: "center", justifyContent: "center", gap: 18 }}>
      <Animated.View
        style={[
          {
            width: 72,
            height: 72,
            borderRadius: 36,
            borderWidth: 2,
            borderColor: "rgba(229,28,36,0.18)",
            borderTopColor: colors.brand,
            borderRightColor: colors.gold,
          },
          ring,
        ]}
      />
      <Animated.Text
        entering={FadeInUp.delay(160).duration(500)}
        style={{
          color: colors.onSurface,
          letterSpacing: 6,
          fontSize: 12,
          fontWeight: "800",
        }}
      >
        {label}
      </Animated.Text>
    </Animated.View>
  );
}
