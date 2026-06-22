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
import { colors, spacing, fonts } from '../constants/theme';

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
    setLoadingText('Analyzing with AI…');
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
    setLoadingText('Saving to wardrobe…');
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

      {/* Image Section */}
      <View style={styles.imageSection}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={styles.previewImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <View style={styles.placeholderDiamond} />
            <Text style={styles.placeholderText}>SELECT A PHOTO</Text>
          </View>
        )}
        <View style={styles.imageButtons}>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => pickImage(false)}>
            <Text style={styles.outlineBtnText}>GALLERY</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={() => pickImage(true)}>
            <Text style={styles.outlineBtnText}>CAMERA</Text>
          </TouchableOpacity>
        </View>
      </View>

      {imageUri && !analyzed && (
        <TouchableOpacity style={styles.analyzeBtn} onPress={analyzeImage}>
          <View style={styles.analyzeDiamond} />
          <Text style={styles.analyzeBtnText}>ANALYSE WITH AI</Text>
        </TouchableOpacity>
      )}

      {imageUri && !analyzed && (
        <TouchableOpacity style={styles.skipBtn} onPress={() => setAnalyzed(true)}>
          <Text style={styles.skipBtnText}>fill in manually</Text>
        </TouchableOpacity>
      )}

      {analyzed && (
        <>
          <View style={styles.field}>
            <Text style={styles.label}>NAME</Text>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => set('name', v)}
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.description}
              onChangeText={(v) => set('description', v)}
              multiline
              numberOfLines={3}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>TYPE</Text>
              <TextInput style={styles.input} value={form.type} onChangeText={(v) => set('type', v)} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>COLOUR</Text>
              <TextInput style={styles.input} value={form.color} onChangeText={(v) => set('color', v)} />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>STYLE</Text>
              <TextInput style={styles.input} value={form.style} onChangeText={(v) => set('style', v)} />
            </View>
            <View style={[styles.field, { flex: 1 }]}>
              <Text style={styles.label}>MATERIAL</Text>
              <TextInput style={styles.input} value={form.material} onChangeText={(v) => set('material', v)} />
            </View>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>WARMTH  {form.warmth_level}/5</Text>
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
            <Text style={styles.warmthHint}>1 = very light  ·  5 = very warm</Text>
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>SEASON</Text>
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

          <View style={styles.field}>
            <Text style={styles.label}>OCCASION</Text>
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

          <View style={styles.field}>
            <Text style={styles.label}>PERSONAL NOTES</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              value={form.user_notes}
              onChangeText={(v) => set('user_notes', v)}
              placeholder="Your thoughts on this piece…"
              placeholderTextColor={colors.muted}
              multiline
              numberOfLines={3}
            />
          </View>

          <TouchableOpacity style={styles.saveBtn} onPress={saveItem}>
            <Text style={styles.saveBtnText}>ADD TO WARDROBE</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.md, paddingBottom: 50, gap: spacing.lg },

  imageSection: { gap: spacing.sm },
  previewImage: { width: '100%', aspectRatio: 3 / 4, resizeMode: 'cover' },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 4 / 3,
    backgroundColor: '#ECE8E0',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.md,
  },
  placeholderDiamond: {
    width: 28,
    height: 28,
    borderWidth: 1,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  placeholderText: { fontSize: 9, letterSpacing: 4, color: colors.muted },

  imageButtons: { flexDirection: 'row', gap: spacing.sm },
  outlineBtn: {
    flex: 1,
    height: 46,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  outlineBtnText: { fontSize: 10, letterSpacing: 3, color: colors.text },

  analyzeBtn: {
    height: 54,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  analyzeDiamond: {
    width: 10,
    height: 10,
    borderWidth: 1,
    borderColor: colors.accent,
    transform: [{ rotate: '45deg' }],
  },
  analyzeBtnText: { fontSize: 10, letterSpacing: 4, color: '#F4F1EB' },

  skipBtn: { alignItems: 'center', paddingVertical: spacing.xs },
  skipBtnText: { fontSize: 12, color: colors.muted, textDecorationLine: 'underline' },

  field: { gap: spacing.xs },
  row: { flexDirection: 'row', gap: spacing.sm },
  label: { fontSize: 9, letterSpacing: 3, color: colors.muted },
  input: {
    fontFamily: fonts.serif,
    fontSize: 17,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    backgroundColor: 'transparent',
  },
  multiline: { minHeight: 70, textAlignVertical: 'top' },

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
  warmthHint: { fontSize: 10, letterSpacing: 1, color: colors.muted, textAlign: 'center' },

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

  saveBtn: {
    height: 58,
    backgroundColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  saveBtnText: { fontSize: 11, letterSpacing: 4, color: '#F4F1EB' },
});
