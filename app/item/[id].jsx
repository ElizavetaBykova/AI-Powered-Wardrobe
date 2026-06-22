import { useState, useEffect } from 'react';
import {
  View, Text, Image, ScrollView, TextInput,
  TouchableOpacity, StyleSheet, Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { supabase } from '../../lib/supabase';
import LoadingOverlay from '../../components/LoadingOverlay';
import { colors, spacing, fonts } from '../../constants/theme';

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

  useEffect(() => { loadItem(); }, [id]);

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
    else router.back();
  }

  async function deleteItem() {
    Alert.alert('Remove Piece', 'Remove this piece from your wardrobe?', [
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

  function set(field, value) { setForm((prev) => ({ ...prev, [field]: value })); }
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
    <View style={styles.container}>
      {saving && <LoadingOverlay message="Saving..." />}
      <ScrollView showsVerticalScrollIndicator={false}>

        {/* Hero image */}
        <View style={styles.imageWrap}>
          {item.image_url
            ? <Image source={{ uri: item.image_url }} style={styles.image} />
            : <View style={[styles.image, styles.imagePlaceholder]} />
          }
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <View style={styles.chevron} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Category */}
          {item.type ? (
            <Text style={styles.category}>{item.type.toUpperCase()}</Text>
          ) : null}

          {/* Name (editable) */}
          <TextInput
            style={styles.nameInput}
            value={form.name}
            onChangeText={(v) => set('name', v)}
            multiline
          />

          {/* Description */}
          {item.description ? (
            <Text style={styles.description}>{item.description}</Text>
          ) : null}

          {/* Metadata rows */}
          <View style={styles.metaTable}>
            {[
              ['Colour', item.color],
              ['Material', item.material],
              ['Style', item.style],
            ].filter(([, v]) => v).map(([label, value]) => (
              <View key={label} style={styles.metaRow}>
                <Text style={styles.metaLabel}>{label.toUpperCase()}</Text>
                <Text style={styles.metaValue}>{value}</Text>
              </View>
            ))}
          </View>

          {/* Warmth */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>WARMTH  {form.warmth_level}/5</Text>
            <View style={styles.warmthRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <TouchableOpacity
                  key={n}
                  style={[styles.warmthBtn, form.warmth_level === n && styles.warmthBtnActive]}
                  onPress={() => set('warmth_level', n)}
                >
                  <Text style={[styles.warmthNum, form.warmth_level === n && styles.warmthNumActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Season */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>SEASON</Text>
            <View style={styles.chips}>
              {SEASONS.map((s) => (
                <TouchableOpacity
                  key={s}
                  style={[styles.chip, form.season.includes(s) && styles.chipActive]}
                  onPress={() => toggle('season', s)}
                >
                  <Text style={[styles.chipText, form.season.includes(s) && styles.chipTextActive]}>
                    {s}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Occasion */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>OCCASION</Text>
            <View style={styles.chips}>
              {OCCASIONS.map((o) => (
                <TouchableOpacity
                  key={o}
                  style={[styles.chip, form.occasion.includes(o) && styles.chipActive]}
                  onPress={() => toggle('occasion', o)}
                >
                  <Text style={[styles.chipText, form.occasion.includes(o) && styles.chipTextActive]}>
                    {o}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Notes */}
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>PERSONAL NOTES</Text>
            <TextInput
              style={styles.notesInput}
              value={form.user_notes}
              onChangeText={(v) => set('user_notes', v)}
              placeholder="Your thoughts on this piece…"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Style This Piece → Outfits */}
          <TouchableOpacity style={styles.styleBtn} onPress={() => router.push('/(tabs)/outfits')}>
            <Text style={styles.styleBtnText}>STYLE THIS PIECE</Text>
          </TouchableOpacity>

          {/* Save */}
          <TouchableOpacity style={styles.saveBtn} onPress={saveChanges}>
            <Text style={styles.saveBtnText}>SAVE CHANGES</Text>
          </TouchableOpacity>

          {/* Delete */}
          <TouchableOpacity style={styles.deleteBtn} onPress={deleteItem}>
            <Text style={styles.deleteBtnText}>Remove from Wardrobe</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  imageWrap: { position: 'relative', width: '100%', height: 440, backgroundColor: '#ECE8E0' },
  image: { width: '100%', height: '100%', resizeMode: 'cover' },
  imagePlaceholder: { backgroundColor: '#E5E0D6' },
  backBtn: {
    position: 'absolute',
    top: 54,
    left: 20,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(244,241,235,0.82)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 10,
    height: 10,
    borderLeftWidth: 1.5,
    borderBottomWidth: 1.5,
    borderColor: colors.text,
    transform: [{ rotate: '45deg' }],
    marginLeft: 3,
  },
  content: { padding: 26, paddingBottom: 60, gap: spacing.lg },
  category: {
    fontSize: 10,
    letterSpacing: 3,
    color: colors.accent,
  },
  nameInput: {
    fontFamily: fonts.serifMedium,
    fontSize: 30,
    lineHeight: 34,
    color: colors.text,
    padding: 0,
    marginTop: -spacing.sm,
  },
  description: {
    fontFamily: fonts.serif,
    fontSize: 17,
    lineHeight: 26,
    color: colors.secondary,
    fontStyle: 'italic',
  },
  metaTable: { gap: 0 },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metaLabel: { fontSize: 10, letterSpacing: 2, color: colors.muted },
  metaValue: { fontSize: 10, letterSpacing: 2, color: colors.text, textTransform: 'capitalize' },
  field: { gap: spacing.sm },
  fieldLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted },
  warmthRow: { flexDirection: 'row', gap: spacing.sm },
  warmthBtn: {
    flex: 1,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.card,
  },
  warmthBtnActive: { backgroundColor: colors.text, borderColor: colors.text },
  warmthNum: { fontSize: 14, color: colors.secondary },
  warmthNumActive: { color: '#F4F1EB' },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  chipActive: { backgroundColor: colors.text, borderColor: colors.text },
  chipText: { fontSize: 10, letterSpacing: 1.5, textTransform: 'capitalize', color: colors.secondary },
  chipTextActive: { color: '#F4F1EB' },
  notesInput: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  styleBtn: {
    height: 54,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  styleBtnText: { fontSize: 11, letterSpacing: 4, color: colors.text },
  saveBtn: {
    height: 56,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtnText: { fontSize: 11, letterSpacing: 4, color: '#F4F1EB', fontWeight: '500' },
  deleteBtn: { alignItems: 'center', paddingVertical: spacing.sm },
  deleteBtnText: { fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },
});
