import { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { supabase } from '../../lib/supabase';
import ProfileAvatar from '../../components/ProfileAvatar';
import OutfitCard from '../../components/OutfitCard';
import Spinner from '../../components/Spinner';
import { colors, spacing, fonts } from '../../constants/theme';

export default function LikedOutfitsScreen() {
  const [liked, setLiked] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(useCallback(() => { loadLiked(); }, []));

  async function loadLiked() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }
    const { data } = await supabase
      .from('liked_outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    setLiked(data || []);
    setLoading(false);
  }

  async function handleUnlike(row) {
    setLiked((prev) => prev.filter((r) => r.id !== row.id));
    const { error } = await supabase.from('liked_outfits').delete().eq('id', row.id);
    if (error) {
      setLiked((prev) => [...prev, row].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)));
      Alert.alert('Error', error.message);
    }
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <ProfileAvatar style={styles.avatarBtn} />
          <Text style={styles.title}>PIÈCE</Text>
          <Text style={styles.subtitle}>Your Favorites</Text>
        </View>

        {loading ? (
          <View style={styles.loadingBox}>
            <Spinner size={26} thickness={2} />
          </View>
        ) : liked.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyDiamond} />
            <Text style={styles.emptyTitle}>No Liked Looks</Text>
            <Text style={styles.emptyText}>
              Tap the heart on any outfit to save it here.
            </Text>
          </View>
        ) : (
          liked.map((row) => (
            <OutfitCard
              key={row.id}
              name={row.name}
              occasion={row.occasion}
              season={row.season}
              description={row.description}
              pieces={row.items}
              liked
              onToggleLike={() => handleUnlike(row)}
            />
          ))
        )}
      </ScrollView>
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
  loadingBox: { paddingTop: 100, alignItems: 'center' },
  empty: { paddingTop: 80, paddingHorizontal: 40, alignItems: 'center', gap: spacing.md },
  emptyDiamond: { width: 26, height: 26, borderWidth: 1, borderColor: colors.accent, transform: [{ rotate: '45deg' }] },
  emptyTitle: { fontFamily: fonts.serifMedium, fontSize: 26, color: colors.text, marginTop: spacing.md },
  emptyText: { fontFamily: fonts.serif, fontSize: 16, lineHeight: 24, color: colors.muted, textAlign: 'center', fontStyle: 'italic' },
});
