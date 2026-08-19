import { View, Text, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';
import Spinner from './Spinner';

export default function LoadingOverlay({ message = 'Loading…' }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <Spinner size={30} thickness={2} />
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
  text: {
    fontFamily: fonts.serif,
    fontSize: 14,
    letterSpacing: 3,
    textTransform: 'uppercase',
    color: colors.secondary,
  },
});
