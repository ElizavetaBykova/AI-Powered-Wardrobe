import { View, Text, StyleSheet, Animated } from 'react-native';
import { useEffect, useRef } from 'react';
import { colors, fonts } from '../constants/theme';

export default function LoadingOverlay({ message = 'Loading…' }) {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Animated.View style={[styles.diamond, { opacity: pulse }]} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(244,241,235,0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  box: { alignItems: 'center', gap: 20 },
  diamond: {
    width: 28,
    height: 28,
    borderWidth: 1.5,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  text: {
    fontFamily: fonts.serif,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.secondary,
  },
});
