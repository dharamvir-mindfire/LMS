import {useState} from 'react';
import {StyleSheet, Text, TextInput, Pressable, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/RootNavigator';
import {useAuth} from '../context/AuthContext';
import {extractErrorMessage} from '../api/client';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

type Mode = 'password' | 'otp-request' | 'otp-verify';

export default function Login({}: Props) {
  const {login, sendOtp, loginWithOtp} = useAuth();
  const [mode, setMode] = useState<Mode>('otp-request');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleLogin() {
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(extractErrorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSendOtp() {
    setError('');
    setSubmitting(true);
    try {
      await sendOtp(email);
      setMode('otp-verify');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not send OTP'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleVerifyOtp() {
    setError('');
    setSubmitting(true);
    try {
      await loginWithOtp(email, otp);
    } catch (err) {
      setError(extractErrorMessage(err, 'Invalid or expired OTP'));
    } finally {
      setSubmitting(false);
    }
  }

  function switchMode(next: Mode) {
    setError('');
    setOtp('');
    setMode(next);
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>LMS</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor={colors.textMuted}
        autoCapitalize="none"
        keyboardType="email-address"
        editable={mode !== 'otp-verify'}
        value={email}
        onChangeText={setEmail}
      />

      {mode === 'password' && (
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
      )}

      {mode === 'otp-verify' && (
        <TextInput
          style={styles.input}
          placeholder="6-digit code"
          placeholderTextColor={colors.textMuted}
          keyboardType="number-pad"
          maxLength={6}
          value={otp}
          onChangeText={setOtp}
        />
      )}

      {error ? <Text style={styles.error}>{error}</Text> : null}

      {mode === 'password' && (
        <Pressable
          style={styles.button}
          onPress={handleLogin}
          disabled={submitting}>
          <Text style={styles.buttonText}>
            {submitting ? 'Logging in...' : 'Login'}
          </Text>
        </Pressable>
      )}

      {mode === 'otp-request' && (
        <Pressable
          style={styles.button}
          onPress={handleSendOtp}
          disabled={submitting || !email}>
          <Text style={styles.buttonText}>
            {submitting ? 'Sending...' : 'Send OTP'}
          </Text>
        </Pressable>
      )}

      {mode === 'otp-verify' && (
        <>
          <Pressable
            style={styles.button}
            onPress={handleVerifyOtp}
            disabled={submitting || !otp}>
            <Text style={styles.buttonText}>
              {submitting ? 'Verifying...' : 'Verify & Login'}
            </Text>
          </Pressable>
          <Pressable onPress={handleSendOtp} disabled={submitting}>
            <Text style={styles.link}>Resend OTP</Text>
          </Pressable>
        </>
      )}

      {mode === 'password' ? (
        <Pressable onPress={() => switchMode('otp-request')}>
          <Text style={styles.link}>Login with OTP instead</Text>
        </Pressable>
      ) : (
        <Pressable onPress={() => switchMode('password')}>
          <Text style={styles.link}>Login with password instead</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  error: {
    color: colors.danger,
  },
  button: {
    backgroundColor: colors.purple,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: colors.white,
    fontWeight: '600',
  },
  link: {
    color: colors.purple,
    textAlign: 'center',
    marginTop: 8,
  },
});
