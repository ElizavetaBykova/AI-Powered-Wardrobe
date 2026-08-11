import { useState, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { supabase } from '../lib/supabase';
import { colors, spacing, fonts } from '../constants/theme';

export default function ProfileScreen() {
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [updatingPassword, setUpdatingPassword] = useState(false);
  const [message, setMessage] = useState(null);

  useFocusEffect(useCallback(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data?.user?.email || ''));
  }, []));

  async function handleChangePassword() {
    setMessage(null);
    if (!newPassword || newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Password must be at least 6 characters' });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match' });
      return;
    }
    setUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setUpdatingPassword(false);
    if (error) {
      setMessage({ type: 'error', text: error.message });
    } else {
      setNewPassword('');
      setConfirmPassword('');
      setMessage({ type: 'success', text: 'Password updated' });
    }
  }

  async function doSignOut() {
    try {
      await supabase.auth.signOut();
    } catch (e) {
      console.warn('signOut error', e);
    }
    router.replace('/auth');
  }

  function handleSignOut() {
    if (Platform.OS === 'web') {
      if (window.confirm('Sign out and switch to a different account?')) {
        doSignOut();
      }
      return;
    }
    Alert.alert('Sign Out', 'Sign out and switch to a different account?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: doSignOut },
    ]);
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>ACCOUNT</Text>
        <View style={styles.emailRow}>
          <View style={styles.avatarLarge}>
            <Text style={styles.avatarInitial}>{email.charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.email}>{email}</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionLabel}>CHANGE PASSWORD</Text>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>NEW PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholderTextColor={colors.muted}
          />
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoComplete="new-password"
            placeholderTextColor={colors.muted}
          />
        </View>

        {message && (
          <Text style={message.type === 'error' ? styles.errorText : styles.successText}>
            {message.text}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleChangePassword} disabled={updatingPassword}>
          <Text style={styles.buttonText}>
            {updatingPassword ? '·  ·  ·' : 'UPDATE PASSWORD'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut}>
          <Text style={styles.signOutText}>SIGN OUT / SWITCH ACCOUNT</Text>
        </TouchableOpacity>
      </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.lg, flexGrow: 1 },
  section: { marginBottom: spacing.xl, gap: spacing.md },
  sectionLabel: { fontSize: 10, letterSpacing: 3, color: colors.muted },
  emailRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  avatarLarge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: { fontFamily: fonts.serifMedium, fontSize: 22, color: colors.text },
  email: { fontSize: 15, color: colors.text },
  fieldWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  fieldLabel: { fontSize: 9, letterSpacing: 3, color: colors.muted },
  input: { fontSize: 16, color: colors.text, paddingVertical: 4 },
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.text,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: { color: colors.text, fontSize: 10, letterSpacing: 4, fontWeight: '500' },
  errorText: { fontSize: 12, color: colors.error, textAlign: 'center' },
  successText: { fontSize: 12, color: '#4A7A5C', textAlign: 'center' },
  signOutBtn: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.error,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  signOutText: { color: colors.error, fontSize: 10, letterSpacing: 4, fontWeight: '500' },
});
