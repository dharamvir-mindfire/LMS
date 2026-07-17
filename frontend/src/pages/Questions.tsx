import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Difficulty, Question, Subject } from '../types';
import * as QuestionService from '../api/QuestionService';
import * as SubjectService from '../api/SubjectService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { BulkUploadQuestionsModal } from '../components/BulkUploadQuestionsModal';

const DIFFICULTIES: Difficulty[] = ['easy', 'medium', 'hard'];

export function Questions() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Question | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);

  const [subjectId, setSubjectId] = useState('');
  const [text, setText] = useState('');
  const [options, setOptions] = useState(['', '', '', '']);
  const [correctOptionIndex, setCorrectOptionIndex] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const [explanation, setExplanation] = useState('');

  function load() {
    setLoading(true);
    Promise.all([QuestionService.listQuestions(), SubjectService.listSubjects()])
      .then(([questionList, subjectList]) => {
        setQuestions(questionList);
        setSubjects(subjectList);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load questions')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setSubjectId(subjects[0]?._id ?? '');
    setText('');
    setOptions(['', '', '', '']);
    setCorrectOptionIndex(0);
    setDifficulty('medium');
    setExplanation('');
    setShowForm(true);
  }

  function openEdit(question: Question) {
    setEditing(question);
    setSubjectId(typeof question.subject === 'string' ? question.subject : question.subject._id);
    setText(question.text);
    setOptions([...question.options, '', '', '', ''].slice(0, 4));
    setCorrectOptionIndex(question.correctOptionIndex);
    setDifficulty(question.difficulty);
    setExplanation(question.explanation ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const cleanOptions = options.map((o) => o.trim()).filter(Boolean);
    const input = {
      subject: subjectId,
      text,
      options: cleanOptions,
      correctOptionIndex,
      difficulty,
      explanation,
    };
    try {
      if (editing) {
        await QuestionService.updateQuestion(editing._id, input);
      } else {
        await QuestionService.createQuestion(input);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save question'));
    }
  }

  async function handleDelete(question: Question) {
    if (!window.confirm('Delete this question?')) return;
    try {
      await QuestionService.deleteQuestion(question._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete question'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Questions</h1>
        <div className="table-actions">
          <button className="btn" onClick={() => setShowBulkUpload(true)}>
            Bulk upload
          </button>
          <button className="btn btn-primary" onClick={openCreate} disabled={subjects.length === 0}>
            New question
          </button>
        </div>
      </div>

      {subjects.length === 0 && <p className="form-error">Create a subject first.</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'text', header: 'Question', render: (q) => q.text },
            {
              key: 'subject',
              header: 'Subject',
              render: (q) => (typeof q.subject === 'string' ? q.subject : q.subject.name),
            },
            {
              key: 'difficulty',
              header: 'Difficulty',
              render: (q) => (
                <span
                  className={`badge ${
                    q.difficulty === 'easy'
                      ? 'badge-success'
                      : q.difficulty === 'hard'
                        ? 'badge-danger'
                        : 'badge-warning'
                  }`}
                >
                  {q.difficulty}
                </span>
              ),
            },
            {
              key: 'actions',
              header: '',
              render: (q) => (
                <div className="table-actions">
                  <button className="btn btn-sm" onClick={() => openEdit(q)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(q)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={questions}
          rowKey={(q) => q._id}
          emptyMessage="No questions yet."
        />
      )}

      {showForm && (
        <Modal title={editing ? 'Edit question' : 'New question'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="question-subject">
                Subject
              </label>
              <select
                id="question-subject"
                className="select"
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                required
              >
                {subjects.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="question-text">
                Question text
              </label>
              <textarea
                id="question-text"
                className="textarea"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={2}
                required
              />
            </div>
            {options.map((option, index) => (
              <div className="form-group" key={index}>
                <label className="label" htmlFor={`question-option-${index}`}>
                  Option {index + 1}
                </label>
                <input
                  id={`question-option-${index}`}
                  className="input"
                  value={option}
                  onChange={(e) => {
                    const next = [...options];
                    next[index] = e.target.value;
                    setOptions(next);
                  }}
                />
              </div>
            ))}
            <div className="form-group">
              <label className="label" htmlFor="question-correct">
                Correct option
              </label>
              <select
                id="question-correct"
                className="select"
                value={correctOptionIndex}
                onChange={(e) => setCorrectOptionIndex(Number(e.target.value))}
              >
                {options.map((_, index) => (
                  <option key={index} value={index}>
                    Option {index + 1}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="question-difficulty">
                Difficulty
              </label>
              <select
                id="question-difficulty"
                className="select"
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as Difficulty)}
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="question-explanation">
                Explanation (optional)
              </label>
              <textarea
                id="question-explanation"
                className="textarea"
                value={explanation}
                onChange={(e) => setExplanation(e.target.value)}
                rows={2}
              />
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary">
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showBulkUpload && (
        <BulkUploadQuestionsModal
          subjects={subjects}
          onClose={() => setShowBulkUpload(false)}
          onUploaded={() => {
            setShowBulkUpload(false);
            load();
          }}
        />
      )}
    </div>
  );
}
