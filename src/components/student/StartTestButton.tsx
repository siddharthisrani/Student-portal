"use client";

import { useRouter } from "next/navigation";
import { PlayCircle, ArrowRight } from "lucide-react";
import { useState } from "react";

interface Props {
  testId: string;
}

export default function StartTestButton({
  testId,
}: Props) {
  const router = useRouter();

  const [loading, setLoading] =
    useState(false);

  async function startTest() {
    try {
      setLoading(true);

      const response = await fetch(
        "/api/tests/start",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            testId,
          }),
        }
      );

      const data =
        await response.json();

      if (!data.success) {

        alert(
          data.message ||
            "Unable to start test."
        );

        return;
      }

      router.push(
        `/student/test/${testId}`
      );

    } catch (err) {

      console.error(err);

      alert("Server Error");

    } finally {

      setLoading(false);

    }
  }

  return (
    <button
      onClick={startTest}
      disabled={loading}
      className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-50"
    >
      <PlayCircle className="h-4 w-4" />

      {loading
        ? "Starting..."
        : "Start Test"}

      <ArrowRight className="h-4 w-4" />
    </button>
  );
}