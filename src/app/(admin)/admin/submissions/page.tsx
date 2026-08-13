import SubmissionList from "@/components/admin/submission/SubmissionList";

export default function AdminSubmissionsPage() {
  return (
    <div className="p-4 sm:p-6 space-y-6">

      <div>

        <h1 className="text-3xl font-bold">
          Student Submissions
        </h1>

        <p className="mt-2 text-slate-500">
          Review submitted assessments before publishing results.
        </p>

      </div>

      <SubmissionList />

    </div>
  );
}