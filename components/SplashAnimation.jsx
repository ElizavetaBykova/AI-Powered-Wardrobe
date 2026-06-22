import { useEffect, useRef, useState } from 'react';
import {
  View, Animated, Easing, Image,
  TouchableWithoutFeedback, StyleSheet, Dimensions,
} from 'react-native';

const { width: SW, height: SH } = Dimensions.get('window');
const LETTERS = ['P', 'I', 'È', 'C', 'E'];

export default function SplashAnimation({ onDone }) {
  const letterAnims = useRef(LETTERS.map(() => new Animated.Value(0))).current;
  const subtitleAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.25)).current;

  // Exit animations (match design exactly)
  const heroOpacity = useRef(new Animated.Value(1)).current;
  const heroY = useRef(new Animated.Value(0)).current;
  const portalProg = useRef(new Animated.Value(0)).current; // 0→1 drives scale + opacity
  const curtainY = useRef(new Animated.Value(0)).current;

  const [ready, setReady] = useState(false);

  // Portal scale: 0.2 → 26 (fills screen as diamond expands)
  const portalScale = portalProg.interpolate({
    inputRange: [0, 1],
    outputRange: [0.2, 26],
  });
  // Portal opacity: 0.9 → 0.4 at 55% → 0
  const portalOpacity = portalProg.interpolate({
    inputRange: [0, 0.55, 1],
    outputRange: [0.9, 0.4, 0],
  });

  useEffect(() => {
    // Pulsing "tap to enter"
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.85, duration: 1300, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.25, duration: 1300, useNativeDriver: true }),
      ])
    ).start();

    // Intro: letters stagger in, then subtitle
    Animated.sequence([
      Animated.delay(200),
      Animated.stagger(110, LETTERS.map((_, i) =>
        Animated.timing(letterAnims[i], { toValue: 1, duration: 380, useNativeDriver: true })
      )),
      Animated.timing(subtitleAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
    ]).start(() => setReady(true));
  }, []);

  function handleTap() {
    if (!ready) return;
    Animated.parallel([
      // 1. Hero content drifts up 26px and fades (immediate, 450ms)
      Animated.timing(heroOpacity, { toValue: 0, duration: 450, useNativeDriver: true }),
      Animated.timing(heroY, { toValue: -26, duration: 450, useNativeDriver: true }),

      // 2. Portal diamond expands from center (100ms delay, 1050ms, ease in-out)
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(portalProg, {
          toValue: 1,
          duration: 1050,
          easing: Easing.bezier(0.6, 0, 0.2, 1),
          useNativeDriver: true,
        }),
      ]),

      // 3. Curtain rises upward off screen (350ms delay, 850ms, custom ease)
      Animated.sequence([
        Animated.delay(350),
        Animated.timing(curtainY, {
          toValue: -SH * 1.05,
          duration: 850,
          easing: Easing.bezier(0.76, 0, 0.24, 1),
          useNativeDriver: true,
        }),
      ]),
    ]).start(onDone);
  }

  return (
    <TouchableWithoutFeedback onPress={handleTap}>
      {/* Outer wrapper — always fills screen, lets the curtain slide above it */}
      <View style={styles.root}>
        <Animated.View style={[styles.splash, { transform: [{ translateY: curtainY }] }]}>

          {/* Background image — top 64% of screen */}
          <Image
            source={require('../assets/splash-cover.jpg')}
            style={styles.image}
            resizeMode="cover"
          />

          {/* Gradient simulation: light at top, dense at bottom → solid dark */}
          <View style={styles.gradTop} />
          <View style={styles.gradMid} />
          <View style={styles.gradBottom} />

          {/* Portal diamond — centered, expands on tap */}
          <Animated.View
            pointerEvents="none"
            style={[
              styles.portal,
              {
                opacity: portalOpacity,
                transform: [{ rotate: '45deg' }, { scale: portalScale }],
              },
            ]}
          />

          {/* Hero content: diamond + PIÈCE + subtitle */}
          <Animated.View
            style={[
              styles.hero,
              { opacity: heroOpacity, transform: [{ translateY: heroY }] },
            ]}
          >
            <View style={styles.heroDiamond} />

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
          </Animated.View>

          {/* Tap to enter — pulses */}
          <Animated.Text style={[styles.tapText, { opacity: pulseAnim }]}>
            TAP TO ENTER
          </Animated.Text>

        </Animated.View>
      </View>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  root: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW,
    height: SH,
    zIndex: 100,
    overflow: 'hidden',
    backgroundColor: '#F4F1EB', // app bg shows through as curtain rises
  },
  splash: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW,
    height: SH,
    backgroundColor: '#0C0A08',
  },

  // Image fills top 64% only (mirrors the design's layout)
  image: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SW,
    height: SH * 0.64,
  },

  // Gradient layers (simulate CSS linear-gradient to bottom)
  gradTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: SH * 0.30,
    backgroundColor: 'rgba(12,10,8,0.35)',
  },
  gradMid: {
    position: 'absolute',
    top: SH * 0.30,
    left: 0,
    right: 0,
    height: SH * 0.35,
    backgroundColor: 'rgba(12,10,8,0.60)',
  },
  gradBottom: {
    position: 'absolute',
    top: SH * 0.60,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#0C0A08',
  },

  // Portal diamond — centered on screen
  portal: {
    position: 'absolute',
    left: SW / 2 - 21,
    top: SH / 2 - 21,
    width: 42,
    height: 42,
    borderWidth: 1,
    borderColor: '#9C7F50',
  },

  // Hero content block
  hero: {
    position: 'absolute',
    bottom: 92,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  heroDiamond: {
    width: 30,
    height: 30,
    borderWidth: 1,
    borderColor: '#9C7F50',
    transform: [{ rotate: '45deg' }],
    marginBottom: 34,
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
    lineHeight: 66,
  },
  divider: {
    width: 42,
    height: 1,
    backgroundColor: 'rgba(247,244,238,0.45)',
    marginTop: 24,
    marginBottom: 18,
  },
  subtitle: {
    fontSize: 10.5,
    letterSpacing: 4.4,
    textTransform: 'uppercase',
    color: 'rgba(247,244,238,0.70)',
  },

  tapText: {
    position: 'absolute',
    bottom: 38,
    alignSelf: 'center',
    fontSize: 10,
    letterSpacing: 4,
    textTransform: 'uppercase',
    color: 'rgba(247,244,238,0.55)',
  },
});
