import mongoose, { Document, Model, Schema } from "mongoose";

export type DayType = "working_day" | "holiday";

export interface IWorkingDay extends Document {
  _id: mongoose.Types.ObjectId;

  date: Date;

  type: DayType;

  title?: string;

  // "All" means entire institute
  course: string;

  // "All" means every batch
  batch: string;

  createdBy: mongoose.Types.ObjectId;

  createdAt: Date;
  updatedAt: Date;
}

const WorkingDaySchema = new Schema<IWorkingDay>(
  {
    date: {
      type: Date,
      required: true,
    },

    type: {
      type: String,
      enum: ["working_day", "holiday"],
      required: true,
    },

    title: {
      type: String,
      trim: true,
      maxlength: 150,
      default: "",
    },

    course: {
      type: String,
      default: "All",
      trim: true,
    },

    batch: {
      type: String,
      default: "All",
      trim: true,
    },

    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "Admin",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate configuration for same date/course/batch
WorkingDaySchema.index(
  {
    date: 1,
    course: 1,
    batch: 1,
  },
  {
    unique: true,
  }
);

const WorkingDay: Model<IWorkingDay> =
  mongoose.models.WorkingDay ||
  mongoose.model<IWorkingDay>(
    "WorkingDay",
    WorkingDaySchema
  );

export default WorkingDay;