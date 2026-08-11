import { useState, useCallback } from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors } from '../constants/theme';

export default function ProfileAvatar({ style }) {
  const [initial, setInitial] = useState('');

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data?.user?.email || '';
      setInitial(email.charAt(0).toUpperCase());
    });
  }, []));

  return (
    <TouchableOpacity style={[styles.avatar, style]} onPress={() => router.push('/profile')}>
      <Text style={styles.initial}>{initial}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: 'rgba(20,17,13,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  initial: {
    fontFamily: 'CormorantGaramond-Medium',
    fontSize: 14,
    color: colors.text,
  },
});
