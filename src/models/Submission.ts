import mongoose, {
  Document,
  Model,
  Schema,
} from "mongoose";

export interface IAnswer {
  questionId: mongoose.Types.ObjectId;

  // MCQ -> optionId
  // Coding -> source code
  // SQL -> SQL query
  // Excel -> uploaded file / workbook data
  // Upload -> uploaded file url
  // Text -> paragraph answer
  answer: any;

  obtainedMarks: number;

  maxMarks: number;

  checked: boolean;

  feedback: string;
}

export interface ISubmission extends Document {
  _id: mongoose.Types.ObjectId;

  testId: mongoose.Types.ObjectId;

  studentId: mongoose.Types.ObjectId;

  answers: IAnswer[];

  totalScore: number;

  totalMarks: number;

  passingMarks: number;

  startedAt: Date;

  submittedAt: Date;

  timeTaken: number;

  isAutoSubmitted: boolean;

  status:
    | "submitted"
    | "checking"
    | "checked"
    | "published";

  checkedBy?: mongoose.Types.ObjectId;

  checkedAt?: Date;

  feedback: string;

  createdAt: Date;

  updatedAt: Date;
}


/* ---------------------------------
   ANSWER SCHEMA
---------------------------------- */

const AnswerSchema = new Schema(
  {
    questionId: {
      type: Schema.Types.ObjectId,
      ref: "Question",
      required: true,
    },

    answer: {
      type: Schema.Types.Mixed,
      default: null,
    },

    obtainedMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    maxMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    checked: {
      type: Boolean,
      default: false,
    },

    feedback: {
      type: String,
      default: "",
      trim: true,
    },
  },
  {
    _id: false,
  }
);


/* ---------------------------------
   SUBMISSION SCHEMA
---------------------------------- */

const SubmissionSchema =
  new Schema(
    {
      testId: {
        type: Schema.Types.ObjectId,
        ref: "Test",
        required: true,
        index: true,
      },

      studentId: {
        type: Schema.Types.ObjectId,
        ref: "Student",
        required: true,
        index: true,
      },

      answers: {
        type: [AnswerSchema],
        default: [],
      },

      totalScore: {
        type: Number,
        default: 0,
        min: 0,
      },

      totalMarks: {
        type: Number,
        required: true,
        min: 0,
      },

      passingMarks: {
        type: Number,
        required: true,
        min: 0,
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
        min: 0,
      },

      isAutoSubmitted: {
        type: Boolean,
        default: false,
      },

      /*
       * Result workflow:
       *
       * submitted
       *     ↓
       * checking
       *     ↓
       * checked
       *     ↓
       * published
       *
       * Student should only see marks
       * when status === "published".
       */

      status: {
        type: String,
        enum: [
          "submitted",
          "checking",
          "checked",
          "published",
        ],
        default: "submitted",
      },

      checkedBy: {
        type: Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },

      checkedAt: {
        type: Date,
        default: null,
      },

      feedback: {
        type: String,
        default: "",
        trim: true,
      },
    },
    {
      timestamps: true,
    }
  );


/* ---------------------------------
   INDEX
---------------------------------- */

SubmissionSchema.index(
  {
    testId: 1,
    studentId: 1,
  },
  {
    unique: true,
  }
);


/* ---------------------------------
   VALIDATION
----------------------------------
   Make sure:
   obtainedMarks >= 0
   obtainedMarks <= maxMarks
---------------------------------- */

SubmissionSchema.pre(
  "validate",
  function (next) {

    for (const answer of this.answers) {

      if (
        answer.obtainedMarks < 0
      ) {
        return next(
          new Error(
            "Obtained marks cannot be negative."
          )
        );
      }

      if (
        answer.obtainedMarks >
        answer.maxMarks
      ) {
        return next(
          new Error(
            `Obtained marks cannot be greater than maximum marks (${answer.maxMarks}).`
          )
        );
      }
    }

    /* Total score validation */

    if (
      this.totalScore < 0
    ) {
      return next(
        new Error(
          "Total score cannot be negative."
        )
      );
    }

    if (
      this.totalScore >
      this.totalMarks
    ) {
      return next(
        new Error(
          "Total score cannot be greater than total marks."
        )
      );
    }

    next();
  }
);


/* ---------------------------------
   MODEL
---------------------------------- */

const Submission: Model<ISubmission> =
  mongoose.models.Submission ||
  mongoose.model<ISubmission>(
    "Submission",
    SubmissionSchema
  );

export default Submission;