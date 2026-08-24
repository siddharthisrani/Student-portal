"use client";

import { useEffect, useState } from "react";

import SubmissionHeader from "./SubmissionHeader";
import QuestionReview from "./QuestionReview";
import PublishResult from "./PublishResult";
import SaveDraft from "./review/SaveDraft";

interface Props {
  submissionId: string;
}

export default function SubmissionViewer({
  submissionId,
}: Props) {
  const [loading, setLoading] = useState(true);

  const [submission, setSubmission] =
    useState<any>(null);

  const [marks, setMarks] = useState(0);

  const [feedback, setFeedback] = useState("");

  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const [saving, setSaving] = useState(false);

  const [message, setMessage] = useState("");

  /*
   * Tracks whether the current question has
   * changes which have NOT been saved.
   */
  const [hasUnsavedChanges, setHasUnsavedChanges] =
    useState(false);

  /*
   * ------------------------------------------------
   * LOAD SUBMISSION
   * ------------------------------------------------
   */

  useEffect(() => {
    async function loadSubmission() {
      try {
        setLoading(true);

        const response = await fetch(
          `/api/admin/submissions/${submissionId}`,
          {
            method: "GET",
            cache: "no-store",
          }
        );

        const text = await response.text();

        let data: any = null;

        try {
          data = text ? JSON.parse(text) : null;
        } catch {
          throw new Error(
            `Invalid server response (${response.status})`
          );
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load submission (${response.status})`
          );
        }

        if (!data?.success || !data?.submission) {
          throw new Error(
            data?.message ||
              "Submission not found."
          );
        }

        setSubmission(data.submission);

        /*
         * Load first question's saved values.
         */
        if (
          data.submission.answers &&
          data.submission.answers.length > 0
        ) {
          const first =
            data.submission.answers[0];

          setMarks(
            Number(first.obtainedMarks || 0)
          );

          setFeedback(
            first.feedback || ""
          );
        }

        /*
         * Nothing is unsaved immediately
         * after loading from MongoDB.
         */
        setHasUnsavedChanges(false);
      } catch (error) {
        console.error(
          "Load submission error:",
          error
        );

        setSubmission(null);
      } finally {
        setLoading(false);
      }
    }

    loadSubmission();
  }, [submissionId]);

  /*
   * ------------------------------------------------
   * LOAD CURRENT QUESTION
   * ------------------------------------------------
   */

  useEffect(() => {
    if (!submission) return;

    const current =
      submission.answers[currentQuestion];

    if (!current) return;

    setMarks(
      Number(current.obtainedMarks || 0)
    );

    setFeedback(
      current.feedback || ""
    );

    /*
     * Values came from the database/local
     * saved state, so they are not dirty.
     */
    setHasUnsavedChanges(false);
  }, [currentQuestion, submission]);

  /*
   * ------------------------------------------------
   * MESSAGE AUTO CLEAR
   * ------------------------------------------------
   */

  useEffect(() => {
    if (!message) return;

    const timer = setTimeout(() => {
      setMessage("");
    }, 2500);

    return () => clearTimeout(timer);
  }, [message]);

  /*
   * ------------------------------------------------
   * LOADING
   * ------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        Loading Submission...
      </div>
    );
  }

  /*
   * ------------------------------------------------
   * NOT FOUND
   * ------------------------------------------------
   */

  if (!submission) {
    return (
      <div className="flex h-[500px] items-center justify-center">
        Submission not found.
      </div>
    );
  }

  /*
   * ------------------------------------------------
   * READ ONLY
   * ------------------------------------------------
   */

  const readOnly =
    submission.status === "published";

  /*
   * ------------------------------------------------
   * CURRENT ANSWER
   * ------------------------------------------------
   */

  const currentAnswer =
    submission.answers[currentQuestion];

  const maxMarks =
    Number(currentAnswer?.maxMarks || 0);

  /*
   * ------------------------------------------------
   * MARKS CHANGE
   * ------------------------------------------------
   */

  const handleMarksChange = (
    value: number
  ) => {
    let newMarks = Number(value);

    if (Number.isNaN(newMarks)) {
      newMarks = 0;
    }

    /*
     * No negative marks.
     */
    if (newMarks < 0) {
      newMarks = 0;
    }

    /*
     * Never allow marks greater than
     * maximum question marks.
     */
    if (newMarks > maxMarks) {
      newMarks = maxMarks;
    }

    setMarks(newMarks);

    /*
     * This is now a change which has not
     * been saved to MongoDB.
     */
    setHasUnsavedChanges(true);
  };

  /*
   * ------------------------------------------------
   * FEEDBACK CHANGE
   * ------------------------------------------------
   */

 const handleFeedbackChange = (
  value: React.SetStateAction<string>
) => {
  setFeedback(value);

  /*
   * Feedback has changed but has not
   * been saved yet.
   */
  setHasUnsavedChanges(true);
};

  /*
   * ------------------------------------------------
   * SAVE CURRENT QUESTION
   * ------------------------------------------------
   */

  async function saveReview() {
    if (!currentAnswer) return;

    /*
     * Final frontend validation.
     */

    if (marks < 0) {
      alert("Marks cannot be negative.");
      return;
    }

    if (marks > maxMarks) {
      alert(
        `Maximum marks for this question are ${maxMarks}.`
      );
      return;
    }

    try {
      setSaving(true);
      setMessage("");

      const response = await fetch(
        "/api/admin/submissions/review",
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
          },

          body: JSON.stringify({
            submissionId:
              submission._id,

            questionId:
              currentAnswer.questionId._id ||
              currentAnswer.questionId,

            marks,

            feedback,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Unable to save marks."
        );

        return;
      }

      /*
       * Update local submission state.
       */
      setSubmission((prev: any) => {
        if (!prev) return prev;

        const updatedAnswers =
          prev.answers.map(
            (
              answer: any,
              index: number
            ) =>
              index === currentQuestion
                ? {
                    ...answer,

                    obtainedMarks:
                      marks,

                    feedback,

                    checked: true,
                  }
                : answer
          );

        return {
          ...prev,

          answers:
            updatedAnswers,

          totalScore:
            data.totalScore ??
            updatedAnswers.reduce(
              (
                total: number,
                answer: any
              ) =>
                total +
                Number(
                  answer.obtainedMarks || 0
                ),
              0
            ),
        };
      });

      /*
       * IMPORTANT:
       *
       * The current question has now been
       * successfully saved to MongoDB.
       */
      setHasUnsavedChanges(false);

      setMessage(
        "Marks saved successfully."
      );
    } catch (error) {
      console.error(
        "Save review error:",
        error
      );

      alert(
        "Unable to save marks."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------
   * PUBLISH RESULT
   * ------------------------------------------------
   */

  async function publish() {
    /*
     * IMPORTANT:
     *
     * Do this check FIRST.
     *
     * If admin changed marks/feedback and
     * forgot Save Draft, publishing must stop.
     */
    if (hasUnsavedChanges) {
      alert(
        "Please save your changes before publishing."
      );

      return;
    }

    try {
      setSaving(true);

      /*
       * Do not allow publishing if any
       * question is still unchecked.
       */
      const allChecked =
        submission.answers.every(
          (answer: any) =>
            answer.checked === true
        );

      if (!allChecked) {
        alert(
          "Please check and mark every question before publishing the result."
        );

        return;
      }

      /*
       * Make sure every mark is valid.
       */
      const invalidMarks =
        submission.answers.find(
          (answer: any) =>
            Number(
              answer.obtainedMarks || 0
            ) < 0 ||
            Number(
              answer.obtainedMarks || 0
            ) >
              Number(
                answer.maxMarks || 0
              )
        );

      if (invalidMarks) {
        alert(
          "One or more questions have invalid marks."
        );

        return;
      }

      /*
       * Publish.
       */
      const response =
        await fetch(
          "/api/admin/submissions/publish",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              submissionId:
                submission._id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok || !data.success) {
        alert(
          data.message ||
            "Unable to publish result."
        );

        return;
      }

      alert(
        "Result Published Successfully"
      );

      setSubmission(
        (prev: any) => ({
          ...prev,

          status: "published",
        })
      );

      /*
       * No changes can remain after
       * successful publishing.
       */
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error(
        "Publish error:",
        error
      );

      alert(
        "Unable to publish result."
      );
    } finally {
      setSaving(false);
    }
  }

  /*
   * ------------------------------------------------
   * UI
   * ------------------------------------------------
   */

  return (
    <div className="p-4 sm:p-6 space-y-6">

      <SubmissionHeader
        title={
          submission.testId?.title ||
          "Test"
        }
        student={
          submission.studentId?.name ||
          "Student"
        }
        status={submission.status}
      />

      <div className="grid grid-cols-[260px_1fr] gap-6">

        {/* -----------------------------------------
            SIDEBAR
        ------------------------------------------ */}

        <div className="rounded-2xl border bg-white p-5">

          <h2 className="mb-5 text-lg font-bold">
            Questions
          </h2>

          <div className="grid grid-cols-4 gap-3">

            {submission.answers.map(
              (
                answer: any,
                index: number
              ) => (
                <button
                  key={index}
                  type="button"
                  onClick={() =>
                    setCurrentQuestion(index)
                  }
                  className={`h-12 rounded-lg font-semibold ${
                    currentQuestion === index
                      ? "bg-indigo-600 text-white"
                      : answer.checked
                      ? "bg-green-500 text-white"
                      : "bg-slate-100 text-slate-700"
                  }`}
                >
                  {index + 1}
                </button>
              )
            )}

          </div>

        </div>

        {/* -----------------------------------------
            MAIN CONTENT
        ------------------------------------------ */}

        <div className="space-y-6">

          {/* QUESTION REVIEW */}

          <QuestionReview
            submission={submission}
            index={currentQuestion}
            marks={marks}
            feedback={feedback}
            setMarks={handleMarksChange}
            setFeedback={
              handleFeedbackChange
            }
            readOnly={readOnly}
          />

          {/* MAX MARKS */}

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">

            <div className="flex items-center justify-between">

              <span className="text-sm text-slate-500">
                Maximum Marks
              </span>

              <span className="font-bold text-slate-900">
                {maxMarks}
              </span>

            </div>

            <div className="mt-1 text-xs text-slate-400">
              Marks must be between 0 and{" "}
              {maxMarks}.
            </div>

          </div>

          {/* UNSAVED WARNING */}

          {hasUnsavedChanges &&
            !readOnly && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-800">
                You have unsaved changes.
                Please save your changes
                before publishing.
              </div>
            )}

          {/* SUCCESS MESSAGE */}

          {message && (
            <div className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
              {message}
            </div>
          )}

          {/* ---------------------------------------
              ACTION BUTTONS
          ---------------------------------------- */}

          {!readOnly && (
            <div className="flex items-center justify-end gap-3">

              <SaveDraft
                loading={saving}
                onClick={saveReview}
              />

              <PublishResult
                onPublish={publish}
              />

            </div>
          )}

        </div>

      </div>

    </div>
  );
}