import { useEffect, useRef } from 'react';
import { View, Animated, Image, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');
const LETTERS = ['P', 'I', 'È', 'C', 'E'];

export default function SplashAnimation({ onDone }) {
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 1300, useNativeDriver: true }),
      ])
    ).start();

    Animated.sequence([
      Animated.stagger(110, LETTERS.map((_, i) =>
        Animated.timing(letterAnims[i], { toValue: 1, duration: 350, useNativeDriver: true })
      )),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(slideAnim, { toValue: -height, duration: 650, useNativeDriver: true }),
    ]).start(onDone);
  }, []);

  return (
    <Animated.View style={[styles.container, { transform: [{ translateY: slideAnim }] }]}>
      <Image source={require('../assets/splash-cover.jpg')} style={styles.image} resizeMode="cover" />
      <View style={styles.overlayTop} />
      <View style={styles.overlayBottom} />

      <View style={styles.content}>
        <View style={styles.diamond} />

        <View style={styles.titleRow}>
          {LETTERS.map((letter, i) => (
            <Animated.Text
              key={i}
              style={[
                styles.letter,
                { opacity: letterAnims[i] },
                i < LETTERS.length - 1 && { marginRight: 10 },
              ]}
            >
              {letter}
            </Animated.Text>
          ))}
        </View>

        <Animated.View style={[styles.divider, { opacity: subtitleAnim }]} />
        <Animated.Text style={[styles.subtitle, { opacity: subtitleAnim }]}>
          THE WARDROBE, EDITED
        </Animated.Text>
      </View>

      <Animated.Text style={[styles.tapText, { opacity: pulseAnim }]}>
        TAP TO ENTER
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 100,
    backgroundColor: '#0C0A08',
  },
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '65%',
  },
  overlayTop: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: '65%',
    backgroundColor: 'rgba(12,10,8,0.4)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0, left: 0, right: 0,
    height: '50%',
    backgroundColor: '#0C0A08',
  },
  content: {
    position: 'absolute',
    bottom: 88,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  diamond: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: '#9C7F50',
    transform: [{ rotate: '45deg' }],
    marginBottom: 32,
    opacity: 0.85,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  letter: {
    color: '#F7F4EE',
    fontSize: 58,
    fontFamily: 'CormorantGaramond-Light',
    includeFontPadding: false,
  },
  divider: {
    width: 42,
    height: 1,
    backgroundColor: 'rgba(247,244,238,0.45)',
    marginTop: 22,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 10,
    letterSpacing: 5,
    color: 'rgba(247,244,238,0.65)',
  },
  tapText: {
    position: 'absolute',
    bottom: 36,
    alignSelf: 'center',
    fontSize: 9.5,
    letterSpacing: 5,
    color: 'rgba(247,244,238,0.5)',
  },
});
