import type { Difficulty } from '../types';

export interface ParsedQuestionRow {
  subjectName: string;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  explanation: string;
}

function toDifficulty(value: string): Difficulty {
  return value === 'easy' || value === 'hard' ? value : 'medium';
}

function parseCsvLines(csv: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < csv.length; i++) {
    const char = csv[i];
    if (inQuotes) {
      if (char === '"' && csv[i + 1] === '"') {
        field += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && csv[i + 1] === '\n') i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }
  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows.filter((r) => r.some((cell) => cell.trim().length > 0));
}

// Expected columns: subject,text,optionA,optionB,optionC,optionD,correctOptionIndex,difficulty,explanation
export async function parseQuestionsCsv(file: File): Promise<ParsedQuestionRow[]> {
  const text = await file.text();
  const [header, ...rows] = parseCsvLines(text);
  if (!header) return [];

  const columnIndex = (name: string) => header.findIndex((h) => h.trim().toLowerCase() === name);

  const subjectIdx = columnIndex('subject');
  const textIdx = columnIndex('text');
  const optionIdxs = ['optiona', 'optionb', 'optionc', 'optiond'].map(columnIndex);
  const correctIdx = columnIndex('correctoptionindex');
  const difficultyIdx = columnIndex('difficulty');
  const explanationIdx = columnIndex('explanation');

  return rows
    .map((row) => ({
      subjectName: (row[subjectIdx] ?? '').trim(),
      text: (row[textIdx] ?? '').trim(),
      options: optionIdxs.map((idx) => (row[idx] ?? '').trim()).filter(Boolean),
      correctOptionIndex: Number(row[correctIdx] ?? 0),
      difficulty: toDifficulty((row[difficultyIdx] ?? '').trim()),
      explanation: (row[explanationIdx] ?? '').trim(),
    }))
    .filter((row) => row.subjectName && row.text && row.options.length >= 2);
}
