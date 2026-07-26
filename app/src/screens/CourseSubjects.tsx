import {useEffect, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import client, {extractErrorMessage} from '../api/client';
import Loader from '../components/Loader';
import colors from '../theme/colors';
import type {Subject} from '../types';

type Props = NativeStackScreenProps<CoursesStackParamList, 'CourseSubjects'>;

export default function CourseSubjects({route, navigation}: Props) {
  const {courseId} = route.params;
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client
      .get('/subjects', {params: {course: courseId}})
      .then(res => setSubjects(res.data.subjects))
      .catch(err => setError(extractErrorMessage(err, 'Failed to load subjects')))
      .finally(() => setLoading(false));
  }, [courseId]);

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={subjects}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('SubjectQuizzes', {subjectId: item._id, subjectName: item.name})}>
              <Text style={styles.cardTitle}>{item.name}</Text>
              {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No subjects in this course yet.</Text>}
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
