"use client";

interface Props {
  open: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}

export default function ConfirmSubmit({
  open,
  onCancel,
  onConfirm,
}: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">

      <div className="w-[420px] rounded-2xl bg-white p-6 shadow-xl">

        <h2 className="text-xl font-bold">
          Submit Test?
        </h2>

        <p className="mt-3 text-slate-600">
          Once submitted, you cannot reopen this test.
        </p>

        <div className="mt-6 flex justify-end gap-3">

          <button
            onClick={onCancel}
            className="rounded-xl border px-5 py-2"
          >
            Cancel
          </button>

          <button
            onClick={onConfirm}
            className="rounded-xl bg-red-600 px-5 py-2 text-white"
          >
            Submit
          </button>

        </div>

      </div>

    </div>
  );
}