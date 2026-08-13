"use client";

import { useEffect, useState } from "react";

import ResultHeader from "./ResultHeader";
import ResultSummary from "./ResultSummary";
import ResultSidebar from "./ResultSidebar";
import QuestionResult from "./QuestionResult";

interface Props {
  submissionId: string;
}

export default function ResultViewer({
  submissionId,
}: Props) {

  const [loading, setLoading] =
    useState(true);

  const [submission, setSubmission] =
    useState<any>(null);

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  useEffect(() => {

    async function loadResult() {

      try {

        const response = await fetch(
          `/api/students/results/${submissionId}`
        );

        const data =
          await response.json();

        if (data.success) {

          setSubmission(
            data.submission
          );

        }

      } catch (err) {

        console.error(err);

      } finally {

        setLoading(false);

      }

    }

    loadResult();

  }, [submissionId]);

  if (loading) {

    return (

      <div className="flex h-[500px] items-center justify-center">

        Loading Result...

      </div>

    );

  }

  if (!submission) {

    return (

      <div className="flex h-[500px] items-center justify-center">

        Result not found.

      </div>

    );

  }

  return (

    <div className="p-4 sm:p-6 space-y-6">

      <ResultHeader

        title={
          submission.test.title
        }

        score={
          submission.totalScore
        }

        total={
          submission.totalMarks
        }

        status={
          submission.status
        }

      />

      <ResultSummary

        totalMarks={
          submission.totalMarks
        }

        obtainedMarks={
          submission.totalScore
        }

        correct={
          submission.correctAnswers
        }

        wrong={
          submission.wrongAnswers
        }

        skipped={
          submission.skippedAnswers
        }

      />

      <div className="grid grid-cols-[260px_1fr] gap-6">

        <ResultSidebar

          answers={
            submission.answers
          }

          current={
            currentQuestion
          }

          onSelect={
            setCurrentQuestion
          }

        />

        <QuestionResult

          answer={
            submission.answers[
              currentQuestion
            ]
          }

        />

      </div>

    </div>

  );

}