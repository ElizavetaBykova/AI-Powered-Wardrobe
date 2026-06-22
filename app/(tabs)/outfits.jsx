import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert } from 'react-native';
import { supabase } from '../../lib/supabase';
import { generateOutfits } from '../../lib/claude';
import LoadingOverlay from '../../components/LoadingOverlay';
import { colors, spacing, radius } from '../../constants/theme';

export default function OutfitsScreen() {
  const [outfits, setOutfits] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(false);

  async function handleGenerate() {
    setLoading(true);
    try {
      const { data, error } = await supabase.from('clothing_items').select('*');
      if (error) throw error;
      if ((data || []).length < 2) {
        Alert.alert('Not enough items', 'Add at least 2 clothing items first');
        return;
      }

      const map = {};
      data.forEach((item) => { map[item.id] = item; });
      setItemMap(map);

      const result = await generateOutfits(data);
      setOutfits(result.outfits || []);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay message="Generating outfits..." />}

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate}>
          <Text style={styles.generateButtonText}>Generate Outfit Ideas</Text>
        </TouchableOpacity>

        {outfits.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✨</Text>
            <Text style={styles.emptyTitle}>No outfits yet</Text>
            <Text style={styles.emptyText}>
              Tap the button above to get AI-powered outfit suggestions from your wardrobe
            </Text>
          </View>
        ) : (
          outfits.map((outfit, i) => (
            <View key={i} style={styles.outfitCard}>
              <Text style={styles.outfitName}>{outfit.name}</Text>
              <View style={styles.outfitMeta}>
                <Text style={styles.outfitMetaText}>{outfit.occasion}</Text>
                <Text style={styles.dot}>·</Text>
                <Text style={styles.outfitMetaText}>{outfit.season}</Text>
              </View>
              <Text style={styles.outfitDescription}>{outfit.description}</Text>

              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.itemsRow}>
                {(outfit.item_ids || []).map((itemId) => {
                  const item = itemMap[itemId];
                  if (!item) return null;
                  return (
                    <View key={itemId} style={styles.outfitItem}>
                      {item.image_url ? (
                        <Image source={{ uri: item.image_url }} style={styles.outfitItemImage} />
                      ) : (
                        <View style={[styles.outfitItemImage, styles.imagePlaceholder]}>
                          <Text>👕</Text>
                        </View>
                      )}
                      <Text style={styles.outfitItemName} numberOfLines={2}>{item.name}</Text>
                    </View>
                  );
                })}
              </ScrollView>
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  generateButton: {
    backgroundColor: colors.text,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  generateButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2, gap: spacing.sm },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.secondary, textAlign: 'center', paddingHorizontal: spacing.xl },
  outfitCard: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 4,
    elevation: 2,
  },
  outfitName: { fontSize: 16, fontWeight: '700', color: colors.text },
  outfitMeta: { flexDirection: 'row', gap: spacing.xs, marginTop: 4, marginBottom: spacing.sm },
  outfitMetaText: { fontSize: 12, color: colors.secondary, textTransform: 'capitalize' },
  dot: { fontSize: 12, color: colors.muted },
  outfitDescription: { fontSize: 13, color: colors.secondary, lineHeight: 18, marginBottom: spacing.md },
  itemsRow: { marginHorizontal: -spacing.xs },
  outfitItem: { width: 90, marginHorizontal: spacing.xs, alignItems: 'center' },
  outfitItemImage: { width: 90, height: 120, borderRadius: radius.sm, resizeMode: 'cover' },
  imagePlaceholder: {
    backgroundColor: colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outfitItemName: { fontSize: 10, color: colors.secondary, marginTop: 4, textAlign: 'center' },
});
