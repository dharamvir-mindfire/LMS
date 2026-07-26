import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Course, Subject } from '../types';
import * as SubjectService from '../api/SubjectService';
import * as CourseService from '../api/CourseService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

export function Subjects() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Subject | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [courseId, setCourseId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    setLoading(true);
    Promise.all([SubjectService.listSubjects(), CourseService.listCourses()])
      .then(([subjectList, courseList]) => {
        setSubjects(subjectList);
        setCourses(courseList);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load subjects')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setCourseId(courses[0]?._id ?? '');
    setName('');
    setDescription('');
    setShowForm(true);
  }

  function openEdit(subject: Subject) {
    setEditing(subject);
    setCourseId(typeof subject.course === 'string' ? subject.course : subject.course._id);
    setName(subject.name);
    setDescription(subject.description ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await SubjectService.updateSubject(editing._id, courseId, name, description);
      } else {
        await SubjectService.createSubject(courseId, name, description);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save subject'));
    }
  }

  async function handleDelete(subject: Subject) {
    if (!window.confirm(`Delete subject "${subject.name}"?`)) return;
    try {
      await SubjectService.deleteSubject(subject._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete subject'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Subjects</h1>
        <button className="btn btn-primary" onClick={openCreate} disabled={courses.length === 0}>
          New subject
        </button>
      </div>

      {courses.length === 0 && <p className="form-error">Create a course first.</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: 'name', header: 'Name', render: (s) => s.name },
            {
              key: 'course',
              header: 'Course',
              render: (s) => (typeof s.course === 'string' ? s.course : s.course.title),
            },
            { key: 'slug', header: 'Slug', render: (s) => s.slug },
            {
              key: 'actions',
              header: '',
              render: (s) => (
                <div className="table-actions">
                  <button className="btn btn-sm" onClick={() => openEdit(s)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={subjects}
          rowKey={(s) => s._id}
          emptyMessage="No subjects yet."
        />
      )}

      {showForm && (
        <Modal title={editing ? 'Edit subject' : 'New subject'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="subject-course">
                Course
              </label>
              <select
                id="subject-course"
                className="select"
                value={courseId}
                onChange={(e) => setCourseId(e.target.value)}
                required
              >
                {courses.map((c) => (
                  <option key={c._id} value={c._id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="subject-name">
                Name
              </label>
              <input
                id="subject-name"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="subject-description">
                Description
              </label>
              <textarea
                id="subject-description"
                className="textarea"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
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
    </div>
  );
}
