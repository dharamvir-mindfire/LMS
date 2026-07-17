import {useEffect, useState} from 'react';
import {ScrollView, StyleSheet, Text, View} from 'react-native';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {RootStackParamList} from '../navigation/RootNavigator';
import client, {extractErrorMessage} from '../api/client';
import QuestionCard from '../components/QuestionCard';
import colors from '../theme/colors';
import type {Question, QuizResultQuestion} from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'QuizPlay'>;

interface QuizResult {
  score: number;
  total: number;
  correctCount: number;
  results: QuizResultQuestion[];
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
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>{quizTitle}</Text>
        <Text style={styles.resultText}>
          Score: {result.score} / {result.total}
        </Text>
        {result.results.map((item, index) => (
          <View key={item.question} style={styles.resultCard}>
            <Text style={styles.resultQuestionText}>
              {index + 1}. {item.text}
            </Text>
            {item.options.map((option, optionIndex) => {
              const isCorrectOption = optionIndex === item.correctOptionIndex;
              const isSelectedOption = optionIndex === item.selectedOptionIndex;
              return (
                <View
                  key={optionIndex}
                  style={[
                    styles.resultOption,
                    isCorrectOption && styles.resultOptionCorrect,
                    isSelectedOption && !isCorrectOption && styles.resultOptionIncorrect,
                  ]}>
                  <Text style={styles.resultOptionText}>{option}</Text>
                  {isSelectedOption ? <Text style={styles.resultOptionTag}>Your answer</Text> : null}
                  {isCorrectOption ? <Text style={styles.resultOptionTag}>Correct answer</Text> : null}
                </View>
              );
            })}
            <Text style={item.isCorrect ? styles.correctLabel : styles.incorrectLabel}>
              {item.isCorrect ? 'Correct' : 'Incorrect'}
            </Text>
            {item.explanation ? <Text style={styles.explanation}>{item.explanation}</Text> : null}
          </View>
        ))}
      </ScrollView>
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
  resultText: {color: colors.text, fontSize: 18, marginBottom: 8},
  submit: {
    color: '#fff',
    backgroundColor: colors.purple,
    borderRadius: 8,
    padding: 14,
    textAlign: 'center',
    fontWeight: '600',
    marginVertical: 16,
  },
  resultCard: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 8,
  },
  resultQuestionText: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  resultOption: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  resultOptionCorrect: {
    borderColor: colors.success,
    backgroundColor: '#1c3a2a',
  },
  resultOptionIncorrect: {
    borderColor: colors.danger,
    backgroundColor: '#3a1c1c',
  },
  resultOptionText: {
    color: colors.text,
    flex: 1,
  },
  resultOptionTag: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  correctLabel: {
    color: colors.success,
    fontWeight: '700',
  },
  incorrectLabel: {
    color: colors.danger,
    fontWeight: '700',
  },
  explanation: {
    color: colors.textMuted,
    fontSize: 13,
    lineHeight: 18,
  },
});
