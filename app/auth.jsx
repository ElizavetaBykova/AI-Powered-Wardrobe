import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
} from 'react-native';
import { supabase } from '../lib/supabase';
import { spacing } from '../constants/theme';

export default function AuthScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  async function handleAuth() {
    setMessage(null);
    if (!email.trim() || !password) {
      setMessage({ type: 'error', text: 'Please enter your email and password' });
      return;
    }
    setLoading(true);
    try {
      const { error } = isSignUp
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
      if (error) setMessage({ type: 'error', text: error.message });
      else if (isSignUp) setMessage({ type: 'success', text: 'Check your email for a confirmation link' });
    } catch (e) {
      setMessage({ type: 'error', text: e.message });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.header}>
        <Text style={styles.logo}>PIÈCE</Text>
        <Text style={styles.tagline}>YOUR PERSONAL ARCHIVE</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>EMAIL</Text>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            autoComplete="email"
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
        </View>

        <View style={styles.fieldWrapper}>
          <Text style={styles.fieldLabel}>PASSWORD</Text>
          <TextInput
            style={styles.input}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            placeholderTextColor="rgba(255,255,255,0.25)"
          />
        </View>

        {message && (
          <Text style={message.type === 'error' ? styles.errorText : styles.successText}>
            {message.text}
          </Text>
        )}

        <TouchableOpacity style={styles.button} onPress={handleAuth} disabled={loading}>
          <Text style={styles.buttonText}>
            {loading ? '·  ·  ·' : isSignUp ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.toggle}
          onPress={() => { setIsSignUp(!isSignUp); setMessage(null); }}
        >
          <Text style={styles.toggleText}>
            {isSignUp ? 'Already have an account?  ' : "Don't have an account?  "}
            <Text style={styles.toggleLink}>{isSignUp ? 'Sign in' : 'Sign up'}</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.xl * 2,
    paddingBottom: spacing.xl,
  },
  header: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  logo: {
    fontFamily: 'CormorantGaramond-Light',
    fontSize: 64,
    color: '#FFFFFF',
    letterSpacing: 18,
  },
  tagline: {
    fontSize: 9,
    letterSpacing: 4,
    color: 'rgba(255,255,255,0.35)',
  },
  form: {
    gap: spacing.lg,
  },
  fieldWrapper: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.2)',
    paddingBottom: spacing.sm,
    gap: spacing.xs,
  },
  fieldLabel: {
    fontSize: 9,
    letterSpacing: 3,
    color: 'rgba(255,255,255,0.4)',
  },
  input: {
    fontSize: 16,
    color: '#FFFFFF',
    paddingVertical: 4,
  },
  button: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.5)',
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 4,
    fontWeight: '500',
  },
  toggle: { alignItems: 'center' },
  toggleText: { fontSize: 12, color: 'rgba(255,255,255,0.35)' },
  toggleLink: { color: 'rgba(255,255,255,0.7)' },
  errorText: { fontSize: 12, color: '#E74C3C', textAlign: 'center' },
  successText: { fontSize: 12, color: '#58D68D', textAlign: 'center' },
});
