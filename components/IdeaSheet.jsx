import { useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, ScrollView, Image, StyleSheet } from 'react-native';
import { colors, spacing, fonts } from '../constants/theme';
import Spinner from './Spinner';

const MAX_ANCHORS = 2;

export default function IdeaSheet({ visible, items, loading, onClose, onSubmit }) {
  const [note, setNote] = useState('');
  const [anchorIds, setAnchorIds] = useState([]);

  function toggleAnchor(id) {
    setAnchorIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_ANCHORS) return prev;
      return [...prev, id];
    });
  }

  function handleClose() {
    setNote('');
    setAnchorIds([]);
    onClose();
  }

  function handleSubmit() {
    if (!note.trim() || loading) return;
    onSubmit({ note, anchorItemIds: anchorIds });
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.backdrop}>
        <TouchableOpacity style={styles.backdropTouch} activeOpacity={1} onPress={handleClose} />
        <View style={styles.sheet}>
          <View style={styles.handle} />
          <Text style={styles.title}>Style Your Idea</Text>
          <Text style={styles.subtitle}>Describe the vibe — weather, mood, time, occasion</Text>

          <TextInput
            style={styles.input}
            placeholder="e.g. cold rainy evening, feeling bold, dinner at 7"
            placeholderTextColor={colors.muted}
            value={note}
            onChangeText={setNote}
            multiline
            editable={!loading}
          />

          <Text style={styles.pickerLabel}>
            Build around specific pieces (optional, up to {MAX_ANCHORS})
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.picker}>
            {(items || []).map((item) => {
              const selected = anchorIds.includes(item.id);
              const disabled = !selected && anchorIds.length >= MAX_ANCHORS;
              return (
                <TouchableOpacity
                  key={item.id}
                  onPress={() => toggleAnchor(item.id)}
                  disabled={disabled || loading}
                  style={[styles.chip, disabled && styles.chipDisabled]}
                >
                  {item.image_url ? (
                    <Image source={{ uri: item.image_url }} style={[styles.chipImage, selected && styles.chipImageSelected]} />
                  ) : (
                    <View style={[styles.chipImage, styles.chipPlaceholder, selected && styles.chipImageSelected]} />
                  )}
                  <Text style={styles.chipName} numberOfLines={1}>{item.name}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          <TouchableOpacity
            style={[styles.submitBtn, (!note.trim() || loading) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={!note.trim() || loading}
          >
            {loading ? <Spinner size={13} thickness={1.5} color="#F4F1EB" trackColor="rgba(244,241,235,0.25)" /> : <View style={styles.btnDiamond} />}
            <Text style={styles.submitBtnText}>{loading ? 'STYLING…' : 'GENERATE FROM IDEA'}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(20,17,13,0.4)' },
  backdropTouch: { flex: 1 },
  sheet: {
    backgroundColor: colors.background,
    paddingHorizontal: 22,
    paddingTop: 14,
    paddingBottom: 40,
  },
  handle: { width: 36, height: 3, backgroundColor: colors.border, alignSelf: 'center', marginBottom: 18 },
  title: { fontFamily: fonts.serifMedium, fontSize: 24, color: colors.text },
  subtitle: { fontSize: 11, letterSpacing: 1, color: colors.muted, marginTop: 6, marginBottom: 18 },
  input: {
    fontFamily: fonts.serif,
    fontSize: 16,
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    minHeight: 76,
    textAlignVertical: 'top',
  },
  pickerLabel: { fontSize: 9.5, letterSpacing: 1.5, textTransform: 'uppercase', color: colors.muted, marginTop: 20, marginBottom: 10 },
  picker: { flexGrow: 0 },
  chip: { width: 64, marginRight: 10, alignItems: 'center' },
  chipDisabled: { opacity: 0.35 },
  chipImage: { width: 64, height: 64, backgroundColor: '#ECE8E0', borderWidth: 1, borderColor: 'transparent' },
  chipImageSelected: { borderColor: colors.accent },
  chipPlaceholder: { backgroundColor: '#E5E0D6' },
  chipName: { fontSize: 8.5, letterSpacing: 0.5, color: colors.muted, marginTop: 6, textAlign: 'center' },
  submitBtn: {
    marginTop: 24,
    height: 56,
    backgroundColor: colors.text,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
  },
  submitBtnDisabled: { opacity: 0.4 },
  btnDiamond: { width: 11, height: 11, borderWidth: 1, borderColor: colors.accent, transform: [{ rotate: '45deg' }] },
  submitBtnText: { fontSize: 11, letterSpacing: 4, color: '#F4F1EB' },
});
