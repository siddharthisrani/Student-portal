"use client";

import MCQResult from "./result/MCQResult";
import CodingResult from "./result/CodingResult";
import TextResult from "./result/TextResult";
import SQLResult from "./result/SQLResult";
import ExcelResult from "./result/ExcelResult";
import UploadResult from "./result/UploadResult";

interface Props {
  answer: any;
}

export default function QuestionResult({
  answer,
}: Props) {

  const question = answer.questionId;

  switch (question.type) {

    case "mcq":
    case "image_mcq":
    case "pdf_mcq":
      return (
        <MCQResult
          answer={answer}
        />
      );

    case "coding":
      return (
        <CodingResult
          answer={answer}
        />
      );

    case "text":
      return (
        <TextResult
          answer={answer}
        />
      );

    case "sql":
      return (
        <SQLResult
          answer={answer}
        />
      );

    case "excel":
      return (
        <ExcelResult
          answer={answer}
        />
      );

    case "upload":
      return (
        <UploadResult
          answer={answer}
        />
      );

    default:
      return (
        <div className="rounded-2xl bg-white p-10 text-center shadow-sm">

          <h2 className="text-xl font-semibold">
            Unsupported Question Type
          </h2>

          <p className="mt-2 text-slate-500">
            This question type is not supported yet.
          </p>

        </div>
      );
  }

}