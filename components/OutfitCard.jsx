import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, spacing, fonts } from '../constants/theme';

export default function OutfitCard({ number, name, occasion, season, description, pieces, liked, onToggleLike, confidence, dark }) {
  return (
    <View style={[styles.outfitCard, dark && styles.outfitCardDark]}>
      <View style={styles.outfitHeader}>
        {number != null && <Text style={styles.outfitNum}>{number}</Text>}
        <View style={styles.outfitHeaderText}>
          <Text style={[styles.outfitName, dark && styles.outfitNameDark]}>{name}</Text>
          <Text style={[styles.outfitMeta, dark && styles.outfitMetaDark]}>
            {occasion} · {season}
            {confidence != null ? `  ·  ${confidence}/10 MATCH` : ''}
          </Text>
        </View>
        <TouchableOpacity
          onPress={onToggleLike}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          style={styles.likeBtn}
        >
          <Ionicons
            name={liked ? 'heart' : 'heart-outline'}
            size={20}
            color={colors.like}
          />
        </TouchableOpacity>
      </View>
      <Text style={[styles.outfitNote, dark && styles.outfitNoteDark]}>{description}</Text>

      <View style={styles.piecesRow}>
        {(pieces || []).map((item) => (
          <View key={item.id} style={styles.pieceItem}>
            {item.image_url ? (
              <Image source={{ uri: item.image_url }} style={styles.pieceImage} />
            ) : (
              <View style={[styles.pieceImage, dark ? styles.piecePlaceholderDark : styles.piecePlaceholder]} />
            )}
            <Text style={[styles.pieceName, dark && styles.pieceNameDark]} numberOfLines={2}>{item.name}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outfitCard: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.border },
  outfitCardDark: { backgroundColor: colors.darkPanel, borderTopColor: 'rgba(244,241,235,0.16)' },
  outfitHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  outfitNum: { fontFamily: fonts.serif, fontSize: 15, color: colors.accent, paddingTop: 4 },
  outfitHeaderText: { flex: 1 },
  outfitName: { fontFamily: fonts.serifMedium, fontSize: 24, lineHeight: 28, color: colors.text },
  outfitNameDark: { color: '#F4F1EB' },
  outfitMeta: { fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginTop: 7 },
  outfitMetaDark: { color: colors.accent },
  outfitNote: { fontFamily: fonts.serifItalic, fontSize: 16.5, lineHeight: 25, color: colors.secondary, marginTop: 14, marginBottom: 20 },
  outfitNoteDark: { color: '#D9D4C8' },
  piecesRow: { flexDirection: 'row', gap: 9 },
  pieceItem: { flex: 1 },
  pieceImage: { aspectRatio: 3 / 4, backgroundColor: '#ECE8E0', resizeMode: 'cover' },
  piecePlaceholder: { backgroundColor: '#E5E0D6' },
  piecePlaceholderDark: { backgroundColor: '#211D18' },
  pieceName: { fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginTop: 7, textAlign: 'center', lineHeight: 13 },
  pieceNameDark: { color: '#B8B2A3' },
  likeBtn: { paddingTop: 4 },
});
