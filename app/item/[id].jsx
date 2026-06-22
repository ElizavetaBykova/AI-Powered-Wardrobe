import { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import LoadingOverlay from '../../components/LoadingOverlay';
import { colors, spacing, radius } from '../../constants/theme';

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const OCCASIONS = ['everyday', 'work', 'party', 'date', 'sport', 'beach', 'travel', 'formal-event'];

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    name: '', user_notes: '', warmth_level: 3, season: [], occasion: [],
  });

  useEffect(() => {
    loadItem();
  }, [id]);

  async function loadItem() {
    const { data, error } = await supabase.from('clothing_items').select('*').eq('id', id).single();
    if (error) { Alert.alert('Error', error.message); setLoading(false); return; }
    setItem(data);
    setForm({
      name: data.name || '',
      user_notes: data.user_notes || '',
      warmth_level: data.warmth_level || 3,
      season: data.season || [],
      occasion: data.occasion || [],
    });
    setLoading(false);
  }

  async function saveChanges() {
    setSaving(true);
    const { error } = await supabase
      .from('clothing_items')
      .update({ ...form, updated_at: new Date().toISOString() })
      .eq('id', id);
    setSaving(false);
    if (error) Alert.alert('Error', error.message);
    else Alert.alert('Saved', 'Your changes have been saved');
  }

  async function deleteItem() {
    Alert.alert('Remove Item', 'Remove this item from your wardrobe?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove', style: 'destructive',
        onPress: async () => {
          await supabase.from('clothing_items').delete().eq('id', id);
          router.back();
        },
      },
    ]);
  }

  function set(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function toggle(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((v) => v !== value)
        : [...prev[field], value],
    }));
  }

  if (loading) return <LoadingOverlay message="Loading..." />;
  if (!item) return null;

  return (
    <ScrollView style={styles.container}>
      {saving && <LoadingOverlay message="Saving..." />}

      {item.image_url && (
        <Image source={{ uri: item.image_url }} style={styles.image} />
      )}

      <View style={styles.content}>
        <View style={styles.badges}>
          {[item.type, item.style, item.color].filter(Boolean).map((tag) => (
            <View key={tag} style={styles.badge}>
              <Text style={styles.badgeText}>{tag}</Text>
            </View>
          ))}
        </View>

        {item.description ? (
          <Text style={styles.description}>{item.description}</Text>
        ) : null}

        {item.material ? (
          <Text style={styles.material}>Material: {item.material}</Text>
        ) : null}

        <View style={styles.divider} />
        <Text style={styles.sectionTitle}>Customize</Text>

        <View style={styles.field}>
          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            value={form.name}
            onChangeText={(v) => set('name', v)}
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Warmth  {form.warmth_level}/5</Text>
          <View style={styles.warmthRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.warmthBtn, form.warmth_level === n && styles.warmthBtnActive]}
                onPress={() => set('warmth_level', n)}
              >
                <Text style={[styles.warmthBtnText, form.warmth_level === n && styles.warmthBtnTextActive]}>
                  {n}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.warmthHint}>1 = very light  ·  5 = very warm</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Season</Text>
          <View style={styles.chips}>
            {SEASONS.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.chip, form.season.includes(s) && styles.chipActive]}
                onPress={() => toggle('season', s)}
              >
                <Text style={[styles.chipText, form.season.includes(s) && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Occasion</Text>
          <View style={styles.chips}>
            {OCCASIONS.map((o) => (
              <TouchableOpacity
                key={o}
                style={[styles.chip, form.occasion.includes(o) && styles.chipActive]}
                onPress={() => toggle('occasion', o)}
              >
                <Text style={[styles.chipText, form.occasion.includes(o) && styles.chipTextActive]}>{o}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Personal Notes</Text>
          <TextInput
            style={[styles.input, styles.multiline]}
            value={form.user_notes}
            onChangeText={(v) => set('user_notes', v)}
            placeholder="e.g. too warm in summer, favourite piece, great for dates..."
            multiline numberOfLines={4}
          />
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={saveChanges}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.deleteButton} onPress={deleteItem}>
          <Text style={styles.deleteButtonText}>Remove from Wardrobe</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  image: { width: '100%', height: 380, resizeMode: 'cover' },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  badges: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  badge: {
    backgroundColor: colors.border, borderRadius: radius.full,
    paddingHorizontal: spacing.sm, paddingVertical: 4,
  },
  badgeText: { fontSize: 12, color: colors.secondary, textTransform: 'capitalize' },
  description: { fontSize: 14, color: colors.text, lineHeight: 20 },
  material: { fontSize: 13, color: colors.secondary },
  divider: { height: 1, backgroundColor: colors.border },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  field: { gap: spacing.xs },
  label: { fontSize: 12, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 15, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  multiline: { minHeight: 90, textAlignVertical: 'top', paddingTop: 10 },
  warmthRow: { flexDirection: 'row', gap: spacing.sm },
  warmthBtn: {
    flex: 1, paddingVertical: 10, borderRadius: radius.md,
    borderWidth: 1.5, borderColor: colors.border, alignItems: 'center',
    backgroundColor: colors.card,
  },
  warmthBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  warmthBtnText: { fontSize: 15, fontWeight: '600', color: colors.secondary },
  warmthBtnTextActive: { color: '#FFF' },
  warmthHint: { fontSize: 11, color: colors.muted, textAlign: 'center' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 7,
    borderRadius: radius.full, borderWidth: 1.5, borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 13, color: colors.secondary, textTransform: 'capitalize' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  saveButton: {
    backgroundColor: colors.text, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
  deleteButton: {
    borderWidth: 1.5, borderColor: colors.error, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  deleteButtonText: { color: colors.error, fontWeight: '600', fontSize: 15 },
});
