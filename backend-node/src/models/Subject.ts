import mongoose, { Document, Schema, Types } from "mongoose";
import { slugify } from "../utils/Slugify";

export interface ISubject extends Document {
  course: Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    course: { type: Schema.Types.ObjectId, ref: "Course", required: true },
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, default: "" },
  },
  { timestamps: true }
);

function assignSlug(this: ISubject, next: () => void): void {
  if (this.isModified("name") || !this.slug) {
    this.slug = slugify(this.name);
  }
  next();
}

subjectSchema.pre("validate", assignSlug);

export default mongoose.model<ISubject>("Subject", subjectSchema);
