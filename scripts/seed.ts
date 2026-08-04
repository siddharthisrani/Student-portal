/**
 * DNDC Exam Portal - Database Seed Script
 * Run: npx ts-node --project tsconfig.seed.json scripts/seed.ts
 * Or via: npm run seed
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const MONGODB_URI = process.env.MONGODB_URI;
const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD;
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ;

if (!MONGODB_URI) {
  console.error('❌ MONGODB_URI is not defined in .env.local');
  process.exit(1);
}

// Admin Schema (inline for seed)
const AdminSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'admin' },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

// Student Schema (inline for seed)
const StudentSchema = new mongoose.Schema({
  name: String,
  email: { type: String, unique: true },
  phone: String,
  studentId: { type: String, unique: true },
  password: String,
  course: String,
  batch: String,
  role: { type: String, default: 'student' },
  status: { type: String, default: 'active' },
}, { timestamps: true });

async function seed() {
  console.log('🌱 Starting DNDC database seed...\n');
  
  await mongoose.connect(MONGODB_URI!);
  console.log('✅ Connected to MongoDB\n');

  const Admin = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

  // Create Admin
  const existingAdmin = await Admin.findOne({ email: ADMIN_EMAIL!.toLowerCase() });
  
  if (existingAdmin) {
    console.log(`⚠️  Admin already exists: ${ADMIN_EMAIL}`);
    console.log('   Skipping admin creation...\n');
  } else {
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD!, 12);
    await Admin.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL!.toLowerCase(),
      password: hashedPassword,
    });
    console.log('✅ Admin created successfully!');
    console.log(`   Email: ${ADMIN_EMAIL}`);
    // console.log(`   Password: ${ADMIN_PASSWORD}\n`);
  }

  // Create sample students (optional)
  const Student = mongoose.models.Student || mongoose.model('Student', StudentSchema);
  
  


  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📋 Login Credentials:');

  
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
