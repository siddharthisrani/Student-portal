import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Question from '@/models/Question';
import Test from '@/models/Test';

const createQuestionSchema = z.object({
  testId: z.string().min(1),
  type: z.enum(['mcq', 'image_mcq', 'pdf_mcq', 'text']),
  question: z.string().min(1, 'Question text is required'),
  options: z.array(z.object({ id: z.string(), text: z.string() })).min(2).max(6),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  marks: z.number().min(0).max(100).default(1),
  imageUrl: z.string().optional().nullable(),
  pdfUrl: z.string().optional().nullable(),
  order: z.number().default(0),
});

const bulkQuestionsSchema = z.object({
  testId: z.string().min(1),
  questions: z.array(createQuestionSchema.omit({ testId: true })),
});

export async function POST(request: NextRequest) {
  try {
    const user = getAuthUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();

    // Check if bulk or single
    if (body.questions) {
      // Bulk save
      const validation = bulkQuestionsSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, message: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      await connectDB();

      const { testId, questions } = validation.data;

      // Delete existing questions for this test and replace
      await Question.deleteMany({ testId });

      const questionsToCreate = questions.map((q, index) => ({
        ...q,
        testId,
        order: q.order ?? index,
      }));

      const createdQuestions = await Question.insertMany(questionsToCreate);

      // Update test totals
      const totalMarks = questions.reduce((sum, q) => sum + (q.marks ?? 1), 0);
      await Test.findByIdAndUpdate(testId, {
        totalQuestions: questions.length,
        totalMarks,
      });

      return NextResponse.json({
        success: true,
        message: `${createdQuestions.length} questions saved successfully`,
        questions: createdQuestions,
      });
    } else {
      // Single question
      const validation = createQuestionSchema.safeParse(body);
      if (!validation.success) {
        return NextResponse.json(
          { success: false, message: validation.error.errors[0].message },
          { status: 400 }
        );
      }

      await connectDB();
      const question = await Question.create(validation.data);

      // Update test totals
      const allQuestions = await Question.find({ testId: validation.data.testId });
      const totalMarks = allQuestions.reduce((sum, q) => sum + q.marks, 0);
      await Test.findByIdAndUpdate(validation.data.testId, {
        totalQuestions: allQuestions.length,
        totalMarks,
      });

      return NextResponse.json({ success: true, question }, { status: 201 });
    }
  } catch (error) {
    console.error('Create question error:', error);
    return NextResponse.json({ success: false, message: 'Server error' }, { status: 500 });
  }
}
