import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/RootNavigator';
import client, {extractErrorMessage} from '../api/client';
import QuestionCard from '../components/QuestionCard';
import colors from '../theme/colors';
import type {Question} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizPlay'>;

interface QuizResult {
  score: number;
  total: number;
  correctCount: number;
}

export default function QuizPlay({route}: Props) {
  const {quizId, quizTitle} = route.params;
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [result, setResult] = useState<QuizResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    client
      .post(`/quizzes/${quizId}/start`)
      .then(res => setQuestions(res.data.quiz.questions))
      .catch(err => setError(extractErrorMessage(err, 'Failed to start quiz')))
      .finally(() => setLoading(false));
  }, [quizId]);

  function selectOption(questionId: string, index: number) {
    setAnswers(prev => ({...prev, [questionId]: index}));
  }

  async function submit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        answers: Object.entries(answers).map(([question, selectedOptionIndex]) => ({
          question,
          selectedOptionIndex,
        })),
      };
      const res = await client.post(`/quizzes/${quizId}/submit`, payload);
      setResult(res.data);
    } catch (err) {
      setError(extractErrorMessage(err, 'Failed to submit quiz'));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.muted}>Loading...</Text>
      </View>
    );
  }

  if (result) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{quizTitle}</Text>
        <Text style={styles.resultText}>
          Score: {result.score} / {result.total}
        </Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>{quizTitle}</Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {questions.map(question => (
        <QuestionCard
          key={question._id}
          question={question}
          selectedOptionIndex={answers[question._id] ?? null}
          onSelect={index => selectOption(question._id, index)}
        />
      ))}
      <Text style={styles.submit} onPress={submitting ? undefined : submit}>
        {submitting ? 'Submitting...' : 'Submit quiz'}
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background, padding: 16},
  content: {gap: 12},
  title: {color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8},
  muted: {color: colors.textMuted},
  error: {color: colors.danger},
  resultText: {color: colors.text, fontSize: 18},
  submit: {
    color: '#fff',
    backgroundColor: colors.purple,
    borderRadius: 8,
    padding: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 16,
  },
});
