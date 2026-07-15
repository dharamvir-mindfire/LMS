import mongoose, { Document, Schema, Types } from 'mongoose';

export interface ILesson {
  _id: Types.ObjectId;
  title: string;
  content: string;
  videoUrl: string;
  order: number;
}

export interface ICourse extends Document {
  title: string;
  description: string;
  instructor: Types.ObjectId;
  lessons: ILesson[];
  students: Types.ObjectId[];
  published: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const lessonSchema = new Schema<ILesson>(
  {
    title: { type: String, required: true },
    content: { type: String, default: '' },
    videoUrl: { type: String, default: '' },
    order: { type: Number, default: 0 },
  },
  { _id: true }
);

const courseSchema = new Schema<ICourse>(
  {
    title: { type: String, required: true },
    description: { type: String, default: '' },
    instructor: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    lessons: [lessonSchema],
    students: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    published: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export default mongoose.model<ICourse>('Course', courseSchema);
