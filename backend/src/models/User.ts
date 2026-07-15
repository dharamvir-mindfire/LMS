import mongoose, { Document, Schema } from 'mongoose';

export type UserRole = 'admin' | 'instructor' | 'student';

export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role: { type: String, enum: ['admin', 'instructor', 'student'], default: 'student' },
  },
  { timestamps: true }
);

export default mongoose.model<IUser>('User', userSchema);
