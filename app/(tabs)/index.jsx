import { useState, useCallback } from 'react';
import { View, FlatList, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ClothingCard from '../../components/ClothingCard';
import { colors, spacing } from '../../constants/theme';

export default function WardrobeScreen() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('clothing_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) Alert.alert('Error', error.message);
    else setItems(data || []);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [fetchItems])
  );

  return (
    <View style={styles.container}>
      {items.length === 0 && !loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyIcon}>👗</Text>
          <Text style={styles.emptyTitle}>Your wardrobe is empty</Text>
          <Text style={styles.emptyText}>Tap + to add your first item</Text>
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={styles.list}
          onRefresh={fetchItems}
          refreshing={loading}
          renderItem={({ item }) => (
            <ClothingCard item={item} onPress={() => router.push(`/item/${item.id}`)} />
          )}
        />
      )}

      <TouchableOpacity style={styles.fab} onPress={() => router.push('/add-item')}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  list: { padding: spacing.sm, paddingBottom: 80 },
  row: { gap: spacing.sm },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: spacing.sm },
  emptyIcon: { fontSize: 48, marginBottom: spacing.sm },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
  emptyText: { fontSize: 14, color: colors.secondary },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.text,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
  fabText: { color: '#FFF', fontSize: 30, lineHeight: 34 },
});
