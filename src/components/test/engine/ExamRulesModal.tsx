"use client";

import { motion, AnimatePresence } from "framer-motion";

interface Props {
  open: boolean;
  onStart: () => void;
}

export default function ExamRulesModal({
  open,
  onStart,
}: Props) {
  return (
    <AnimatePresence>

      {open && (

        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60">

          <motion.div
            initial={{
              opacity: 0,
              scale: 0.9,
            }}
            animate={{
              opacity: 1,
              scale: 1,
            }}
            exit={{
              opacity: 0,
              scale: 0.9,
            }}
            className="w-full max-w-xl rounded-3xl bg-white p-8 shadow-2xl"
          >

            <h2 className="text-3xl font-bold">
              DNDC Assessment Rules
            </h2>

            <p className="mt-2 text-slate-500">
              Please read carefully before starting.
            </p>

            <div className="mt-8 space-y-4 text-[15px]">

              <div>✅ Fullscreen is mandatory.</div>

              <div>✅ Do not switch browser tabs.</div>

              <div>✅ Do not minimize the browser.</div>

              <div>✅ Do not press Alt + Tab.</div>

              <div>✅ Do not leave this screen.</div>

              <div>
                ❌ Any attempt to leave this exam will
                automatically submit your test.
              </div>

              <div>
                ✅ Answers are auto-saved every few seconds.
              </div>

            </div>

            <button
              onClick={onStart}
              className="mt-8 w-full rounded-xl bg-indigo-600 py-4 font-semibold text-white hover:bg-indigo-700"
            >
              I Understand, Start Test
            </button>

          </motion.div>

        </div>

      )}

    </AnimatePresence>
  );
}