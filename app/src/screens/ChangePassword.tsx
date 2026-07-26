import {useState} from 'react';
import {StyleSheet, Text, TextInput, Pressable, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../navigation/ProfileStack';
import {useAuth} from '../context/AuthContext';
import {extractErrorMessage} from '../api/client';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'ChangePassword'>;

export default function ChangePassword({}: Props) {
  const {user, updatePassword} = useAuth();
  const hasPassword = !!user?.hasPassword;

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSave() {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updatePassword(newPassword, hasPassword ? currentPassword : undefined);
      setCurrentPassword('');
      setNewPassword('');
      setSuccess(hasPassword ? 'Password updated' : 'Password set');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update password'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{hasPassword ? 'Change Password' : 'Set Password'}</Text>
      {hasPassword && (
        <TextInput
          style={styles.input}
          placeholder="Current password"
          placeholderTextColor={colors.textMuted}
          secureTextEntry
          value={currentPassword}
          onChangeText={setCurrentPassword}
        />
      )}
      <TextInput
        style={styles.input}
        placeholder="New password"
        placeholderTextColor={colors.textMuted}
        secureTextEntry
        value={newPassword}
        onChangeText={setNewPassword}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <Pressable
        style={styles.button}
        onPress={handleSave}
        disabled={saving || newPassword.length < 6 || (hasPassword && !currentPassword)}>
        <Text style={styles.buttonText}>
          {saving ? 'Saving...' : hasPassword ? 'Change Password' : 'Set Password'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: 16, gap: 12},
  sectionTitle: {color: colors.text, fontSize: 16, fontWeight: '600'},
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    color: colors.text,
  },
  error: {color: colors.danger},
  success: {color: colors.success},
  button: {
    backgroundColor: colors.purple,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  buttonText: {color: colors.white, fontWeight: '600'},
});
