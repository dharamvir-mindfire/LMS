import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Course } from '../types';
import * as CourseService from '../api/CourseService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';

export function Courses() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Course | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  function load() {
    setLoading(true);
    CourseService.listCourses()
      .then(setCourses)
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load courses')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setTitle('');
    setDescription('');
    setShowForm(true);
  }

  function openEdit(course: Course) {
    setEditing(course);
    setTitle(course.title);
    setDescription(course.description ?? '');
    setShowForm(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    try {
      if (editing) {
        await CourseService.updateCourse(editing._id, title, description);
      } else {
        await CourseService.createCourse(title, description);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save course'));
    }
  }

  async function handleDelete(course: Course) {
    if (!window.confirm(`Delete course "${course.title}"?`)) return;
    try {
      await CourseService.deleteCourse(course._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete course'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Courses</h1>
        <button className="btn btn-primary" onClick={openCreate}>
          New course
        </button>
      </div>

      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <p>Loading...</p>
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title', render: (c) => c.title },
            { key: 'description', header: 'Description', render: (c) => c.description || '—' },
            {
              key: 'actions',
              header: '',
              render: (c) => (
                <div className="table-actions">
                  <button className="btn btn-sm" onClick={() => openEdit(c)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(c)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={courses}
          rowKey={(c) => c._id}
          emptyMessage="No courses yet."
        />
      )}

      {showForm && (
        <Modal title={editing ? 'Edit course' : 'New course'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="course-title">
                Title
              </label>
              <input
                id="course-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="course-description">
                Description
              </label>
              <textarea
                id="course-description"
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
