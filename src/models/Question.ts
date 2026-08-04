import mongoose, { Document, Model, Schema } from 'mongoose';

export type QuestionType = 'mcq' | 'image_mcq' | 'pdf_mcq' | 'text';

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  type: QuestionType;
  question: string;
  options: IOption[];
  correctAnswer: string; // option id
  marks: number;
  imageUrl?: string;
  pdfUrl?: string;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
  },
  { _id: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['mcq', 'image_mcq', 'pdf_mcq', 'text'],
      required: true,
      default: 'mcq',
    },
    question: {
      type: String,
      required: [true, 'Question text is required'],
      trim: true,
    },
    options: {
      type: [OptionSchema],
      validate: {
        validator: function (v: IOption[]) {
          return v.length >= 2 && v.length <= 6;
        },
        message: 'Questions must have between 2 and 6 options',
      },
    },
    correctAnswer: {
      type: String,
      required: [true, 'Correct answer is required'],
    },
    marks: {
      type: Number,
      required: true,
      default: 1,
      min: [0, 'Marks cannot be negative'],
      max: [100, 'Marks cannot exceed 100'],
    },
    imageUrl: {
      type: String,
      default: null,
    },
    pdfUrl: {
      type: String,
      default: null,
    },
    order: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Question: Model<IQuestion> = mongoose.models.Question || mongoose.model<IQuestion>('Question', QuestionSchema);

export default Question;
