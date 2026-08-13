import mongoose, { Document, Model, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export type CourseType =
  | "MERN Stack"
  | "Java Full Stack"
  | "Python Full Stack"
  | "Flutter"
  | "Data Analytics"
  | "Data Science"
  | "AI & Machine Learning"
  | "Cyber Security"
  | "Digital Marketing"
  | "UI/UX";

export interface IStudent extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  phone: string;
  studentId: string;
  password: string;
  avatar?: string;
  course: CourseType;
  batch: string;
  role: 'student';
  status: 'active' | 'inactive';
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const StudentSchema = new Schema<IStudent>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^[6-9]\d{9}$/, 'Please enter a valid Indian phone number'],
    },
    studentId: {
      type: String,
      required: [true, 'Student ID is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      default: null,
    },
    course: {
      type: String,
      required: [true, 'Course is required'],
     enum: [
  "MERN Stack",
  "Java Full Stack",
  "Python Full Stack",
  "Flutter",
  "Data Analytics",
  "Data Science",
  "AI & Machine Learning",
  "Cyber Security",
  "Digital Marketing",
  "UI/UX",
],
    },
    batch: {
      type: String,
      required: [true, 'Batch is required'],
      trim: true,
    },
    role: {
      type: String,
      default: 'student',
      immutable: true,
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
    lastLogin: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
);

// Hash password before saving
StudentSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
StudentSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

const Student: Model<IStudent> = mongoose.models.Student || mongoose.model<IStudent>('Student', StudentSchema);

export default Student;
