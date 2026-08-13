"use client";

import { useEffect, useRef } from "react";

interface Props {
  submitting: boolean;
  onAutoSubmit: () => void;
}

export default function FullScreenGuard({
  submitting,
  onAutoSubmit,
}: Props) {

  const submittedRef =
    useRef(false);

  useEffect(() => {

    /*
     * Reset detector when a new test starts.
     */
    submittedRef.current = false;

  }, []);

  useEffect(() => {

    /*
     * If test is already submitting,
     * completely disable detection.
     *
     * This prevents the normal Submit button
     * from triggering the cheating alert.
     */
    if (submitting) {
      return;
    }

    function submitForViolation(
      reason: string
    ) {

      if (
        submittedRef.current
      ) {
        return;
      }

      submittedRef.current =
        true;

      alert(
        `${reason}\n\nYour test will now be submitted automatically.`
      );

      onAutoSubmit();
    }

    function handleVisibility() {

      if (document.hidden) {

        submitForViolation(
          "You left the examination window."
        );
      }
    }

    function handleBlur() {

      /*
       * Blur catches Alt+Tab and
       * switching to another window.
       */
      submitForViolation(
        "Browser window lost focus."
      );
    }

    function handleFullscreen() {

      if (
        !document.fullscreenElement
      ) {

        submitForViolation(
          "Fullscreen mode was exited."
        );
      }
    }

    window.addEventListener(
      "blur",
      handleBlur
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibility
    );

    document.addEventListener(
      "fullscreenchange",
      handleFullscreen
    );

    return () => {

      window.removeEventListener(
        "blur",
        handleBlur
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibility
      );

      document.removeEventListener(
        "fullscreenchange",
        handleFullscreen
      );
    };

  }, [
    submitting,
    onAutoSubmit,
  ]);

  return null;
}