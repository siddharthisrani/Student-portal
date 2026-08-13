import mongoose, { Document, Model, Schema } from "mongoose";

export type QuestionType =
  | "mcq"
  | "image_mcq"
  | "pdf_mcq"
  | "text"
  | "coding"
  | "sql"
  | "excel"
  | "upload";

export interface IOption {
  id: string;
  text: string;
}

export interface IQuestion extends Document {
  _id: mongoose.Types.ObjectId;

  testId: mongoose.Types.ObjectId;

  type: QuestionType;

  question: string;

  marks: number;

  order: number;

  // --------------------
  // MCQ
  // --------------------

  options: IOption[];

  correctAnswer: string;

  // --------------------
  // Media
  // --------------------

  imageUrl?: string;

  pdfUrl?: string;

  // --------------------
  // Coding / SQL
  // --------------------

  language?: string;

  starterCode?: string;

  sampleInput?: string;

  sampleOutput?: string;

  tableName?: string;
  dataFileUrl?: string;
  dataFileName?: string;
  dataFileType?: string;

  // --------------------
  // Upload
  // --------------------

  allowedExtensions?: string[];

  maxFileSize?: number;

  createdAt: Date;

  updatedAt: Date;
}

const OptionSchema = new Schema<IOption>(
  {
    id: {
      type: String,
      required: true,
    },

    text: {
      type: String,
      required: true,
    },
  },
  {
    _id: false,
  }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    testId: {
      type: Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      index: true,
    },

    type: {
      type: String,
      required: true,
      default: "mcq",

      enum: [
        "mcq",
        "image_mcq",
        "pdf_mcq",
        "text",
        "coding",
        "sql",
        "excel",
        "upload",
      ],
    },

    question: {
      type: String,
      required: true,
      trim: true,
    },

    marks: {
      type: Number,
      default: 1,
      min: 0,
      max: 100,
    },

    order: {
      type: Number,
      default: 0,
    },

    // ==========================
    // MCQ
    // ==========================

    options: {
      type: [OptionSchema],
      default: [],
    },

    correctAnswer: {
      type: String,
      default: "",
    },

    // ==========================
    // IMAGE / PDF
    // ==========================

    imageUrl: {
      type: String,
      default: "",
    },

    pdfUrl: {
      type: String,
      default: "",
    },

    // ==========================
    // CODING / SQL
    // ==========================

    language: {
      type: String,
      default: "",
    },

    starterCode: {
      type: String,
      default: "",
    },

    sampleInput: {
      type: String,
      default: "",
    },

    sampleOutput: {
      type: String,
      default: "",
    },

    // ==========================
// SQL DATASET
// ==========================

tableName: {
  type: String,
  default: "",
},

dataFileUrl: {
  type: String,
  default: "",
},

dataFileName: {
  type: String,
  default: "",
},

dataFileType: {
  type: String,
  default: "",
},

    // ==========================
    // UPLOAD
    // ==========================

    allowedExtensions: {
      type: [String],
      default: [],
    },

    maxFileSize: {
      type: Number,
      default: 10, // MB
    },
  },
  {
    timestamps: true,
  }
);

// Useful indexes
QuestionSchema.index({
  testId: 1,
  order: 1,
});

QuestionSchema.index({
  testId: 1,
  type: 1,
});

const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>("Question", QuestionSchema);

export default Question;