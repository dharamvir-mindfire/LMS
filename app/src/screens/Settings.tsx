import {useState} from 'react';
import {StyleSheet, Text, TextInput, Pressable, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../navigation/ProfileStack';
import {useAuth} from '../context/AuthContext';
import {extractErrorMessage} from '../api/client';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Settings'>;

export default function Settings({}: Props) {
  const {user, updateProfile} = useAuth();

  const [name, setName] = useState(user?.name ?? '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSaveProfile() {
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      await updateProfile(name);
      setSuccess('Profile updated');
    } catch (err) {
      setError(extractErrorMessage(err, 'Could not update profile'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor={colors.textMuted}
        value={name}
        onChangeText={setName}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {success ? <Text style={styles.success}>{success}</Text> : null}
      <Pressable style={styles.button} onPress={handleSaveProfile} disabled={saving || !name.trim()}>
        <Text style={styles.buttonText}>{saving ? 'Saving...' : 'Save'}</Text>
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
  buttonText: {color: '#fff', fontWeight: '600'},
});
