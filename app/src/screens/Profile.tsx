import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {ProfileStackParamList} from '../navigation/ProfileStack';
import {useAuth} from '../context/AuthContext';
import {achievements} from '../data/achievements';
import colors from '../theme/colors';

type Props = NativeStackScreenProps<ProfileStackParamList, 'Profile'>;

export default function Profile({navigation}: Props) {
  const {user, logout} = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{user?.name}</Text>
      <Text style={styles.muted}>{user?.email}</Text>
      <Text style={styles.muted}>Questions answered: {user?.questionsAnswered ?? 0}</Text>

      <Pressable style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
        <Text style={styles.menuItemText}>Settings</Text>
      </Pressable>
      <Pressable style={styles.menuItem} onPress={() => navigation.navigate('ChangePassword')}>
        <Text style={styles.menuItemText}>{user?.hasPassword ? 'Change Password' : 'Set Password'}</Text>
      </Pressable>

      <Text style={styles.sectionTitle}>Achievements</Text>
      <FlatList
        data={achievements}
        keyExtractor={item => item.id}
        renderItem={({item}) => {
          const unlocked = (user?.questionsAnswered ?? 0) >= item.minQuestionsAnswered;
          return (
            <View style={[styles.achievement, unlocked && styles.achievementUnlocked]}>
              <Text style={styles.achievementTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.description}</Text>
            </View>
          );
        }}
      />

      <Pressable style={styles.logout} onPress={logout}>
        <Text style={styles.logoutText}>Logout</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: 16, gap: 8},
  title: {color: colors.text, fontSize: 22, fontWeight: '700'},
  muted: {color: colors.textMuted},
  sectionTitle: {color: colors.text, fontSize: 16, fontWeight: '600', marginTop: 16, marginBottom: 8},
  menuItem: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: {color: colors.text, fontWeight: '600'},
  achievement: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
    opacity: 0.5,
  },
  achievementUnlocked: {
    opacity: 1,
    borderColor: colors.purple,
    borderWidth: 1,
  },
  achievementTitle: {color: colors.text, fontWeight: '600'},
  logout: {
    backgroundColor: colors.danger,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  logoutText: {color: '#fff', fontWeight: '600'},
});
