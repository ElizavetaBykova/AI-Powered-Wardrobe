import { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Alert, ScrollView } from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ClothingCard from '../../components/ClothingCard';
import { colors, spacing, fonts } from '../../constants/theme';

const FILTERS = ['ALL', 'TOPS', 'BOTTOMS', 'OUTERWEAR', 'SHOES'];

function matchesFilter(item, filter) {
  if (filter === 'ALL') return true;
  if (filter === 'TOPS') return ['top', 'dress', 'jumpsuit'].includes(item.type);
  if (filter === 'BOTTOMS') return item.type === 'bottom';
  if (filter === 'OUTERWEAR') return item.type === 'outerwear';
  if (filter === 'SHOES') return item.type === 'shoes';
  return true;
}

export default function WardrobeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('ALL');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: true });
    if (error) Alert.alert('Error', error.message);
    else setItems(data || []);
    setLoading(false);
  }, []);

  useFocusEffect(useCallback(() => { fetchItems(); }, [fetchItems]));

  const filtered = items.filter((item) => matchesFilter(item, filter));
  const count = String(items.length).padStart(2, '0');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>PIÈCE</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-item')}>
            <View style={styles.addIcon}>
              <View style={styles.addH} />
              <View style={styles.addV} />
            </View>
          </TouchableOpacity>
        </View>

        <View style={styles.subRow}>
          <Text style={styles.subLabel}>The Wardrobe</Text>
          <Text style={styles.pieceCount}>{count} Pieces</Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((f) => (
            <TouchableOpacity key={f} onPress={() => setFilter(f)} style={styles.filterItem}>
              <Text style={[styles.filterText, { color: filter === f ? colors.text : '#B0A99D' }]}>
                {f}
              </Text>
              <View style={[styles.filterLine, { opacity: filter === f ? 1 : 0 }]} />
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid */}
      {filtered.length === 0 && !loading ? (
        <View style={styles.empty}>
          <View style={styles.diamond} />
          <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
          <Text style={styles.emptyText}>Tap + to add your first piece</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          renderItem={({ item, index }) => (
            <ClothingCard
              item={item}
              index={index}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingTop: 60, paddingHorizontal: 22 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 34,
    position: 'relative',
  },
  title: {
    fontFamily: fonts.serif,
    fontSize: 23,
    letterSpacing: 8,
    color: colors.text,
  },
  addBtn: {
    position: 'absolute',
    right: 0,
    width: 34,
    height: 34,
    borderWidth: 1,
    borderColor: 'rgba(20,17,13,0.25)',
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: { width: 13, height: 13, position: 'relative' },
  addH: { position: 'absolute', top: 6, left: 0, width: 13, height: 1, backgroundColor: colors.text },
  addV: { position: 'absolute', left: 6, top: 0, width: 1, height: 13, backgroundColor: colors.text },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    marginTop: 26,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  subLabel: { fontSize: 10, letterSpacing: 4, textTransform: 'uppercase', color: colors.text },
  pieceCount: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', color: colors.muted },
  filterScroll: { marginHorizontal: -22 },
  filterContent: { paddingHorizontal: 22, paddingVertical: 14, gap: 22 },
  filterItem: { alignItems: 'center', gap: 5 },
  filterText: { fontSize: 10, letterSpacing: 3, textTransform: 'uppercase', fontWeight: '500' },
  filterLine: { height: 1, width: '100%', backgroundColor: colors.text },
  list: { padding: 22, paddingBottom: 110, gap: 30 },
  row: { gap: 14 },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.md },
  diamond: { width: 26, height: 26, borderWidth: 1, borderColor: colors.accent, transform: [{ rotate: '45deg' }] },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 22, color: colors.text, marginTop: spacing.sm },
  emptyText: { fontSize: 12, letterSpacing: 2, textTransform: 'uppercase', color: colors.muted },
});
