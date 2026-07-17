import { useState } from 'react';
import type { Subject } from '../types';
import { parseQuestionsCsv } from '../utils/ExcelQuestions';
import * as QuestionService from '../api/QuestionService';
import { apiErrorMessage } from '../api/client';
import { Modal } from './Modal';

export interface BulkUploadQuestionsModalProps {
  subjects: Subject[];
  onClose: () => void;
  onUploaded: () => void;
}

export function BulkUploadQuestionsModal({ subjects, onClose, onUploaded }: BulkUploadQuestionsModalProps) {
  const [count, setCount] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(false);

  async function handleFile(file: File) {
    setError('');
    try {
      const rows = await parseQuestionsCsv(file);
      setCount(rows.length);

      const subjectIdByName = new Map(subjects.map((s) => [s.name.toLowerCase(), s._id]));
      const unmatched = rows.filter((row) => !subjectIdByName.has(row.subjectName.toLowerCase()));
      if (unmatched.length > 0) {
        setError(`${unmatched.length} row(s) reference a subject name that doesn't exist yet.`);
        return;
      }

      setUploading(true);
      for (const row of rows) {
        await QuestionService.createQuestion({
          subject: subjectIdByName.get(row.subjectName.toLowerCase())!,
          text: row.text,
          options: row.options,
          correctOptionIndex: row.correctOptionIndex,
          difficulty: row.difficulty,
          explanation: row.explanation,
        });
      }
      onUploaded();
    } catch (err) {
      setError(apiErrorMessage(err, 'Bulk upload failed'));
    } finally {
      setUploading(false);
    }
  }

  return (
    <Modal title="Bulk upload questions" onClose={onClose}>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        Upload a CSV with columns: subject, text, optionA, optionB, optionC, optionD,
        correctOptionIndex, difficulty, explanation.
      </p>
      <p style={{ fontSize: '0.85rem' }}>
        <a href="/sample-questions.csv" download>
          Download sample CSV
        </a>
      </p>
      <div className="form-group">
        <input
          className="input"
          type="file"
          accept=".csv"
          disabled={uploading}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
          }}
        />
      </div>
      {uploading && <p>Uploading...</p>}
      {count !== null && !error && !uploading && <p>Uploaded {count} question(s).</p>}
      {error && <p className="form-error">{error}</p>}
    </Modal>
  );
}
