import {useCallback, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../navigation/HomeStack';
import {navigationRef} from '../navigation/navigationRef';
import client, {extractErrorMessage} from '../api/client';
import colors from '../theme/colors';
import type {HomeStats, QuizListItem} from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'Home'>;

const QUIZ_PREVIEW_COUNT = 3;

export default function Home({navigation}: Props) {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [stats, setStats] = useState<HomeStats | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      Promise.all([client.get('/quizzes'), client.get('/home/stats')])
        .then(([quizzesRes, statsRes]) => {
          setQuizzes(quizzesRes.data.quizzes);
          setStats(statsRes.data.stats);
        })
        .catch(err =>
          setError(extractErrorMessage(err, 'Failed to load home data')),
        )
        .finally(() => setLoading(false));
    }, []),
  );

  function openQuiz(quiz: QuizListItem) {
    navigationRef.navigate('QuizPlay', {
      quizId: quiz._id,
      quizTitle: quiz.title,
    });
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : (
        <>
          <Text style={styles.title}>Welcome to the LMS App!</Text>
          {stats && (
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.questionsAnswered}</Text>
                <Text style={styles.statLabel}>Questions Answered</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.quizzes}</Text>
                <Text style={styles.statLabel}>Quizzes</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.subjects}</Text>
                <Text style={styles.statLabel}>Subjects</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{stats.courses}</Text>
                <Text style={styles.statLabel}>Courses</Text>
              </View>
            </View>
          )}

          <View style={styles.sectionHeader}>
            <Text style={styles.title}>Quizzes</Text>
            {quizzes.length > QUIZ_PREVIEW_COUNT && (
              <Pressable onPress={() => navigation.navigate('AllQuizzes')}>
                <Text style={styles.viewAll}>View All</Text>
              </Pressable>
            )}
          </View>
          <FlatList
            data={quizzes.slice(0, QUIZ_PREVIEW_COUNT)}
            keyExtractor={item => item._id}
            renderItem={({item}) => (
              <Pressable style={styles.card} onPress={() => openQuiz(item)}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.muted}>
                  {item.subjects.map(s => s.name).join(', ')}
                </Text>
              </Pressable>
            )}
            ListEmptyComponent={
              <Text style={styles.muted}>No quizzes yet.</Text>
            }
          />
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: 16,
    gap: 12,
  },
  title: {color: colors.text, fontSize: 24, fontWeight: '700'},
  muted: {color: colors.textMuted},
  error: {color: colors.danger},
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flexBasis: '47%',
    flexGrow: 1,
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  statValue: {color: colors.text, fontSize: 22, fontWeight: '700'},
  statLabel: {color: colors.textMuted, marginTop: 4},
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAll: {color: colors.purple, fontWeight: '600'},
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {color: colors.text, fontSize: 16, fontWeight: '600'},
});
