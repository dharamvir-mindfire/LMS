import mongoose, { Document, Schema, Types } from "mongoose";

export type Difficulty = "easy" | "medium" | "hard";

export interface IQuestion extends Document {
  subject: Types.ObjectId;
  text: string;
  options: string[];
  correctOptionIndex: number;
  difficulty: Difficulty;
  explanation: string;
  createdAt: Date;
  updatedAt: Date;
}

const questionSchema = new Schema<IQuestion>(
  {
    subject: { type: Schema.Types.ObjectId, ref: "Subject", required: true },
    text: { type: String, required: true },
    options: {
      type: [String],
      required: true,
      validate: {
        validator: (options: string[]) => options.length >= 2,
        message: "A question needs at least 2 options",
      },
    },
    correctOptionIndex: { type: Number, required: true },
    difficulty: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    explanation: { type: String, default: "" },
  },
  { timestamps: true }
);

export default mongoose.model<IQuestion>("Question", questionSchema);
