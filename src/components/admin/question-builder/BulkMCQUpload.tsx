"use client";

import { useState } from "react";
import { UploadCloud, Loader2, AlertCircle } from "lucide-react";

interface Props {
  onUpload: (questions: any[]) => void;
}

const generateId = () => Math.random().toString(36).substring(2, 8);

export default function BulkMCQUpload({ onUpload }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setError("");

    try {
      const XLSX = await import("xlsx");
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data, { type: "array" });

      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rows: any[] = XLSX.utils.sheet_to_json(worksheet);

      if (rows.length === 0) {
        throw new Error("The uploaded Excel file is empty.");
      }

      const formattedQuestions = rows.map((row, index) => {
        if (!row.Question || !row["Option A"] || !row["Option B"] || !row["Correct Answer"]) {
          throw new Error(`Row ${index + 2} is missing required fields. Check headers: Question, Option A, Option B, Correct Answer.`);
        }

        const optAId = generateId();
        const optBId = generateId();
        const optCId = generateId();
        const optDId = generateId();

        const options = [];
        if (row["Option A"]) options.push({ id: optAId, text: String(row["Option A"]).trim() });
        if (row["Option B"]) options.push({ id: optBId, text: String(row["Option B"]).trim() });
        if (row["Option C"]) options.push({ id: optCId, text: String(row["Option C"]).trim() });
        if (row["Option D"]) options.push({ id: optDId, text: String(row["Option D"]).trim() });

        const ansLetter = String(row["Correct Answer"]).toUpperCase().trim();
        let correctId = optAId;
        if (ansLetter === "B") correctId = optBId;
        if (ansLetter === "C") correctId = optCId;
        if (ansLetter === "D") correctId = optDId;

        return {
          type: "mcq",
          question: String(row.Question).trim(),
          options,
          correctAnswer: correctId,
          marks: Number(row.Marks) || 1,
          
          order: 0,
          imageUrl: "",
          pdfUrl: "",
          language: "javascript",
          starterCode: "",
          sampleInput: "",
          sampleOutput: "",
          tableName: "",
          dataFileUrl: "",
          dataFileName: "",
          dataFileType: "",
          excelTemplate: "",
          allowedExtensions: [],
          maxFileSize: 10,
        };
      });

      onUpload(formattedQuestions);
      e.target.value = "";

    } catch (err: any) {
      console.error("Upload failed:", err);
      setError(err.message || "Failed to process the Excel file.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full min-h-[160px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-300 bg-slate-50 p-6 text-center transition-colors hover:border-purple-300 hover:bg-purple-50/50">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
        <UploadCloud className="h-6 w-6 text-purple-600" />
      </div>
      
      <h3 className="text-sm font-bold text-slate-900">Bulk Upload MCQs</h3>
      <p className="mb-4 mt-1 text-xs text-slate-500">
        Upload an Excel file (.xlsx) to instantly generate multiple questions.
      </p>

      {error && (
        <div className="mb-4 flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 p-2 text-xs font-medium text-red-600">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="relative inline-flex">
        <input
          type="file"
          accept=".xlsx, .xls, .csv"
          onChange={handleFileUpload}
          disabled={loading}
          className="absolute inset-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
        />
        <div className={`flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 ${loading ? "opacity-75" : ""}`}>
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? "Processing..." : "Select Excel File"}
        </div>
      </div>
    </div>
  );
}