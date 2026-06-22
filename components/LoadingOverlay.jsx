import { View, ActivityIndicator, Text, StyleSheet } from 'react-native';
import { colors, spacing } from '../constants/theme';

export default function LoadingOverlay({ message = 'Loading...' }) {
  return (
    <View style={styles.overlay}>
      <View style={styles.box}>
        <ActivityIndicator size="large" color={colors.text} />
        <Text style={styles.text}>{message}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  box: {
    backgroundColor: colors.card,
    borderRadius: 16,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    minWidth: 160,
  },
  text: { fontSize: 14, color: colors.text, marginTop: spacing.xs },
});
