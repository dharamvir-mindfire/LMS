import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Course, Question, Quiz, Subject } from '../types';
import * as QuizService from '../api/QuizService';
import * as CourseService from '../api/CourseService';
import * as SubjectService from '../api/SubjectService';
import * as QuestionService from '../api/QuestionService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

function idOf(value: { _id: string } | string): string {
  return typeof value === 'string' ? value : value._id;
}

export function Quizzes() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Quiz | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [title, setTitle] = useState('');
  const [courseIds, setCourseIds] = useState<string[]>([]);
  const [subjectIds, setSubjectIds] = useState<string[]>([]);
  const [questionIds, setQuestionIds] = useState<string[]>([]);

  function load() {
    setLoading(true);
    Promise.all([
      QuizService.listQuizzes(),
      CourseService.listCourses(),
      SubjectService.listSubjects(),
      QuestionService.listQuestions(),
    ])
      .then(([quizList, courseList, subjectList, questionList]) => {
        setQuizzes(quizList);
        setCourses(courseList);
        setSubjects(subjectList);
        setQuestions(questionList);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load quizzes')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  const subjectsForCourses = subjects.filter((s) => courseIds.includes(idOf(s.course)));
  const questionsForSubjects = questions.filter((q) => subjectIds.includes(idOf(q.subject)));
  const allQuestionsSelected =
    questionsForSubjects.length > 0 && questionsForSubjects.every((q) => questionIds.includes(q._id));

  function openCreate() {
    setEditing(null);
    setTitle('');
    setCourseIds([]);
    setSubjectIds([]);
    setQuestionIds([]);
    setShowForm(true);
  }

  function openEdit(quiz: Quiz) {
    setEditing(quiz);
    setTitle(quiz.title);
    const quizSubjectIds = quiz.subjects.map(idOf);
    setSubjectIds(quizSubjectIds);
    setCourseIds(
      Array.from(
        new Set(
          subjects.filter((s) => quizSubjectIds.includes(s._id)).map((s) => idOf(s.course))
        )
      )
    );
    setQuestionIds(quiz.questions);
    setShowForm(true);
  }

  function toggleCourse(id: string) {
    setCourseIds((prev) => {
      const next = prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id];
      const allowedSubjectIds = subjects.filter((s) => next.includes(idOf(s.course))).map((s) => s._id);
      setSubjectIds((prevSubjects) => prevSubjects.filter((sId) => allowedSubjectIds.includes(sId)));
      return next;
    });
  }

  function toggleSubject(id: string) {
    setSubjectIds((prev) => {
      const next = prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id];
      const allowedQuestionIds = questions
        .filter((q) => next.includes(idOf(q.subject)))
        .map((q) => q._id);
      setQuestionIds((prevQuestions) => prevQuestions.filter((qId) => allowedQuestionIds.includes(qId)));
      return next;
    });
  }

  function toggleQuestion(id: string) {
    setQuestionIds((prev) => (prev.includes(id) ? prev.filter((q) => q !== id) : [...prev, id]));
  }

  function toggleSelectAllQuestions() {
    setQuestionIds((prev) => {
      const availableIds = questionsForSubjects.map((q) => q._id);
      const allSelected = availableIds.length > 0 && availableIds.every((id) => prev.includes(id));
      if (allSelected) {
        return prev.filter((id) => !availableIds.includes(id));
      }
      return Array.from(new Set([...prev, ...availableIds]));
    });
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await QuizService.updateQuiz(editing._id, title, subjectIds, questionIds);
      } else {
        await QuizService.createQuiz(title, subjectIds, questionIds);
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
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title', render: (q) => q.title },
            {
              key: 'subjects',
              header: 'Subjects',
              render: (q) =>
                q.subjects
                  .map((s) => (typeof s === 'string' ? subjects.find((sub) => sub._id === s)?.name ?? s : s.name))
                  .join(', '),
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
              <label className="label">Courses</label>
              {courses.length === 0 && <p className="checkbox-list-empty">No courses yet.</p>}
              <div className="checkbox-list">
                {courses.map((c) => (
                  <label key={c._id}>
                    <input
                      type="checkbox"
                      checked={courseIds.includes(c._id)}
                      onChange={() => toggleCourse(c._id)}
                    />
                    {c.title}
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label className="label">Subjects</label>
              {subjectsForCourses.length === 0 && (
                <p className="checkbox-list-empty">Select a course to see its subjects.</p>
              )}
              {subjectsForCourses.length > 0 && (
                <div className="checkbox-list">
                  {subjectsForCourses.map((s) => (
                    <label key={s._id}>
                      <input
                        type="checkbox"
                        checked={subjectIds.includes(s._id)}
                        onChange={() => toggleSubject(s._id)}
                      />
                      {s.name}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="form-group">
              <div className="page-header" style={{ marginBottom: 0 }}>
                <label className="label">Questions</label>
                {questionsForSubjects.length > 0 && (
                  <button type="button" className="btn btn-sm" onClick={toggleSelectAllQuestions}>
                    {allQuestionsSelected ? 'Deselect all' : 'Select all'}
                  </button>
                )}
              </div>
              {questionsForSubjects.length === 0 && (
                <p className="checkbox-list-empty">Select at least one subject to see its questions.</p>
              )}
              {questionsForSubjects.length > 0 && (
                <div className="checkbox-list">
                  {questionsForSubjects.map((q) => (
                    <label key={q._id}>
                      <input
                        type="checkbox"
                        checked={questionIds.includes(q._id)}
                        onChange={() => toggleQuestion(q._id)}
                      />
                      {q.text}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn" onClick={() => setShowForm(false)}>
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={subjectIds.length === 0 || questionIds.length === 0}
              >
                Save
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
