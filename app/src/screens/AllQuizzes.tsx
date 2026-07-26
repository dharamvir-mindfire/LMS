import {useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {HomeStackParamList} from '../navigation/HomeStack';
import {navigationRef} from '../navigation/navigationRef';
import {extractErrorMessage} from '../api/client';
import {getQuizzes} from '../api/quizzesService';
import Loader from '../components/Loader';
import colors from '../theme/colors';
import type {QuizListItem} from '../types';

type Props = NativeStackScreenProps<HomeStackParamList, 'AllQuizzes'>;

export default function AllQuizzes({}: Props) {
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getQuizzes()
      .then(setQuizzes)
      .catch(err => setError(extractErrorMessage(err, 'Failed to load quizzes')))
      .finally(() => setLoading(false));
  }, []);

  function openQuiz(quiz: QuizListItem) {
    navigationRef.navigate('QuizPlay', {quizId: quiz._id, quizTitle: quiz.title});
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => openQuiz(item)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.subjects.map(s => s.name).join(', ')}</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No quizzes yet.</Text>}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: 16, gap: 12},
  muted: {color: colors.textMuted},
  error: {color: colors.danger},
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {color: colors.text, fontSize: 16, fontWeight: '600'},
});
