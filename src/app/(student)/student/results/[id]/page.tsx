import { Metadata } from "next";
import { redirect } from "next/navigation";

import { getAuthUser } from "@/lib/auth";
import { connectDB } from "@/lib/mongodb";
import Submission from "@/models/Submission";

import ResultViewer from "@/components/student/result/ResultViewer";

export const metadata: Metadata = {
  title: "Result | DNDC Student Portal",
};

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function ResultPage({
  params,
}: Props) {

  const user = await getAuthUser();

  if (!user) {
    redirect("/login");
  }

  const { id } = await params;

  await connectDB();

  const submission = await Submission.findOne({
    _id: id,
    studentId: user.id,
  })
    .select("status")
    .lean();

  /*
   * Student can open result ONLY after admin publishes it.
   */

  if (!submission) {
    redirect("/student/results");
  }

  if (submission.status !== "published") {
    redirect("/student/results");
  }

  return (
    <ResultViewer
      submissionId={id}
    />
  );
}