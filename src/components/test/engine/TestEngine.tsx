"use client";

import { useState, useEffect, useRef } from "react";

import TestHeader from "./TestHeader";
import QuestionRenderer from "./QuestionRenderer";
import TestFooter from "./TestFooter";
import TestSidebar from "./TestSidebar";
import FullScreenGuard from "./FullScreenGuard";
import AutoSave from "./AutoSave";
import ConfirmSubmit from "./ConfirmSubmit";
import { AnimatePresence } from "framer-motion";
import ExamRulesModal from "./ExamRulesModal";

interface Props {
  test: any;
}

type SaveStatus =
  | "idle"
  | "saving"
  | "saved"
  | "error";

export default function TestEngine({
  test,
}: Props) {
  const [currentQuestion, setCurrentQuestion] =
    useState(0);

  const questionContainerRef =
    useRef<HTMLDivElement>(null);

  const savingRef = useRef(false);
  

  /*
   * IMPORTANT:
   * Use state for submitting.
   * FullScreenGuard needs to know immediately
   * when the test is being submitted.
   */
  const [isSubmitting, setIsSubmitting] =
    useState(false);

  const [answers, setAnswers] =
    useState<Record<string, any>>({});

  const [visited, setVisited] =
    useState<number[]>([0]);

  const [reviews, setReviews] =
    useState<number[]>([]);

  const [submitOpen, setSubmitOpen] =
    useState(false);

  const [showRules, setShowRules] =
    useState(true);

  const [saveStatus, setSaveStatus] =
    useState<SaveStatus>("saved");

  const [dirty, setDirty] =
    useState(false);

  const [remainingTime, setRemainingTime] =
    useState(test.duration * 60);

    const answersRef = useRef<Record<string, any>>({});
const currentQuestionRef = useRef(0);

useEffect(() => {
  answersRef.current = answers;
}, [answers]);

useEffect(() => {
  currentQuestionRef.current = currentQuestion;
}, [currentQuestion]);

  const questions =
    test.questions || [];

  // =====================================================
  // UPDATE ANSWER
  // =====================================================

  const updateAnswer = (
    questionId: string,
    answer: any
  ) => {
    console.log(
      "Updating answer:",
      questionId,
      answer
    );

    setAnswers((prev) => ({
      ...prev,
      [questionId]: answer,
    }));

    setDirty(true);
  };

  // =====================================================
  // VISITED QUESTIONS
  // =====================================================

  useEffect(() => {
    setVisited((prev) => {
      if (prev.includes(currentQuestion)) {
        return prev;
      }

      return [
        ...prev,
        currentQuestion,
      ];
    });
  }, [currentQuestion]);

  // =====================================================
  // KEYBOARD NAVIGATION
  // =====================================================

  useEffect(() => {
    const keyDown = (
      e: KeyboardEvent
    ) => {
      if (
        e.altKey &&
        e.key === "ArrowRight"
      ) {
        setCurrentQuestion((p) =>
          Math.min(
            questions.length - 1,
            p + 1
          )
        );
      }

      if (
        e.altKey &&
        e.key === "ArrowLeft"
      ) {
        setCurrentQuestion((p) =>
          Math.max(0, p - 1)
        );
      }
    };

    window.addEventListener(
      "keydown",
      keyDown
    );

    return () =>
      window.removeEventListener(
        "keydown",
        keyDown
      );
  }, [questions.length]);

  // =====================================================
  // RESTORE ATTEMPT
  // =====================================================

  useEffect(() => {
    async function restoreAttempt() {
      try {
        const response = await fetch(
          `/api/tests/attempt/${test._id}`
        );

        if (!response.ok) return;

        const data =
          await response.json();

        if (data.submitted) {
          window.location.href =
            `/student/test/${test._id}/submitted`;

          return;
        }

        if (!data.success) return;

        if (!data.attempt) return;

        setAnswers(
          data.attempt.answers || {}
        );

        setCurrentQuestion(
          data.attempt.currentQuestion || 0
        );

        setDirty(false);

        setSaveStatus("saved");

      } catch (err) {
        console.error(
          "Restore failed",
          err
        );
      }
    }

    restoreAttempt();
  }, [test._id]);

  // =====================================================
  // LOAD TIMER
  // =====================================================

  useEffect(() => {
    async function loadTimer() {
      try {
        const response =
          await fetch(
            `/api/tests/timer/${test._id}`
          );

        if (!response.ok) return;

        const data =
          await response.json();

        if (data.success) {
          setRemainingTime(
            data.remainingTime
          );
        }
      } catch (error) {
        console.error(
          "Timer load failed:",
          error
        );
      }
    }

    loadTimer();
  }, [test._id]);

  // =====================================================
  // TIMER
  // =====================================================

  useEffect(() => {
    if (showRules) return;

    if (isSubmitting) return;

    const interval =
      setInterval(() => {
        setRemainingTime((prev) => {
          if (prev <= 1) {
            clearInterval(interval);

            submitTest(true);

            return 0;
          }

          return prev - 1;
        });
      }, 1000);

    return () =>
      clearInterval(interval);

  }, [
    showRules,
    isSubmitting,
    // answers,
    // currentQuestion,
    test._id,
  ]);

  // =====================================================
  // SUBMIT TEST
  // =====================================================

  async function submitTest(
    auto = false
  ) {
    // Prevent duplicate submissions
    if (isSubmitting) return;

    /*
     * Immediately tell React that submission
     * has started.
     *
     * FullScreenGuard will stop checking
     * fullscreen/blur/visibility from this point.
     */
    setIsSubmitting(true);

    setSaveStatus("saving");

    /*
     * Close confirmation popup if it is open.
     */
    setSubmitOpen(false);

    try {
      console.log(
        "Submitting Answers:",
        answers
      );

      const response =
        await fetch(
          "/api/tests/submit",
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body: JSON.stringify({
              testId: test._id,

              /*
               * IMPORTANT:
               * Send current React answers directly.
               */
              answers: answersRef.current,
      currentQuestion: currentQuestionRef.current,

              /*
               * Tell backend whether this
               * was automatic submission.
               */
              autoSubmitted: auto,
            }),
          }
        );

      const data =
        await response.json();

      console.log(
        "Submit response:",
        data
      );

      if (data.success) {
        /*
         * Don't manually exit fullscreen here.
         * Navigation will happen first.
         */
        window.location.href =
          `/student/test/${test._id}/submitted`;

        return;
      }

      alert(
        data.message ||
          "Unable to submit test."
      );

      setIsSubmitting(false);
      setSaveStatus("error");

    } catch (err) {
      console.error(
        "Submit error:",
        err
      );

      alert(
        "Unable to submit test."
      );

      setIsSubmitting(false);
      setSaveStatus("error");
    }
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div
      className={`flex h-screen flex-col bg-slate-100 ${
        showRules
          ? "overflow-hidden"
          : ""
      }`}
    >

      {/* ================================================
          RULES
      ================================================= */}

      <ExamRulesModal
        open={showRules}
        onStart={async () => {
          try {
            await document.documentElement.requestFullscreen();

            setShowRules(false);

          } catch {
            alert(
              "Please allow Fullscreen to start the test."
            );
          }
        }}
      />

      {/* ================================================
          AUTOSAVE
      ================================================= */}

      {!isSubmitting && (
        <AutoSave
          onSave={async () => {

            if (!dirty) return;

            if (savingRef.current)
              return;

            savingRef.current = true;

            try {
              setSaveStatus("saving");

              const response =
                await fetch(
                  "/api/tests/save-answer",
                  {
                    method: "POST",

                    headers: {
                      "Content-Type":
                        "application/json",
                    },

                    body: JSON.stringify({
                      testId: test._id,

                      answers,

                      currentQuestion,
                    }),
                  }
                );

              const data =
                await response.json();

              if (data.success) {
                setDirty(false);

                setSaveStatus(
                  "saved"
                );
              } else {
                setSaveStatus(
                  "error"
                );
              }

            } catch (err) {
              console.error(
                "AutoSave error:",
                err
              );

              setSaveStatus(
                "error"
              );

            } finally {
              savingRef.current =
                false;
            }
          }}
        />
      )}

      {/* ================================================
          CONFIRM SUBMIT
      ================================================= */}

      <ConfirmSubmit
        open={submitOpen}
        onCancel={() =>
          setSubmitOpen(false)
        }
        onConfirm={() =>
          submitTest(false)
        }
      />

      {/* ================================================
          TEST CONTENT
      ================================================= */}

      {!showRules && (
        <>
          {/* ============================================
              FULL SCREEN GUARD
          ============================================ */}

          <FullScreenGuard
            submitting={isSubmitting}
            onAutoSubmit={() => {
              submitTest(true);
            }}
          />

          {/* ============================================
              HEADER
          ============================================ */}

          <TestHeader
            title={test.title}
            duration={remainingTime}
            current={currentQuestion}
            total={questions.length}
            saveStatus={saveStatus}
          />

          {/* ============================================
              PROGRESS
          ============================================ */}

          <div className="h-2 bg-slate-200">
            <div
              className="h-full bg-indigo-600 transition-all duration-300"
              style={{
                width: `${
                  questions.length === 0
                    ? 0
                    : ((currentQuestion + 1) /
                        questions.length) *
                      100
                }%`,
              }}
            />
          </div>

          {/* ============================================
              MAIN AREA
          ============================================ */}

          <div className="flex flex-1 overflow-hidden">

            {/* SIDEBAR */}

            <TestSidebar
              questions={questions}
              current={currentQuestion}
              answers={answers}
              reviews={reviews}
              visited={visited}
              onSelect={(index) => {
                if (isSubmitting)
                  return;

                setCurrentQuestion(
                  index
                );

                setDirty(true);
              }}
            />

            {/* QUESTION */}

            <div
              ref={questionContainerRef}
              className="flex-1 overflow-y-auto bg-slate-50 p-8"
            >

              <div className="mb-6 flex items-center justify-between">

                <div>
                  <p className="text-sm font-medium text-indigo-600">
                    Question{" "}
                    {currentQuestion + 1}
                  </p>

                  <h2 className="mt-1 text-2xl font-bold text-slate-800">
                    Assessment
                  </h2>
                </div>

                <div className="rounded-xl bg-white px-5 py-3 shadow-sm">

                  <div className="text-xs text-slate-500">
                    Progress
                  </div>

                  <div className="text-xl font-bold">
                    {questions.length ===
                    0
                      ? 0
                      : Math.round(
                          (Object.keys(
                            answers
                          ).length /
                            questions.length) *
                            100
                        )}
                    %
                  </div>

                </div>

              </div>

              {questions.length > 0 && (
                <AnimatePresence
                  mode="wait"
                >
                  <QuestionRenderer
                    key={
                      questions[
                        currentQuestion
                      ]._id
                    }
                    question={
                      questions[
                        currentQuestion
                      ]
                    }
                    answer={
                      answers[
                        questions[
                          currentQuestion
                        ]._id
                      ]
                    }
                    onAnswerChange={(
                      value
                    ) =>
                      updateAnswer(
                        questions[
                          currentQuestion
                        ]._id,
                        value
                      )
                    }
                  />
                </AnimatePresence>
              )}

            </div>
          </div>

          {/* ============================================
              FOOTER
          ============================================ */}

          <TestFooter
            current={currentQuestion}
            total={questions.length}

            onPrevious={() => {
              setCurrentQuestion(
                (p) =>
                  Math.max(
                    0,
                    p - 1
                  )
              );

              setDirty(true);

              questionContainerRef.current?.scrollTo(
                {
                  top: 0,
                  behavior:
                    "smooth",
                }
              );
            }}

            onNext={() => {
              setCurrentQuestion(
                (p) =>
                  Math.min(
                    questions.length -
                      1,
                    p + 1
                  )
              );

              setDirty(true);

              questionContainerRef.current?.scrollTo(
                {
                  top: 0,
                  behavior:
                    "smooth",
                }
              );
            }}

            onReview={() => {
              setReviews(
                (prev) => {
                  if (
                    prev.includes(
                      currentQuestion
                    )
                  ) {
                    return prev.filter(
                      (x) =>
                        x !==
                        currentQuestion
                    );
                  }

                  return [
                    ...prev,
                    currentQuestion,
                  ];
                }
              );
            }}

            onSubmit={() =>
              setSubmitOpen(true)
            }
          />
        </>
      )}
    </div>
  );
}