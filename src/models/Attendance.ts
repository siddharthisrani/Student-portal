import mongoose, { Document, Model, Schema } from "mongoose";

export interface IAttendance extends Document {
  studentId: mongoose.Types.ObjectId;

  date: Date;

  checkInTime: Date;

  latitude: number;
  longitude: number;

  distance: number;

  status: "present";

  createdAt: Date;
  updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    date: {
      type: Date,
      required: true,
      index: true,
    },

    checkInTime: {
      type: Date,
      required: true,
      default: Date.now,
    },

    latitude: {
      type: Number,
      required: true,
    },

    longitude: {
      type: Number,
      required: true,
    },

    distance: {
      type: Number,
      required: true,
    },

    status: {
      type: String,
      enum: ["present"],
      default: "present",
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate attendance for same student + same day
AttendanceSchema.index(
  {
    studentId: 1,
    date: 1,
  },
  {
    unique: true,
  }
);

const Attendance: Model<IAttendance> =
  mongoose.models.Attendance ||
  mongoose.model<IAttendance>("Attendance", AttendanceSchema);

export default Attendance;