import mongoose, { Schema, Document, Model } from "mongoose";

export interface ITestAttempt extends Document {
  student: mongoose.Types.ObjectId;
  test: mongoose.Types.ObjectId;

  answers: Record<string, any>;

  currentQuestion: number;

  startedAt: Date;

  submittedAt?: Date;

  status: "in_progress" | "submitted";

  warnings: number;

  remainingTime: number;

  lastSavedAt: Date;

lastActivityAt: Date;

tabWarnings: number;

fullscreenWarnings: number;
}

const TestAttemptSchema = new Schema<ITestAttempt>(
  {
    student: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },

    test: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },

    currentQuestion: {
      type: Number,
      default: 0,
    },

    startedAt: {
      type: Date,
      default: Date.now,
    },

    submittedAt: Date,

    status: {
      type: String,
      enum: ["in_progress", "submitted"],
      default: "in_progress",
    },

    warnings: {
      type: Number,
      default: 0,
    },

    remainingTime: {
      type: Number,
      default: 0,
    },

    lastSavedAt: {
  type: Date,
  default: Date.now,
},

lastActivityAt: {
  type: Date,
  default: Date.now,
},

tabWarnings: {
  type: Number,
  default: 0,
},

fullscreenWarnings: {
  type: Number,
  default: 0,
}
  },
  {
    timestamps: true,
  }

  

);

TestAttemptSchema.index({
  student: 1,
  test: 1,
});

export default (mongoose.models.TestAttempt ||
  mongoose.model<ITestAttempt>(
    "TestAttempt",
    TestAttemptSchema
  )) as Model<ITestAttempt>;