import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Question, Quiz, Subject } from '../types';
import * as QuizService from '../api/QuizService';
import * as SubjectService from '../api/SubjectService';
import * as QuestionService from '../api/QuestionService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';

export function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [questionIds, setQuestionIds] = useState<string[]>([]);

  function load() {
    setLoading(true);
    Promise.all([QuizService.listQuizzes(), SubjectService.listSubjects(), QuestionService.listQuestions()])
      .then(([quizList, subjectList, questionList]) => {
        setQuizzes(quizList);
        setSubjects(subjectList);
        setQuestions(questionList);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load quizzes')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const questionsForSubject = questions.filter(
    (q) => (typeof q.subject === 'string' ? q.subject : q.subject._id) === subjectId
  );

  function openCreate() {
    setEditing(null);
    setTitle('');
    setSubjectId(subjects[0]?._id ?? '');
    setQuestionIds([]);
    setShowForm(true);
  }

  function openEdit(quiz: Quiz) {
    setEditing(quiz);
    setTitle(quiz.title);
    setSubjectId(typeof quiz.subject === 'string' ? quiz.subject : quiz.subject._id);
    setQuestionIds(quiz.questions);
    setShowForm(true);
  }

  function toggleQuestion(id: string) {
    setQuestionIds((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await QuizService.updateQuiz(editing._id, title, subjectId, questionIds);
      } else {
        await QuizService.createQuiz(title, subjectId, questionIds);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save quiz'));
    }
  }

  async function handleDelete(quiz: Quiz) {
    if (!window.confirm(`Delete quiz "${quiz.title}"?`)) return;
    try {
      await QuizService.deleteQuiz(quiz._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete quiz'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Quizzes</h1>
        <button className="btn btn-primary" onClick={openCreate} disabled={subjects.length === 0}>
          New quiz
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title', render: (q) => q.title },
            {
              key: 'subject',
              header: 'Subject',
              render: (q) => (typeof q.subject === 'string' ? q.subject : q.subject.name),
            },
            { key: 'questions', header: 'Questions', render: (q) => q.questions.length },
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
          rows={quizzes}
          rowKey={(q) => q._id}
          emptyMessage="No quizzes yet."
        />
      )}

      {showForm && (
        <Modal title={editing ? 'Edit quiz' : 'New quiz'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="quiz-title">
                Title
              </label>
              <input
                id="quiz-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="quiz-subject">
                Subject
              </label>
              <select
                id="quiz-subject"
                className="select"
                value={subjectId}
                onChange={(e) => {
                  setSubjectId(e.target.value);
                  setQuestionIds([]);
                }}
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
              <label className="label">Questions</label>
              {questionsForSubject.length === 0 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  No questions for this subject yet.
                </p>
              )}
              {questionsForSubject.map((q) => (
                <label key={q._id} style={{ display: 'flex', gap: '0.5rem', fontSize: '0.85rem' }}>
                  <input
                    type="checkbox"
                    checked={questionIds.includes(q._id)}
                    onChange={() => toggleQuestion(q._id)}
                  />
                  {q.text}
                </label>
              ))}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={questionIds.length === 0}>
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
