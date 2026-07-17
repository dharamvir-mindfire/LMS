import {useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import {navigationRef} from '../navigation/navigationRef';
import client, {extractErrorMessage} from '../api/client';
import colors from '../theme/colors';
import type {QuizListItem} from '../types';

type Props = NativeStackScreenProps<CoursesStackParamList, 'SubjectQuizzes'>;

export default function SubjectQuizzes({route}: Props) {
  const {subjectId} = route.params;
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/quizzes', {params: {subject: subjectId}})
      .then(res => setQuizzes(res.data.quizzes))
      .catch(err => setError(extractErrorMessage(err, 'Failed to load quizzes')))
      .finally(() => setLoading(false));
  }, [subjectId]);

  function openQuiz(quiz: QuizListItem) {
    navigationRef.navigate('QuizPlay', {quizId: quiz._id, quizTitle: quiz.title});
  }

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Text style={styles.muted}>Loading...</Text>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <Pressable style={styles.card} onPress={() => openQuiz(item)}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <Text style={styles.muted}>{item.questions.length} questions</Text>
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No quizzes for this subject yet.</Text>}
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
