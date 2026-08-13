import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/lib/mongodb';
import { getAuthUserFromRequest } from '@/lib/auth';
import Question from '@/models/Question';
import Test from '@/models/Test';

const questionBaseSchema = z.object({
  type: z.enum([
    "mcq",
    "image_mcq",
    "pdf_mcq",
    "text",
    "coding",
    "sql",
    "excel",
    "upload",
  ]),

  question: z.string().min(1, "Question text is required"),

  options: z.array(
    z.object({
      id: z.string(),
      text: z.string(),
    })
  ).optional(),

  correctAnswer: z.string().optional(),

  marks: z.number().min(0).max(100).default(1),

  imageUrl: z.string().optional().nullable(),

  pdfUrl: z.string().optional().nullable(),

  order: z.number().default(0),

  language: z.string().optional(),

  starterCode: z.string().optional(),

  sampleInput: z.string().optional(),

  sampleOutput: z.string().optional(),
  tableName: z.string().optional(),

dataFileUrl: z.string().optional().nullable(),

dataFileName: z.string().optional().nullable(),

dataFileType: z.string().optional().nullable(),
  allowedExtensions: z.array(z.string()).optional(),

maxFileSize: z.number().optional(),
});

function validateQuestion(
  data: z.infer<typeof questionBaseSchema>,
  ctx: z.RefinementCtx
) {

  switch (data.type) {

    case "mcq":
    case "image_mcq":
    case "pdf_mcq":

      if (!data.options || data.options.length < 2) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["options"],
          message: "Minimum 2 options required.",
        });
      }

      if (!data.correctAnswer) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["correctAnswer"],
          message: "Please select correct answer.",
        });
      }

      break;

    case "coding":

      if (!data.language) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["language"],
          message: "Programming language required.",
        });
      }

      if (!data.starterCode?.trim()) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ["starterCode"],
          message: "Starter code required.",
        });
      }

      break;

    case "sql":

  // Dataset is OPTIONAL.
  // Student can answer SQL question without uploaded dataset.

  break;

    default:
      break;
  }

}

const questionSchema =
  questionBaseSchema.superRefine(validateQuestion);

const createQuestionSchema =
  questionBaseSchema
    .extend({
      testId: z.string().min(1),
    })
    .superRefine(validateQuestion);

const bulkQuestionsSchema = z.object({

    testId: z.string(),

    questions: z.array(questionSchema),

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

     const questionsToCreate = questions.map((question, index) => ({

  ...question,

  testId,

  order: question.order ?? index,

  options: question.options ?? [],

  correctAnswer: question.correctAnswer ?? "",

  language: question.language ?? "",

  starterCode: question.starterCode ?? "",

  sampleInput: question.sampleInput ?? "",

  sampleOutput: question.sampleOutput ?? "",

tableName:
  question.tableName ?? "",

dataFileUrl:
  question.dataFileUrl ?? "",

dataFileName:
  question.dataFileName ?? "",

dataFileType:
  question.dataFileType ?? "",

imageUrl:
  question.imageUrl ?? "",

pdfUrl:
  question.pdfUrl ?? "",

  allowedExtensions:
    question.allowedExtensions ?? [],

  maxFileSize:
    question.maxFileSize ?? 10,

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
