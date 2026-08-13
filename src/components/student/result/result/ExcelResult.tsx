"use client";

import { useMemo, useState } from "react";
import { FileSpreadsheet, Download, Loader2 } from "lucide-react";

interface Props {
  answer: any;
}

interface SheetData {
  name: string;
  data: any[][];
}

interface WorkbookData {
  sheets: SheetData[];
}

export default function ExcelResult({ answer }: Props) {
  const [activeSheet, setActiveSheet] = useState(0);
  const [downloading, setDownloading] = useState(false);

  const question = answer?.questionId;

  /*
   * Rebuild the Workbook data exactly like the admin review
   */
  const workbook = useMemo<WorkbookData | null>(() => {
    if (!answer) return null;

    let submittedData =
      answer.answer ??
      answer.value ??
      answer.response ??
      answer.excelData ??
      null;

    if (!submittedData && Array.isArray(answer.sheets)) {
      submittedData = answer;
    }

    if (typeof submittedData === "string") {
      try {
        submittedData = JSON.parse(submittedData);
      } catch {
        return null;
      }
    }

    if (!submittedData) {
      return null;
    }

    const processSheets = (sheets: any[]) => {
      return sheets.map((sheet) => {
        if (!sheet.data && Array.isArray(sheet.celldata)) {
          let maxRow = -1;
          let maxCol = -1;

          sheet.celldata.forEach((cell: any) => {
            if (cell && typeof cell.r === "number" && typeof cell.c === "number") {
              if (cell.r > maxRow) maxRow = cell.r;
              if (cell.c > maxCol) maxCol = cell.c;
            }
          });

          const rebuiltData: any[][] = Array.from(
            { length: maxRow + 1 },
            () => Array(maxCol + 1).fill(null)
          );

          sheet.celldata.forEach((cell: any) => {
            if (cell && typeof cell.r === "number" && typeof cell.c === "number") {
              rebuiltData[cell.r][cell.c] = cell.v;
            }
          });

          return { ...sheet, data: rebuiltData };
        }
        return sheet;
      });
    };

    if (Array.isArray(submittedData)) {
      return { sheets: processSheets(submittedData) };
    }

    if (Array.isArray(submittedData.sheets)) {
      return { sheets: processSheets(submittedData.sheets) };
    }

    return null;
  }, [answer]);

  function fortuneSheetToAOA(data: any[][]) {
    return (data || []).map((row) =>
      (row || []).map((cell) => {
        if (cell === null || cell === undefined) return "";
        if (typeof cell === "object") return cell.v ?? cell.m ?? "";
        return cell;
      })
    );
  }

  const downloadWorkbook = async () => {
    if (!workbook?.sheets?.length) return;

    try {
      setDownloading(true);
      const XLSX = await import("xlsx");
      const outputWorkbook = XLSX.utils.book_new();

      workbook.sheets.forEach((sheet) => {
        const worksheet = XLSX.utils.aoa_to_sheet(
          fortuneSheetToAOA(sheet.data || [])
        );
        XLSX.utils.book_append_sheet(
          outputWorkbook,
          worksheet,
          sheet.name.substring(0, 31)
        );
      });

      const fileName = question?.dataFileName
        ? question.dataFileName.replace(/\.(xlsx|xls)$/i, "_my_answer.xlsx")
        : "my_excel_answer.xlsx";

      XLSX.writeFile(outputWorkbook, fileName);
    } catch (error) {
      console.error("Excel answer download error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const currentSheet = workbook?.sheets?.[activeSheet];

  function getCellValue(cell: any) {
    if (cell === null || cell === undefined) return "";
    if (typeof cell === "object") {
      if ("v" in cell) return cell.v ?? "";
      if ("m" in cell) return cell.m ?? "";
      return "";
    }
    return String(cell);
  }

 return (
    // FIX: Added `min-w-0 w-full` to prevent CSS Grid blowout
    <div className="space-y-6 rounded-2xl bg-white p-8 shadow-sm min-w-0 w-full">
      <h2 className="text-2xl font-bold">{question?.question || "Excel Assessment"}</h2>

      {/* EXCEL WORKSPACE CONTAINER */}
      {!workbook?.sheets?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-6">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-amber-600" />
            <div>
              <p className="font-semibold text-amber-800">No Excel answer found</p>
              <p className="mt-1 text-sm text-amber-700">
                You did not submit an Excel workbook for this question.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-300 bg-white shadow-sm w-full min-w-0">
          {/* HEADER */}
          <div className="flex items-center justify-between border-b bg-white px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-100">
                <FileSpreadsheet className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-900">Your Submission</p>
              </div>
            </div>

            <button
              type="button"
              onClick={downloadWorkbook}
              disabled={downloading}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {downloading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {downloading ? "Preparing..." : "Download Answer"}
            </button>
          </div>

          {/* SHEET TABS */}
          <div className="flex overflow-x-auto border-b bg-slate-100 px-2">
            {workbook.sheets.map((sheet, index) => (
              <button
                key={`${sheet.name}-${index}`}
                type="button"
                onClick={() => setActiveSheet(index)}
                className={`shrink-0 border-r px-5 py-2.5 text-xs font-semibold transition ${
                  activeSheet === index
                    ? "border-b-2 border-indigo-600 bg-white text-indigo-700"
                    : "text-slate-500 hover:bg-white hover:text-slate-700"
                }`}
              >
                {sheet.name}
              </button>
            ))}
          </div>

          {/* EXCEL GRID */}
          {/* FIX: Added `max-w-full` to force the scrollbar to stay inside this div */}
          <div 
            className="max-h-[400px] w-full max-w-full overflow-auto bg-white 
              [&::-webkit-scrollbar]:w-2 
              [&::-webkit-scrollbar]:h-2.5 
              [&::-webkit-scrollbar-track]:bg-slate-50 
              [&::-webkit-scrollbar-thumb]:rounded-full 
              [&::-webkit-scrollbar-thumb]:bg-slate-300 
              hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
          >
            <table className="w-max min-w-full border-collapse text-sm">
              <tbody>
                {(currentSheet?.data || []).map((row, rowIndex) => (
                  <tr key={rowIndex} className="hover:bg-slate-50/50 transition-colors">
                    <td className="sticky left-0 z-20 min-w-[50px] border-b border-r border-slate-200 bg-slate-100 px-3 py-2 text-center text-xs font-medium text-slate-500 shadow-[1px_0_0_0_#e2e8f0]">
                      {rowIndex + 1}
                    </td>
                    {(row || []).map((cell, columnIndex) => (
                      <td
                        key={columnIndex}
                        className="min-w-[140px] max-w-[300px] border-b border-r border-slate-200 px-3 py-2 align-top text-slate-800"
                      >
                        <div className="min-h-[20px] whitespace-pre-wrap break-words">
                          {getCellValue(cell)}
                        </div>
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* MARKS & FEEDBACK */}
      <div className="rounded-xl bg-slate-100 p-4">
        <p>
          Marks:
          <strong>
            {" "}
            {answer?.obtainedMarks || 0} / {answer?.maxMarks || 0}
          </strong>
        </p>

        {answer?.feedback && (
          <p className="mt-3 border-t border-slate-200 pt-3">
            Feedback:
            <strong className="block mt-1 font-medium text-slate-700">
              {answer.feedback}
            </strong>
          </p>
        )}
      </div>
    </div>
  );
}