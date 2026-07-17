import {Pressable, StyleSheet, Text, View} from 'react-native';
import colors from '../theme/colors';
import type {Question} from '../types';

interface QuestionCardProps {
  question: Question;
  selectedOptionIndex: number | null;
  onSelect: (index: number) => void;
}

export default function QuestionCard({question, selectedOptionIndex, onSelect}: QuestionCardProps) {
  return (
    <View style={styles.card}>
      <Text style={styles.text}>{question.text}</Text>
      {question.options.map((option, index) => (
        <Pressable
          key={index}
          style={[styles.option, selectedOptionIndex === index && styles.optionSelected]}
          onPress={() => onSelect(index)}>
          <Text style={styles.optionText}>{option}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 10,
  },
  text: {
    color: colors.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  option: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    padding: 12,
  },
  optionSelected: {
    borderColor: colors.purple,
    backgroundColor: colors.purpleDark,
  },
  optionText: {
    color: colors.text,
  },
});
