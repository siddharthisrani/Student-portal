import mongoose, { Document, Model, Schema } from 'mongoose';

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;
  selectedAnswer: string | null;
  isCorrect: boolean;
  marksEarned: number;
}

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;
  testId: mongoose.Types.ObjectId;
  studentId: mongoose.Types.ObjectId;
  answers: IAnswer[];
  totalScore: number;
  totalMarks: number;
  percentage: number;
  correctAnswers: number;
  wrongAnswers: number;
  skippedAnswers: number;
  isPassed: boolean;
  passingMarks: number;
  startedAt: Date;
  submittedAt: Date;
  timeTaken: number; // in seconds
  isAutoSubmitted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AnswerSchema = new Schema<IAnswer>(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: 'Question',
      required: true,
    },
    selectedAnswer: {
      type: String,
      default: null,
    },
    isCorrect: {
      type: Boolean,
      default: false,
    },
    marksEarned: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const SubmissionSchema = new Schema<ISubmission>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
      index: true,
    },
    studentId: {
      type: Schema.Types.ObjectId,
      ref: 'Student',
      required: true,
      index: true,
    },
    answers: {
      type: [AnswerSchema],
      default: [],
    },
    totalScore: {
      type: Number,
      required: true,
      default: 0,
    },
    totalMarks: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
      default: 0,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    skippedAnswers: {
      type: Number,
      default: 0,
    },
    isPassed: {
      type: Boolean,
      default: false,
    },
    passingMarks: {
      type: Number,
      required: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    submittedAt: {
      type: Date,
      required: true,
    },
    timeTaken: {
      type: Number,
      default: 0,
    },
    isAutoSubmitted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index - one submission per student per test
SubmissionSchema.index({ testId: 1, studentId: 1 }, { unique: true });

const Submission: Model<ISubmission> =
  mongoose.models.Submission || mongoose.model<ISubmission>('Submission', SubmissionSchema);

export default Submission;
