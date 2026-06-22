import { TouchableOpacity, Image, Text, View, StyleSheet } from 'react-native';
import { colors, fonts } from '../constants/theme';

export default function ClothingCard({ item, index, onPress }) {
  const num = String((index ?? 0) + 1).padStart(2, '0');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.imageWrap}>
        {item.image_url ? (
          <Image source={{ uri: item.image_url }} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <Text style={styles.num}>{num}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={2}>{item.name || 'Unnamed'}</Text>
        <Text style={styles.meta}>{[item.type, item.color].filter(Boolean).join(' · ')}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  imageWrap: {
    position: 'relative',
    aspectRatio: 3 / 4,
    backgroundColor: '#ECE8E0',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholder: {
    backgroundColor: '#E5E0D6',
  },
  num: {
    position: 'absolute',
    top: 9,
    left: 9,
    fontFamily: fonts.serif,
    fontSize: 12,
    color: colors.accent,
    opacity: 0.9,
  },
  info: { paddingTop: 11 },
  name: {
    fontFamily: fonts.serifMedium,
    fontSize: 17,
    lineHeight: 20,
    color: colors.text,
    letterSpacing: 0.2,
  },
  meta: {
    fontSize: 9,
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: colors.muted,
    marginTop: 6,
  },
});
