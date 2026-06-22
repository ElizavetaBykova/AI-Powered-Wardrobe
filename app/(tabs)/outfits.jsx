import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateOutfits } from '../../lib/claude';
import LoadingOverlay from '../../components/LoadingOverlay';
import { colors, spacing, fonts } from '../../constants/theme';

function computeWardrobeKey(items) {
  return items.map((i) => `${i.id}:${i.updated_at}`).sort().join('|');
}

export default function OutfitsScreen() {
  const [outfits, setOutfits] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [upToDate, setUpToDate] = useState(false);

  useFocusEffect(useCallback(() => { loadSavedOutfits(); }, []));

  async function loadSavedOutfits() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from('outfit_collections')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (data) { setOutfits(data.outfits); setItemMap(data.item_map); }
  }

  async function handleGenerate(force = false) {
    setLoading(true);
    setUpToDate(false);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: items, error } = await supabase.from('clothing_items').select('*');
      if (error) throw error;
      if ((items || []).length < 2) {
        Alert.alert('Not enough pieces', 'Add at least 2 pieces to your wardrobe first');
        return;
      }

      const wardrobeKey = computeWardrobeKey(items);

      if (!force) {
        const { data: saved } = await supabase
          .from('outfit_collections')
          .select('*')
          .eq('user_id', user.id)
          .eq('wardrobe_key', wardrobeKey)
          .limit(1)
          .single();

        if (saved) {
          setOutfits(saved.outfits);
          setItemMap(saved.item_map);
          setUpToDate(true);
          return;
        }
      }

      const map = {};
      items.forEach((item) => { map[item.id] = item; });

      const result = await generateOutfits(items);
      const newOutfits = result.outfits || [];

      await supabase.from('outfit_collections').delete().eq('user_id', user.id);
      await supabase.from('outfit_collections').insert({
        user_id: user.id,
        outfits: newOutfits,
        item_map: map,
        wardrobe_key: wardrobeKey,
      });

      setOutfits(newOutfits);
      setItemMap(map);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay message="Styling your looks…" />}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>PIÈCE</Text>
          <Text style={styles.subtitle}>Styled For You</Text>
        </View>

        {/* Generate button */}
        <TouchableOpacity style={styles.generateBtn} onPress={() => handleGenerate(false)}>
          <View style={styles.btnDiamond} />
          <Text style={styles.generateBtnText}>GENERATE OUTFIT IDEAS</Text>
        </TouchableOpacity>

        {upToDate && (
          <View style={styles.upToDateRow}>
            <Text style={styles.upToDateText}>Your wardrobe hasn't changed — showing saved outfits</Text>
            <TouchableOpacity onPress={() => handleGenerate(true)}>
              <Text style={styles.regenerateLink}>Regenerate anyway</Text>
            </TouchableOpacity>
          </View>
        )}

        {outfits.length === 0 && !loading ? (
          <View style={styles.empty}>
            <View style={styles.emptyDiamond} />
            <Text style={styles.emptyTitle}>No Looks Yet</Text>
            <Text style={styles.emptyText}>
              Tap above for AI-styled looks composed entirely from your own wardrobe.
            </Text>
          </View>
        ) : (
          outfits.map((outfit, i) => (
            <View key={i} style={styles.outfitCard}>
              <View style={styles.outfitHeader}>
                <Text style={styles.outfitNum}>{String(i + 1).padStart(2, '0')}</Text>
                <View style={styles.outfitHeaderText}>
                  <Text style={styles.outfitName}>{outfit.name}</Text>
                  <Text style={styles.outfitMeta}>{outfit.occasion} · {outfit.season}</Text>
                </View>
              </View>
              <Text style={styles.outfitNote}>{outfit.description}</Text>

              <View style={styles.piecesRow}>
                {(outfit.item_ids || []).map((itemId) => {
                  const item = itemMap[itemId];
                  if (!item) return null;
                  return (
                    <View key={itemId} style={styles.pieceItem}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.pieceImage} />
                      ) : (
                        <View style={[styles.pieceImage, styles.piecePlaceholder]} />
                      )}
                      <Text style={styles.pieceName} numberOfLines={2}>{item.name}</Text>
                    </View>
                  );
                })}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 110, gap: spacing.md },
  header: { paddingTop: 60, paddingHorizontal: 22, alignItems: 'center', paddingBottom: spacing.lg },
  title: { fontFamily: fonts.serif, fontSize: 23, letterSpacing: 8, color: colors.text },
  subtitle: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.muted, marginTop: 8 },
  generateBtn: {
    marginHorizontal: 22,
    height: 58,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  btnDiamond: {
    width: 11,
    height: 11,
    borderWidth: 1,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  generateBtnText: { fontSize: 11, letterSpacing: 4, color: '#F4F1EB' },
  upToDateRow: {
    marginHorizontal: 22,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    gap: spacing.xs,
  },
  upToDateText: { fontSize: 12, color: colors.secondary, textAlign: 'center' },
  regenerateLink: { fontSize: 11, color: colors.muted, textDecorationLine: 'underline' },
  empty: { paddingTop: 80, paddingHorizontal: 40, alignItems: 'center', gap: spacing.md },
  emptyDiamond: { width: 26, height: 26, borderWidth: 1, borderColor: colors.accent, transform: [{ rotate: '45deg' }] },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 26, color: colors.text, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center', fontStyle: 'italic' },
  outfitCard: { paddingHorizontal: 22, paddingTop: 28, paddingBottom: 6, borderTopWidth: 1, borderTopColor: colors.border },
  outfitHeader: { flexDirection: 'row', gap: 14, alignItems: 'flex-start' },
  outfitNum: { fontFamily: fonts.serif, fontSize: 15, color: colors.accent, paddingTop: 4 },
  outfitHeaderText: { flex: 1 },
  outfitName: { fontFamily: fonts.serifMedium, fontSize: 24, lineHeight: 28, color: colors.text },
  outfitMeta: { fontSize: 9.5, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted, marginTop: 7 },
  outfitNote: { fontFamily: fonts.serifItalic, fontSize: 16.5, lineHeight: 25, color: colors.secondary, marginTop: 14, marginBottom: 20 },
  piecesRow: { flexDirection: 'row', gap: 9 },
  pieceItem: { flex: 1 },
  pieceImage: { aspectRatio: 3 / 4, backgroundColor: '#ECE8E0', resizeMode: 'cover' },
  piecePlaceholder: { backgroundColor: '#E5E0D6' },
  pieceName: { fontSize: 8.5, letterSpacing: 1, textTransform: 'uppercase', color: colors.muted, marginTop: 7, textAlign: 'center', lineHeight: 13 },
});
