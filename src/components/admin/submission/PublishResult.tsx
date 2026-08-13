"use client";

interface Props {
  onPublish: () => void;
}

export default function PublishResult({
  onPublish,
}: Props) {
  return (
    <button
      type="button"
      onClick={onPublish}
      className="rounded-xl bg-indigo-600 px-6 py-3 font-semibold text-white transition hover:bg-indigo-700"
    >
      Publish Result
    </button>
  );
}