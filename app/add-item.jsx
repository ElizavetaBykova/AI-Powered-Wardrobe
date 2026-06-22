import { useState } from 'react';
import {
  View, Text, Image, TouchableOpacity, TextInput,
  ScrollView, StyleSheet, Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { analyzeClothing, readImageAsBase64 } from '../lib/claude';
import { uploadClothingImage } from '../lib/storage';
import LoadingOverlay from '../components/LoadingOverlay';
import { colors, spacing, radius } from '../constants/theme';

function randomUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

const SEASONS = ['spring', 'summer', 'autumn', 'winter'];
const OCCASIONS = ['everyday', 'work', 'party', 'date', 'sport', 'beach', 'travel', 'formal-event'];

export default function AddItemScreen() {
  const [imageUri, setImageUri] = useState(null);
  const [imageData, setImageData] = useState(null);
  const [analyzed, setAnalyzed] = useState(false);
  const [loadingText, setLoadingText] = useState(null);
  const [form, setForm] = useState({
    name: '', type: '', color: '', style: '', description: '',
    warmth_level: 3, season: [], occasion: [], material: '', user_notes: '',
  });

  async function pickImage(fromCamera) {
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;

    const result = await fn({ mediaTypes: ['images'], quality: 0.8 });
    if (result.canceled) return;

    const uri = result.assets[0].uri;
    setImageUri(uri);
    setAnalyzed(false);

    const data = await readImageAsBase64(uri);
    setImageData(data);
  }

  async function analyzeImage() {
    if (!imageData) return;
    setLoadingText('Analyzing with AI...');
    try {
      const result = await analyzeClothing(imageData.base64, imageData.mediaType);
      setForm({
        name: result.name || '',
        type: result.type || '',
        color: result.color || '',
        style: result.style || '',
        description: result.description || '',
        warmth_level: parseInt(result.warmth_level) || 3,
        season: Array.isArray(result.season) ? result.season : [],
        occasion: Array.isArray(result.occasion) ? result.occasion : [],
        material: result.material || '',
        user_notes: '',
      });
      setAnalyzed(true);
    } catch (e) {
      Alert.alert('Analysis Failed', e.message);
    } finally {
      setLoadingText(null);
    }
  }

  async function saveItem() {
    if (!imageData) { Alert.alert('No image', 'Please select an image first'); return; }
    setLoadingText('Saving to wardrobe...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const itemId = randomUUID();

      const imageUrl = await uploadClothingImage(user.id, itemId, imageData.base64, imageData.mediaType);

      const { error } = await supabase.from('clothing_items').insert({
        id: itemId,
        user_id: user.id,
        image_url: imageUrl,
        ...form,
      });

      if (error) throw error;
      router.back();
    } catch (e) {
      Alert.alert('Save Failed', e.message);
    } finally {
      setLoadingText(null);
    }
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

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {loadingText && <LoadingOverlay message={loadingText} />}

      <View style={styles.imageSection}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={styles.placeholderText}>Select a photo</Text>
          </View>
        )}
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => pickImage(false)}>
            <Text style={styles.outlineButtonText}>Gallery</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => pickImage(true)}>
            <Text style={styles.outlineButtonText}>Camera</Text>
          </TouchableOpacity>
        </View>
      </View>

      {imageUri && !analyzed && (
        <TouchableOpacity style={styles.analyzeButton} onPress={analyzeImage}>
          <Text style={styles.analyzeButtonText}>✨ Analyze with AI</Text>
        </TouchableOpacity>
      )}

      {imageUri && !analyzed && (
        <TouchableOpacity style={styles.skipButton} onPress={() => setAnalyzed(true)}>
          <Text style={styles.skipButtonText}>Skip analysis, fill manually</Text>
        </TouchableOpacity>
      )}

      {analyzed && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>Name</Text>
            <TextInput style={styles.input} value={form.name} onChangeText={(v) => set('name', v)} />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Type</Text>
              <TextInput style={styles.input} value={form.type} onChangeText={(v) => set('type', v)} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Color</Text>
              <TextInput style={styles.input} value={form.color} onChangeText={(v) => set('color', v)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Style</Text>
              <TextInput style={styles.input} value={form.style} onChangeText={(v) => set('style', v)} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>Material</Text>
              <TextInput style={styles.input} value={form.material} onChangeText={(v) => set('material', v)} />
            </View>
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
              placeholder="e.g. too warm in summer, favorite jacket, great material..."
              multiline numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={saveItem}>
            <Text style={styles.saveButtonText}>Save to Wardrobe</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 40, gap: spacing.md },
  imageSection: { gap: spacing.sm },
  previewImage: { width: '100%', height: 300, borderRadius: radius.md, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%', height: 220, borderRadius: radius.md,
    backgroundColor: colors.border, justifyContent: 'center', alignItems: 'center', gap: spacing.sm,
  },
  placeholderIcon: { fontSize: 40 },
  placeholderText: { fontSize: 14, color: colors.muted },
  imageButtons: { flexDirection: 'row', gap: spacing.sm },
  outlineButton: {
    flex: 1, borderWidth: 1.5, borderColor: colors.border,
    borderRadius: radius.md, padding: spacing.sm, alignItems: 'center',
    backgroundColor: colors.card,
  },
  outlineButtonText: { fontSize: 14, fontWeight: '600', color: colors.text },
  analyzeButton: {
    backgroundColor: colors.text, borderRadius: radius.md,
    padding: spacing.md, alignItems: 'center',
  },
  analyzeButtonText: { color: '#FFF', fontWeight: '700', fontSize: 15 },
  skipButton: { alignItems: 'center', padding: spacing.xs },
  skipButtonText: { color: colors.secondary, fontSize: 13 },
  field: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: 12, fontWeight: '700', color: colors.secondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  input: {
    backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 10,
    fontSize: 15, color: colors.text,
    borderWidth: 1, borderColor: colors.border,
  },
  multiline: { minHeight: 80, textAlignVertical: 'top', paddingTop: 10 },
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
    padding: spacing.md, alignItems: 'center', marginTop: spacing.sm,
  },
  saveButtonText: { color: '#FFF', fontWeight: '700', fontSize: 16 },
});
