import mongoose, { Document, Schema, Types } from "mongoose";

export interface IQuiz extends Document {
  title: string;
  subject: Types.ObjectId;
  questions: Types.ObjectId[];
  createdBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const quizSchema = new Schema<IQuiz>(
  {
    title: { type: String, required: true },
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    questions: [{ type: Schema.Types.ObjectId, ref: "Question" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

export default mongoose.model<IQuiz>("Quiz", quizSchema);
