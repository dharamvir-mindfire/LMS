import 'dotenv/config';
import bcrypt from 'bcryptjs';
import mongoose from 'mongoose';
import connectDB from '../config/db';
import User, { IUser } from '../models/User';
import Course from '../models/Course';
import Enrollment from '../models/Enrollment';

async function upsertUser(name: string, email: string, password: string, role: IUser['role']): Promise<IUser> {
  const existing = await User.findOne({ email });
  if (existing) {
    console.log(`User already exists, skipping: ${email}`);
    return existing;
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hashed, role });
  console.log(`Created user: ${email} (${role})`);
  return user;
}

async function seed(): Promise<void> {
  await connectDB();

  await upsertUser('Admin', 'admin@admin.com', 'Admin@123', 'admin');
  const instructor = await upsertUser('Jane Instructor', 'instructor@example.com', 'Instructor@123', 'instructor');
  const student = await upsertUser('John Student', 'student@example.com', 'Student@123', 'student');

  let publishedCourse = await Course.findOne({ title: 'Introduction to JavaScript' });
  if (!publishedCourse) {
    publishedCourse = await Course.create({
      title: 'Introduction to JavaScript',
      description: 'Learn the fundamentals of JavaScript from scratch.',
      instructor: instructor._id,
      published: true,
      lessons: [
        { title: 'Variables and Types', content: 'var, let, const and primitive types.', order: 1 },
        { title: 'Functions', content: 'Declarations, expressions and arrow functions.', order: 2 },
        { title: 'Arrays and Objects', content: 'Working with collections of data.', order: 3 },
      ],
    });
    console.log(`Created course: ${publishedCourse.title}`);
  } else {
    console.log(`Course already exists, skipping: ${publishedCourse.title}`);
  }

  let draftCourse = await Course.findOne({ title: 'Advanced TypeScript' });
  if (!draftCourse) {
    draftCourse = await Course.create({
      title: 'Advanced TypeScript',
      description: 'Generics, utility types and advanced patterns.',
      instructor: instructor._id,
      published: false,
      lessons: [{ title: 'Generics', content: 'Writing reusable, type-safe code.', order: 1 }],
    });
    console.log(`Created course: ${draftCourse.title}`);
  } else {
    console.log(`Course already exists, skipping: ${draftCourse.title}`);
  }

  const existingEnrollment = await Enrollment.findOne({ student: student._id, course: publishedCourse._id });
  if (!existingEnrollment) {
    await Enrollment.create({ student: student._id, course: publishedCourse._id });
    if (!publishedCourse.students.some((id) => String(id) === String(student._id))) {
      publishedCourse.students.push(student._id);
      await publishedCourse.save();
    }
    console.log(`Enrolled ${student.email} in ${publishedCourse.title}`);
  } else {
    console.log(`Enrollment already exists, skipping: ${student.email} -> ${publishedCourse.title}`);
  }

  console.log('\nSeed data ready. Login with:');
  console.log(`  Admin:      admin@admin.com / Admin@123`);
  console.log(`  Instructor: instructor@example.com / Instructor@123`);
  console.log(`  Student:    student@example.com / Student@123`);

  await mongoose.disconnect();
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Seeding failed', err);
    process.exit(1);
  });
