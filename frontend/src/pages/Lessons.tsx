import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import type { Lesson, LessonMaterial, Subject } from '../types';
import * as LessonService from '../api/LessonService';
import * as SubjectService from '../api/SubjectService';
import { apiErrorMessage } from '../api/client';
import { DataTable } from '../components/DataTable';
import { Modal } from '../components/Modal';
import { Spinner } from '../components/Spinner';

export function Lessons() {
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<Lesson | null>(null);
  const [showForm, setShowForm] = useState(false);

  const [subjectId, setSubjectId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [materials, setMaterials] = useState<LessonMaterial[]>([]);
  const [order, setOrder] = useState(0);

  function load() {
    setLoading(true);
    Promise.all([LessonService.listLessons(), SubjectService.listSubjects()])
      .then(([lessonList, subjectList]) => {
        setLessons(lessonList);
        setSubjects(subjectList);
      })
      .catch((err) => setError(apiErrorMessage(err, 'Failed to load lessons')))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function openCreate() {
    setEditing(null);
    setSubjectId(subjects[0]?._id ?? '');
    setTitle('');
    setContent('');
    setVideoUrl('');
    setMaterials([]);
    setOrder(0);
    setShowForm(true);
  }

  function openEdit(lesson: Lesson) {
    setEditing(lesson);
    setSubjectId(typeof lesson.subject === 'string' ? lesson.subject : lesson.subject._id);
    setTitle(lesson.title);
    setContent(lesson.content ?? '');
    setVideoUrl(lesson.videoUrl ?? '');
    setMaterials(lesson.materials);
    setOrder(lesson.order);
    setShowForm(true);
  }

  function addMaterial() {
    setMaterials((prev) => [...prev, { title: '', url: '' }]);
  }

  function updateMaterial(index: number, field: 'title' | 'url', value: string) {
    setMaterials((prev) => prev.map((m, i) => (i === index ? { ...m, [field]: value } : m)));
  }

  function removeMaterial(index: number) {
    setMaterials((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    const cleanMaterials = materials
      .map((m) => ({ title: m.title.trim(), url: m.url.trim() }))
      .filter((m) => m.title && m.url);
    const input = {
      subject: subjectId,
      title,
      content,
      videoUrl,
      materials: cleanMaterials,
      order,
    };
    try {
      if (editing) {
        await LessonService.updateLesson(editing._id, input);
      } else {
        await LessonService.createLesson(input);
      }
      setShowForm(false);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to save lesson'));
    }
  }

  async function handleDelete(lesson: Lesson) {
    if (!window.confirm('Delete this lesson?')) return;
    try {
      await LessonService.deleteLesson(lesson._id);
      load();
    } catch (err) {
      setError(apiErrorMessage(err, 'Failed to delete lesson'));
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1>Lessons</h1>
        <button className="btn btn-primary" onClick={openCreate} disabled={subjects.length === 0}>
          New lesson
        </button>
      </div>

      {subjects.length === 0 && <p className="form-error">Create a subject first.</p>}
      {error && <p className="form-error">{error}</p>}
      {loading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: 'title', header: 'Title', render: (l) => l.title },
            {
              key: 'subject',
              header: 'Subject',
              render: (l) => (typeof l.subject === 'string' ? l.subject : l.subject.name),
            },
            {
              key: 'video',
              header: 'Video',
              render: (l) => (l.videoUrl ? <span className="badge badge-success">Yes</span> : '—'),
            },
            { key: 'materials', header: 'Materials', render: (l) => l.materials.length },
            {
              key: 'actions',
              header: '',
              render: (l) => (
                <div className="table-actions">
                  <button className="btn btn-sm" onClick={() => openEdit(l)}>
                    Edit
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(l)}>
                    Delete
                  </button>
                </div>
              ),
            },
          ]}
          rows={lessons}
          rowKey={(l) => l._id}
          emptyMessage="No lessons yet."
        />
      )}

      {showForm && (
        <Modal title={editing ? 'Edit lesson' : 'New lesson'} onClose={() => setShowForm(false)}>
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="label" htmlFor="lesson-subject">
                Subject
              </label>
              <select
                id="lesson-subject"
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
              <label className="label" htmlFor="lesson-title">
                Title
              </label>
              <input
                id="lesson-title"
                className="input"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="lesson-content">
                Content
              </label>
              <textarea
                id="lesson-content"
                className="textarea"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={5}
              />
            </div>
            <div className="form-group">
              <label className="label" htmlFor="lesson-video">
                Video URL (optional)
              </label>
              <input
                id="lesson-video"
                className="input"
                type="url"
                placeholder="https://..."
                value={videoUrl}
                onChange={(e) => setVideoUrl(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label className="label">Materials (optional)</label>
              {materials.map((material, index) => (
                <div key={index} style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <input
                    className="input"
                    style={{ flex: 1 }}
                    placeholder="Title"
                    value={material.title}
                    onChange={(e) => updateMaterial(index, 'title', e.target.value)}
                  />
                  <input
                    className="input"
                    style={{ flex: 2 }}
                    placeholder="https://..."
                    value={material.url}
                    onChange={(e) => updateMaterial(index, 'url', e.target.value)}
                  />
                  <button type="button" className="btn btn-sm btn-danger" onClick={() => removeMaterial(index)}>
                    Remove
                  </button>
                </div>
              ))}
              <button type="button" className="btn btn-sm" onClick={addMaterial}>
                + Add material
              </button>
            </div>
            <div className="form-group">
              <label className="label" htmlFor="lesson-order">
                Order
              </label>
              <input
                id="lesson-order"
                className="input"
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
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
