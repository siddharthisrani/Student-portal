"use client";

import { useRef, useState } from "react";
import {
  FileSpreadsheet,
  Upload,
  X,
  CheckCircle2,
} from "lucide-react";

interface Props {
  dataFileUrl?: string;
  dataFileName?: string;
  dataFileType?: string;

  uploading?: boolean;

  onDatasetUpload: (
    file: File
  ) => void | Promise<void>;

  onRemoveDataset: () => void;
}

export default function ExcelQuestion({
  dataFileUrl = "",
  dataFileName = "",
  dataFileType = "",
  uploading = false,
  onDatasetUpload,
  onRemoveDataset,
}: Props) {
  const fileInputRef =
    useRef<HTMLInputElement>(null);

  const [error, setError] =
    useState("");

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file =
      e.target.files?.[0];

    if (!file) return;

    setError("");

    const extension =
      file.name
        .split(".")
        .pop()
        ?.toLowerCase();

    if (
      !["csv", "xls", "xlsx"].includes(
        extension || ""
      )
    ) {
      setError(
        "Only CSV, XLS and XLSX files are allowed."
      );

      e.target.value = "";
      return;
    }

    if (
      file.size >
      10 * 1024 * 1024
    ) {
      setError(
        "File size must be less than 10 MB."
      );

      e.target.value = "";
      return;
    }

    onDatasetUpload(file);

    e.target.value = "";
  };

  return (
    <div className="space-y-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

      {/* Header */}

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100">
          <FileSpreadsheet className="h-5 w-5 text-emerald-600" />
        </div>

        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Excel Question
          </h3>

          <p className="text-xs text-slate-500">
            Upload a dataset for the student to clean and structure.
          </p>
        </div>

      </div>

      {/* Dataset */}

      <div>

        <label className="mb-2 block text-xs font-semibold text-slate-700">
          Dataset
        </label>

        {!dataFileUrl ? (
          <>

            <button
              type="button"
              onClick={() =>
                fileInputRef.current?.click()
              }
              disabled={uploading}
              className="flex w-full items-center justify-center gap-3 rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-sm font-semibold text-slate-600 transition hover:border-emerald-400 hover:bg-emerald-50 disabled:cursor-not-allowed disabled:opacity-60"
            >

              <Upload className="h-5 w-5" />

              {uploading
                ? "Uploading dataset..."
                : "Upload Excel / CSV Dataset"}

            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="hidden"
            />

            <p className="mt-2 text-[11px] text-slate-400">
              Supported: CSV, XLS, XLSX · Maximum 10 MB
            </p>

          </>
        ) : (

          <div className="flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 p-4">

            <div className="flex min-w-0 items-center gap-3">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white">
                <FileSpreadsheet className="h-6 w-6 text-emerald-600" />
              </div>

              <div className="min-w-0">

                <p className="truncate text-sm font-semibold text-slate-800">
                  {dataFileName}
                </p>

                <div className="flex items-center gap-1 text-xs text-emerald-600">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Dataset uploaded
                </div>

              </div>

            </div>

            <button
              type="button"
              onClick={onRemoveDataset}
              className="ml-3 rounded-lg p-2 text-slate-400 transition hover:bg-white hover:text-red-500"
              title="Remove dataset"
            >
              <X className="h-4 w-4" />
            </button>

          </div>

        )}

        {error && (
          <p className="mt-2 text-xs font-medium text-red-600">
            {error}
          </p>
        )}

      </div>

      {/* Explanation */}

      <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">

        <p className="text-xs leading-5 text-blue-700">

          <strong>How it works:</strong>{" "}
          Upload a messy or unstructured Excel/CSV
          dataset. The student will edit and clean the
          dataset inside the test and submit the completed
          file. The admin will review the submitted file
          manually.

        </p>

      </div>

    </div>
  );
}