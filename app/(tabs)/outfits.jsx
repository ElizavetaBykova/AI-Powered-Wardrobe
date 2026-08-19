import { useState, useCallback } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { generateOutfits, generateOutfitsFromPrompt } from '../../lib/claude';
import { outfitKey } from '../../lib/outfitKey';
import LoadingOverlay from '../../components/LoadingOverlay';
import ProfileAvatar from '../../components/ProfileAvatar';
import OutfitCard from '../../components/OutfitCard';
import IdeaSheet from '../../components/IdeaSheet';
import { colors, spacing, fonts } from '../../constants/theme';

function computeWardrobeKey(items) {
  return items.map((i) => `${i.id}:${i.updated_at}`).sort().join('|');
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHex({ r, g, b }) {
  return '#' + [r, g, b].map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
}

// Ease-in-out (zero slope at both ends) so the fade meets the flat panels on
// either side without a visible seam — a plain 2-stop gradient has a constant
// rate of change that reads as a hard edge against a flat color.
function buildFadeStops(colorA, colorB, steps = 6) {
  const a = hexToRgb(colorA);
  const b = hexToRgb(colorB);
  const colorStops = [];
  const locations = [];
  for (let i = 0; i < steps; i++) {
    const t = i / (steps - 1);
    const eased = t * t * (3 - 2 * t);
    colorStops.push(rgbToHex({
      r: a.r + (b.r - a.r) * eased,
      g: a.g + (b.g - a.g) * eased,
      b: a.b + (b.b - a.b) * eased,
    }));
    locations.push(t);
  }
  return { colors: colorStops, locations };
}

const fadeToDark = buildFadeStops(colors.background, colors.darkPanel);
const fadeToLight = buildFadeStops(colors.darkPanel, colors.background);

export default function OutfitsScreen() {
  const [outfits, setOutfits] = useState([]);
  const [itemMap, setItemMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [upToDate, setUpToDate] = useState(false);
  const [likedKeys, setLikedKeys] = useState(new Set());
  const [ideaVisible, setIdeaVisible] = useState(false);
  const [ideaItems, setIdeaItems] = useState([]);
  const [ideaLoading, setIdeaLoading] = useState(false);
  const [ideaResult, setIdeaResult] = useState(null);

  useFocusEffect(useCallback(() => { loadSavedOutfits(); }, []));

  async function loadLikedKeys(userId) {
    const { data } = await supabase.from('liked_outfits').select('outfit_key').eq('user_id', userId);
    setLikedKeys(new Set((data || []).map((r) => r.outfit_key)));
  }

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
    loadLikedKeys(user.id);
  }

  async function toggleLike(outfit, map = itemMap) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const key = outfitKey(outfit);
    const alreadyLiked = likedKeys.has(key);

    setLikedKeys((prev) => {
      const next = new Set(prev);
      if (alreadyLiked) next.delete(key); else next.add(key);
      return next;
    });

    if (alreadyLiked) {
      const { error } = await supabase
        .from('liked_outfits')
        .delete()
        .eq('user_id', user.id)
        .eq('outfit_key', key);
      if (error) {
        setLikedKeys((prev) => new Set(prev).add(key));
        Alert.alert('Error', error.message);
      }
      return;
    }

    const items = (outfit.item_ids || []).map((id) => {
      const it = map[id];
      return it ? { id: it.id, name: it.name, image_url: it.image_url } : { id };
    });

    const { error } = await supabase.from('liked_outfits').insert({
      user_id: user.id,
      outfit_key: key,
      name: outfit.name,
      occasion: outfit.occasion,
      description: outfit.description,
      season: outfit.season,
      item_ids: outfit.item_ids,
      items,
    });

    if (error && error.code !== '23505') {
      setLikedKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
      Alert.alert('Error', error.message);
    }
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

  async function openIdeaSheet() {
    const { data: items, error } = await supabase.from('clothing_items').select('*');
    if (error) { Alert.alert('Error', error.message); return; }
    if ((items || []).length < 2) {
      Alert.alert('Not enough pieces', 'Add at least 2 pieces to your wardrobe first');
      return;
    }
    setIdeaItems(items);
    setIdeaVisible(true);
  }

  async function handleIdeaSubmit({ note, anchorItemIds }) {
    setIdeaLoading(true);
    try {
      const result = await generateOutfitsFromPrompt(ideaItems, { note, anchorItemIds });
      const map = {};
      ideaItems.forEach((item) => { map[item.id] = item; });
      setIdeaResult({ outfits: result.outfits || [], feedback: result.feedback, itemMap: map });
      setIdeaVisible(false);
    } catch (e) {
      Alert.alert('Error', e.message);
    } finally {
      setIdeaLoading(false);
    }
  }

  return (
    <View style={styles.container}>
      {loading && <LoadingOverlay message="Styling your looks…" />}

      <ScrollView contentContainerStyle={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <ProfileAvatar style={styles.avatarBtn} />
          <Text style={styles.title}>PIÈCE</Text>
          <Text style={styles.subtitle}>Styled For You</Text>
        </View>

        {/* Generate button */}
        <TouchableOpacity style={styles.generateBtn} onPress={() => handleGenerate(false)}>
          <View style={styles.btnDiamond} />
          <Text style={styles.generateBtnText}>GENERATE OUTFIT IDEAS</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.ideaBtn} onPress={openIdeaSheet}>
          <Text style={styles.ideaBtnText}>STYLE MY IDEA</Text>
        </TouchableOpacity>

        {ideaResult && (
          <View style={styles.ideaResults}>
            <LinearGradient colors={fadeToDark.colors} locations={fadeToDark.locations} style={styles.ideaFade} />

            <View style={styles.ideaDark}>
              <View style={styles.ideaResultsHeader}>
                <View>
                  <Text style={styles.ideaKicker}>◆ CUSTOM STYLING</Text>
                  <Text style={styles.ideaResultsTitle}>From Your Idea</Text>
                </View>
                <TouchableOpacity onPress={() => setIdeaResult(null)}>
                  <Text style={styles.ideaClearLink}>Clear</Text>
                </TouchableOpacity>
              </View>

              {ideaResult.outfits.length === 0 ? (
                <Text style={styles.ideaFeedback}>
                  {ideaResult.feedback || "Nothing in your wardrobe honestly fits that — try a different idea."}
                </Text>
              ) : (
                ideaResult.outfits.map((outfit, i) => (
                  <OutfitCard
                    key={`idea-${i}`}
                    dark
                    name={outfit.name}
                    occasion={outfit.occasion}
                    season={outfit.season}
                    description={outfit.description}
                    confidence={outfit.confidence}
                    pieces={(outfit.item_ids || []).map((id) => ideaResult.itemMap[id]).filter(Boolean)}
                    liked={likedKeys.has(outfitKey(outfit))}
                    onToggleLike={() => toggleLike(outfit, ideaResult.itemMap)}
                  />
                ))
              )}
            </View>

            <LinearGradient colors={fadeToLight.colors} locations={fadeToLight.locations} style={styles.ideaFade} />
          </View>
        )}

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
            <OutfitCard
              key={i}
              number={String(i + 1).padStart(2, '0')}
              name={outfit.name}
              occasion={outfit.occasion}
              season={outfit.season}
              description={outfit.description}
              pieces={(outfit.item_ids || []).map((id) => itemMap[id]).filter(Boolean)}
              liked={likedKeys.has(outfitKey(outfit))}
              onToggleLike={() => toggleLike(outfit)}
            />
          ))
        )}
      </ScrollView>

      <IdeaSheet
        visible={ideaVisible}
        items={ideaItems}
        loading={ideaLoading}
        onClose={() => setIdeaVisible(false)}
        onSubmit={handleIdeaSubmit}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 110, gap: spacing.md },
  header: { paddingTop: 60, paddingHorizontal: 22, alignItems: 'center', paddingBottom: spacing.lg, position: 'relative' },
  avatarBtn: { position: 'absolute', left: 22, top: 60 },
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
  ideaBtn: {
    marginHorizontal: 22,
    marginTop: 10,
    height: 50,
    borderWidth: 1,
    borderColor: colors.text,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ideaBtnText: { fontSize: 11, letterSpacing: 4, color: colors.text },
  ideaResults: { marginTop: spacing.lg },
  ideaFade: { height: 140 },
  ideaDark: { backgroundColor: colors.darkPanel, paddingBottom: 8 },
  ideaResultsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 22,
    paddingTop: 24,
  },
  ideaKicker: { fontSize: 9.5, letterSpacing: 3, color: colors.accent, marginBottom: 6 },
  ideaResultsTitle: { fontFamily: fonts.serifMedium, fontSize: 20, color: '#F4F1EB' },
  ideaClearLink: { fontSize: 11, color: '#B8B2A3', textDecorationLine: 'underline', marginTop: 4 },
  ideaFeedback: {
    fontFamily: fonts.serifItalic,
    fontSize: 15,
    lineHeight: 23,
    color: '#D9D4C8',
    paddingHorizontal: 22,
    paddingTop: 16,
    paddingBottom: 24,
  },
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
});
