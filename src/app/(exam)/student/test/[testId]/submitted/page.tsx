import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function SubmittedPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">

      <div className="w-full max-w-lg rounded-3xl bg-white p-10 text-center shadow-xl">

        <CheckCircle2 className="mx-auto h-20 w-20 text-green-600" />

        <h1 className="mt-6 text-3xl font-bold">
          Test Submitted Successfully
        </h1>

        <p className="mt-3 text-slate-500">
          Your answers have been saved successfully.
          You cannot reopen this test.
        </p>

        <Link
          href="/student/dashboard"
          className="mt-8 inline-flex rounded-xl bg-indigo-600 px-8 py-3 font-semibold text-white hover:bg-indigo-700"
        >
          Back to Dashboard
        </Link>

      </div>

    </div>
  );
}