import {useCallback, useState} from 'react';
import {FlatList, Pressable, StyleSheet, Text, View} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import {extractErrorMessage} from '../api/client';
import {getCourses} from '../api/coursesService';
import Loader from '../components/Loader';
import colors from '../theme/colors';
import type {Course} from '../types';

type Props = NativeStackScreenProps<CoursesStackParamList, 'Courses'>;

export default function Courses({navigation}: Props) {
  const [courses, setCourses] = useState<Course[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      getCourses()
        .then(setCourses)
        .catch(err => setError(extractErrorMessage(err, 'Failed to load courses')))
        .finally(() => setLoading(false));
    }, []),
  );

  return (
    <View style={styles.container}>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading ? (
        <Loader />
      ) : (
        <FlatList
          data={courses}
          keyExtractor={item => item._id}
          renderItem={({item}) => (
            <Pressable
              style={styles.card}
              onPress={() => navigation.navigate('CourseSubjects', {courseId: item._id, courseTitle: item.title})}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              {item.description ? <Text style={styles.muted}>{item.description}</Text> : null}
            </Pressable>
          )}
          ListEmptyComponent={<Text style={styles.muted}>No courses yet.</Text>}
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
