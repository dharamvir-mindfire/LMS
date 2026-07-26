import {useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import {navigationRef} from '../navigation/navigationRef';
import {extractErrorMessage} from '../api/client';
import {getLessons} from '../api/lessonsService';
import {getQuizzes} from '../api/quizzesService';
import Loader from '../components/Loader';
import colors from '../theme/colors';
import type {LessonListItem, QuizListItem} from '../types';

type Props = NativeStackScreenProps<CoursesStackParamList, 'SubjectDetail'>;

type Tab = 'lessons' | 'quizzes';

export default function SubjectDetail({route, navigation}: Props) {
  const {subjectId} = route.params;
  const [tab, setTab] = useState<Tab>('lessons');
  const [lessons, setLessons] = useState<LessonListItem[]>([]);
  const [quizzes, setQuizzes] = useState<QuizListItem[]>([]);
  const [lessonsError, setLessonsError] = useState('');
  const [quizzesError, setQuizzesError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setLessonsError('');
    setQuizzesError('');
    Promise.allSettled([getLessons(subjectId), getQuizzes(subjectId)]).then(([lessonsResult, quizzesResult]) => {
      if (lessonsResult.status === 'fulfilled') {
        setLessons(lessonsResult.value);
      } else {
        setLessonsError(extractErrorMessage(lessonsResult.reason, 'Failed to load lessons'));
      }
      if (quizzesResult.status === 'fulfilled') {
        setQuizzes(quizzesResult.value);
      } else {
        setQuizzesError(extractErrorMessage(quizzesResult.reason, 'Failed to load quizzes'));
      }
      setLoading(false);
    });
  }, [subjectId]);

  function openQuiz(quiz: QuizListItem) {
    navigationRef.navigate('QuizPlay', {quizId: quiz._id, quizTitle: quiz.title});
  }

  return (
    <View style={styles.container}>
      <View style={styles.tabBar}>
        <Pressable style={styles.tab} onPress={() => setTab('lessons')}>
          <Text style={[styles.tabLabel, tab === 'lessons' && styles.tabLabelActive]}>Lessons</Text>
          {tab === 'lessons' && <View style={styles.tabIndicator} />}
        </Pressable>
        <Pressable style={styles.tab} onPress={() => setTab('quizzes')}>
          <Text style={[styles.tabLabel, tab === 'quizzes' && styles.tabLabelActive]}>Quizzes</Text>
          {tab === 'quizzes' && <View style={styles.tabIndicator} />}
        </Pressable>
      </View>

      {loading ? (
        <Loader />
      ) : tab === 'lessons' ? (
        lessonsError ? (
          <Text style={styles.error}>{lessonsError}</Text>
        ) : (
          <FlatList
            data={lessons}
            keyExtractor={item => item._id}
            contentContainerStyle={styles.list}
            renderItem={({item}) => (
              <Pressable
                style={styles.card}
                onPress={() => navigation.navigate('LessonDetail', {lessonId: item._id, lessonTitle: item.title})}>
                <Text style={styles.cardTitle}>{item.title}</Text>
              </Pressable>
            )}
            ListEmptyComponent={<Text style={styles.muted}>No lessons for this subject yet.</Text>}
          />
        )
      ) : quizzesError ? (
        <Text style={styles.error}>{quizzesError}</Text>
      ) : (
        <FlatList
          data={quizzes}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.list}
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
  container: {flex: 1, backgroundColor: colors.background},
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
  },
  tabLabel: {color: colors.textMuted, fontWeight: '600'},
  tabLabelActive: {color: colors.purple},
  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    height: 2,
    width: '60%',
    backgroundColor: colors.purple,
    borderRadius: 1,
  },
  list: {padding: 16},
  muted: {color: colors.textMuted, padding: 16},
  error: {color: colors.danger, padding: 16},
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 16,
    marginBottom: 10,
  },
  cardTitle: {color: colors.text, fontSize: 16, fontWeight: '600'},
});
