import SubmissionViewer from "@/components/admin/submission/SubmissionViewer";

interface Props {
  params: Promise<{
    id: string;
  }>;
}

export default async function SubmissionPage({
  params,
}: Props) {

  const { id } = await params;

  return (
    <SubmissionViewer
      submissionId={id}
    />
  );
}