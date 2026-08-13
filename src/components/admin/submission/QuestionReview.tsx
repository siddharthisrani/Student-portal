"use client";

import MCQReview from "./review/MCQReview";
import CodingReview from "./review/CodingReview";
import TextReview from "./review/TextReview";
import UploadReview from "./review/UploadReview";
import SQLReview from "./review/SQLReview";
import ExcelReview from "./review/ExcelReview";

interface Props {
  submission: any;
  index: number;

  marks: number;
  feedback: string;

  setMarks: (value: number) => void;

  setFeedback: React.Dispatch<
    React.SetStateAction<string>
  >;

   readOnly: boolean;
}

export default function QuestionReview({
  submission,
  index,

  marks,
  feedback,

  setMarks,
  setFeedback,
  readOnly,

}: Props) {

    

const answer = submission.answers[index];

const question = answer?.questionId;

if (!question) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6">
      <h3 className="text-sm font-bold text-red-700">
        Question Not Found
      </h3>

      <p className="mt-2 text-xs leading-5 text-red-600">
        This answer is linked to a question that no longer exists.
        The question may have been replaced or deleted after this
        submission was created.
      </p>

      {answer?._id && (
        <p className="mt-2 font-mono text-[11px] text-red-500">
          Answer ID: {String(answer._id)}
        </p>
      )}

      {answer?.questionId && (
        <p className="mt-1 font-mono text-[11px] text-red-500">
          Question ID: {String(answer.questionId)}
        </p>
      )}
    </div>
  );
}

switch (question.type) {
  case "mcq":
  case "image_mcq":
  case "pdf_mcq":

    return (
      <MCQReview
        question={question}
        answer={answer}
        marks={marks}
        feedback={feedback}
        setMarks={setMarks}
        setFeedback={setFeedback}
        readOnly={readOnly}
      />
    );

  case "coding":

    return (
      <CodingReview
        question={question}
        answer={answer}
        marks={marks}
        feedback={feedback}
        setMarks={setMarks}
        setFeedback={setFeedback}
        readOnly={readOnly}
      />
    );

 case "sql":

  return (
    <SQLReview
      question={question}
      answer={answer}
      marks={marks}
      feedback={feedback}
      setMarks={setMarks}
      setFeedback={setFeedback}
      readOnly={readOnly}
    />
  );

  case "excel":
    return (
      <ExcelReview
        question={question}
        answer={answer}
        // ADD THESE MISSING PROPS
        marks={marks}
        feedback={feedback}
        setMarks={setMarks}
        setFeedback={setFeedback}
        readOnly={readOnly}
      />
    );

  case "upload":

    return (
      <UploadReview
        // question={question}
        // answer={answer}
      />
    );

  case "text":

    return (
      <TextReview
        question={question}
        answer={answer}
        marks={marks}
        feedback={feedback}
        setMarks={setMarks}
        setFeedback={setFeedback}
        readOnly={readOnly}
      />
    );

  default:

    return (
      <div className="rounded-xl bg-red-50 p-8 text-red-600">

        Unsupported Question Type:
        <strong> {question.type}</strong>

      </div>
    );

}

}