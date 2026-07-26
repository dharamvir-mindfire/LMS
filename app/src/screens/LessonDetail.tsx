import {useEffect, useState} from 'react';
import {Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View} from 'react-native';
import {useVideoPlayer, VideoView} from 'expo-video';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {CoursesStackParamList} from '../navigation/CoursesStack';
import {extractErrorMessage} from '../api/client';
import {getLesson} from '../api/lessonsService';
import Loader from '../components/Loader';
import colors from '../theme/colors';
import type {Lesson} from '../types';

type Props = NativeStackScreenProps<CoursesStackParamList, 'LessonDetail'>;

function openLink(url: string) {
  Linking.openURL(url).catch(() => Alert.alert('Could not open link', url));
}

export default function LessonDetail({route, navigation}: Props) {
  const {lessonId} = route.params;
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const player = useVideoPlayer(lesson?.videoUrl || null, playerInstance => {
    playerInstance.loop = false;
  });

  useEffect(() => {
    const unsubscribe = navigation.addListener('blur', () => player.pause());
    return unsubscribe;
  }, [navigation, player]);

  useEffect(() => {
    getLesson(lessonId)
      .then(setLesson)
      .catch(err => setError(extractErrorMessage(err, 'Failed to load lesson')))
      .finally(() => setLoading(false));
  }, [lessonId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <Loader label="Loading lesson..." />
      </View>
    );
  }

  if (error || !lesson) {
    return (
      <View style={styles.container}>
        <Text style={styles.error}>{error || 'Lesson not found'}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {lesson.videoUrl ? (
        <View style={styles.videoSection}>
          <VideoView style={styles.video} player={player} allowsFullscreen allowsPictureInPicture contentFit="contain" />
          <Pressable onPress={() => openLink(lesson.videoUrl)}>
            <Text style={styles.openExternalLink}>Open video in browser</Text>
          </Pressable>
        </View>
      ) : null}

      {lesson.content ? <Text style={styles.body}>{lesson.content}</Text> : null}

      {lesson.materials.length > 0 && (
        <View style={styles.materialsSection}>
          <Text style={styles.sectionTitle}>Materials</Text>
          {lesson.materials.map(material => (
            <Pressable
              key={material.url}
              style={styles.materialCard}
              onPress={() => navigation.navigate('MaterialViewer', {url: material.url, title: material.title})}>
              <Text style={styles.materialTitle}>{material.title}</Text>
            </Pressable>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: 16},
  content: {gap: 16, paddingBottom: 25},
  error: {color: colors.danger},
  body: {color: colors.text, fontSize: 15, lineHeight: 22},
  videoSection: {gap: 8},
  video: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
    backgroundColor: colors.surface,
  },
  openExternalLink: {color: colors.purple, fontWeight: '600', textAlign: 'center'},
  materialsSection: {gap: 10},
  sectionTitle: {color: colors.text, fontSize: 16, fontWeight: '600'},
  materialCard: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 14,
  },
  materialTitle: {color: colors.purple, fontWeight: '600'},
});
