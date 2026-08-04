import mongoose, { Document, Model, Schema } from 'mongoose';
import { CourseType } from './Student';

export type TestStatus = 'draft' | 'published' | 'expired';

export interface ITest extends Document {
  _id: mongoose.Types.ObjectId;
  title: string;
  description: string;
  course: CourseType | 'All';
  date: Date;
  duration: number; // in minutes
  totalMarks: number;
  totalQuestions: number;
  status: TestStatus;
  passingMarks: number;
  instructions: string[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TestSchema = new Schema<ITest>(
  {
    title: {
      type: String,
      required: [true, 'Test title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
      enum: [
        'All',
        'MERN Stack',
        'Java Full Stack',
        'Python Full Stack',
        'Data Analytics',
        'AI & Machine Learning',
        'Flutter',
        'UI/UX',
      ],
    },
    date: {
      type: Date,
      required: [true, 'Test date is required'],
    },
    duration: {
      type: Number,
      required: [true, 'Duration is required'],
      min: [5, 'Duration must be at least 5 minutes'],
      max: [300, 'Duration cannot exceed 300 minutes'],
    },
    totalMarks: {
      type: Number,
      required: true,
      default: 0,
    },
    totalQuestions: {
      type: Number,
      required: true,
      default: 0,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'expired'],
      default: 'draft',
    },
    passingMarks: {
      type: Number,
      default: 0,
    },
    instructions: {
      type: [String],
      default: [
        'Read each question carefully before answering.',
        'Each question has only one correct answer.',
        'Do not refresh the page during the test.',
        'The test will auto-submit when the timer runs out.',
        'Once submitted, you cannot retake the test.',
      ],
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: 'Admin',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for finding today's tests by course
TestSchema.index({ date: 1, course: 1, status: 1 });

const Test: Model<ITest> = mongoose.models.Test || mongoose.model<ITest>('Test', TestSchema);

export default Test;
