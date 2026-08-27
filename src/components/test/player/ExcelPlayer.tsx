"use client";

import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  Maximize,
  Minimize,
  FileSpreadsheet,
  Loader2,
  Download,
} from "lucide-react";

import { Workbook } from "@fortune-sheet/react";
import "@fortune-sheet/react/dist/index.css";

interface Props {
  question: any;
  value?: any;
  onChange: (value: any) => void;
}

interface FortuneSheetData {
  name: string;
  id?: string;
  status?: number;
  order?: number;
  row?: number;
  column?: number;
  defaultRowHeight?: number;
  defaultColWidth?: number;
  celldata?: any[];
  data?: any[][];
  config?: any;
  [key: string]: any;
}

const ExcelPlayer = ({
  question,
  value,
  onChange,
}: Props) => {
  const onChangeRef = useRef(onChange);
  const [workbook, setWorkbook] = useState<FortuneSheetData[] | null>(null);
  const workbookRef = useRef<FortuneSheetData[] | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
    const questionKey = String(
      question?._id ?? question?.id ?? question?.dataFileUrl ?? ""
    );

    if (!questionKey) return;

    let cancelled = false;

    const loadExcel = async () => {
      setLoading(true);
      setError("");
      setWorkbook(null);
      workbookRef.current = null;

      if (Array.isArray(value) && value.length > 0) {
        if (cancelled) return;
        const clonedValue = JSON.parse(JSON.stringify(value));
        setWorkbook(clonedValue);
        workbookRef.current = clonedValue;
        setLoading(false);
        return;
      }

      if (!question?.dataFileUrl) {
        if (cancelled) return;
        setLoading(false);
        setError("No Excel file was provided for this question.");
        return;
      }

      try {
        const XLSX = await import("xlsx");
        const response = await fetch(question.dataFileUrl);

        if (!response.ok) {
          throw new Error("Unable to load Excel file.");
        }

        const arrayBuffer = await response.arrayBuffer();
        const wb = XLSX.read(arrayBuffer, {
          type: "array",
          cellFormula: true,
          cellStyles: true,
        });

        const sheets: FortuneSheetData[] = wb.SheetNames.map(
          (sheetName: string, sheetIndex: number) => {
            const worksheet = wb.Sheets[sheetName];
            const range = worksheet["!ref"] || "A1:A20";
            const decoded = XLSX.utils.decode_range(range);
            const rowCount = decoded.e.r + 1;
            const columnCount = decoded.e.c + 1;
            const celldata: any[] = [];

            for (let row = 0; row < rowCount; row++) {
              for (let column = 0; column < columnCount; column++) {
                const address = XLSX.utils.encode_cell({ r: row, c: column });
                const cell = worksheet[address];

                if (!cell) continue;

                const cellData: any = {
                  r: row,
                  c: column,
                  v: {
                    v: cell.v ?? cell.w ?? "",
                  },
                };

                if (cell.f) cellData.v.f = `=${cell.f}`;
                if (cell.w !== undefined) cellData.v.m = cell.w;
                if (cell.t === "n") {
                  cellData.v.ct = { fa: "General", t: "n" };
                }

                celldata.push(cellData);
              }
            }

            return {
              name: sheetName || `Sheet${sheetIndex + 1}`,
              id: `sheet-${sheetIndex}`,
              status: sheetIndex === 0 ? 1 : 0,
              order: sheetIndex,
              row: Math.max(rowCount, 50),
              column: Math.max(columnCount, 20),
              defaultRowHeight: 22,
              defaultColWidth: 100,
              celldata,
              config: {
                rowlen: {},
                columnlen: {},
                rowhidden: {},
                colhidden: {},
                borderInfo: {},
                merge: {},
              },
              showGridLines: 1,
              zoomRatio: 1,
            };
          }
        );

        if (cancelled) return;

        setWorkbook(sheets);
        workbookRef.current = sheets;
        onChangeRef.current(JSON.parse(JSON.stringify(sheets)));
      } catch (err) {
        if (cancelled) return;
        console.error("Excel loading error:", err);
        setError(err instanceof Error ? err.message : "Failed to load Excel file.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadExcel();

    return () => {
      cancelled = true;
    };
  }, [question?._id, question?.id, question?.dataFileUrl]);

  const pendingSaveRef = useRef<any[] | null>(null);

  const flushSave = useCallback(() => {
    if (pendingSaveRef.current) {
      const dataToSave = pendingSaveRef.current;
      pendingSaveRef.current = null;

      try {
        const snapshot = JSON.parse(JSON.stringify(dataToSave));

        snapshot.forEach((sheet: any) => {
          if (sheet.data && Array.isArray(sheet.data)) {
            const newCellData: any[] = [];
            sheet.data.forEach((row: any[], r: number) => {
              if (Array.isArray(row)) {
                row.forEach((cell: any, c: number) => {
                  if (cell !== null && cell !== undefined) {
                    newCellData.push({ r, c, v: cell });
                  }
                });
              }
            });
            sheet.celldata = newCellData;
            delete sheet.data;
          }
        });

        onChangeRef.current(snapshot);
      } catch (err) {
        console.error("Failed to clone and sync workbook data:", err);
      }
    }
  }, []);

  const handleWorkbookChange = useCallback((data: any[]) => {
    workbookRef.current = data;
    pendingSaveRef.current = data;

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      flushSave();
    }, 750);
  }, [flushSave]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      flushSave();
    };
  }, [flushSave]);

  const toggleFullscreen = () => {
    setIsFullscreen((previous) => !previous);
  };

  /*
   * FIX: FortuneSheet only redraws its canvas on window resize.
   * When we toggle fullscreen, the window doesn't resize, so we 
   * manually fire a fake resize event to force it to fill the white space!
   */
  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"));
    }, 50); // 50ms delay allows the CSS transition to finish first
    return () => clearTimeout(timer);
  }, [isFullscreen]);

  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("keydown", handleEscape);
    };
  }, [isFullscreen]);

  const downloadStudentFile = async () => {
    const currentWorkbook = workbookRef.current;
    if (!currentWorkbook) return;

    try {
      const XLSX = await import("xlsx");
      const output = XLSX.utils.book_new();

      currentWorkbook.forEach((sheet: any) => {
        const rows: any[][] = [];

        if (Array.isArray(sheet.celldata)) {
          sheet.celldata.forEach((cell: any) => {
            if (!rows[cell.r]) rows[cell.r] = [];

            const cellData = cell.v;
            if (!cellData) {
              rows[cell.r][cell.c] = "";
              return;
            }

            if (typeof cellData === "object") {
              const val = cellData.v ?? cellData.m ?? "";
              if (cellData.f) {
                const formula = String(cellData.f).startsWith("=")
                  ? String(cellData.f).substring(1)
                  : String(cellData.f);
                rows[cell.r][cell.c] = { v: val, f: formula };
              } else {
                rows[cell.r][cell.c] = val;
              }
            } else {
              rows[cell.r][cell.c] = cellData;
            }
          });
        }

        const cleanedRows = rows.length ? rows.map((row) => row || []) : [[]];
        const worksheet = XLSX.utils.aoa_to_sheet(cleanedRows);

        XLSX.utils.book_append_sheet(
          output,
          worksheet,
          String(sheet.name || "Sheet1").substring(0, 31)
        );
      });

      XLSX.writeFile(
        output,
        question.dataFileName
          ? question.dataFileName.replace(/\.(xlsx|xls)$/i, "_answer.xlsx")
          : "excel-answer.xlsx"
      );
    } catch (err) {
      console.error("Excel download error:", err);
    }
  };

  /*
   * -------------------------------------------------------
   * MEMOIZED WORKBOOK
   * This guarantees background saves NEVER disrupt typing!
   * (Placed strictly above `if (loading)` to satisfy React Hook Rules)
   * -------------------------------------------------------
   */
  const memoizedWorkbook = useMemo(() => {
    if (!workbook) return null;
    return (
      <Workbook
        data={workbook}
        onChange={handleWorkbookChange}
        showToolbar={true}
        showFormulaBar={true}
        showSheetTabs={true}
      />
    );
  }, [workbook, handleWorkbookChange]);

  /*
   * -------------------------------------------------------
   * Loading State
   * -------------------------------------------------------
   */
  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl border bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />
          <span>Loading Excel file...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">Unable to open Excel file</p>
        <p className="mt-1 text-sm">{error}</p>
      </div>
    );
  }

  if (!workbook) return null;

  /*
   * -------------------------------------------------------
   * UNIFIED LAYOUT
   * Keeps DOM completely stable so data is never lost 
   * when toggling fullscreen
   * -------------------------------------------------------
   */
  /*
   * -------------------------------------------------------
   * UNIFIED LAYOUT
   * Keeps DOM completely stable so data is never lost 
   * when toggling fullscreen
   * -------------------------------------------------------
   */
  return (
    // FIX 1: Added `w-screen h-screen overflow-hidden` for true fullscreen lock, and `w-full min-w-0` for normal view.
    <div className={isFullscreen ? "fixed inset-0 z-[9999] flex flex-col bg-white w-screen h-screen overflow-hidden" : "space-y-6 w-full min-w-0"}>
      
      {/* Hide the question when in fullscreen, but DO NOT remove it from DOM */}
      <div className={isFullscreen ? "hidden" : "rounded-2xl border border-slate-200 bg-white p-6 shadow-sm w-full"}>
        <h2 className="text-xl font-bold text-slate-900">
          {question?.question || "Excel Assessment"}
        </h2>
        {question?.marks !== undefined && (
          <p className="mt-2 text-sm text-slate-500">
            Maximum Marks:{" "}
            <span className="font-semibold text-slate-700">
              {question.marks}
            </span>
          </p>
        )}
      </div>

      <div
        className={
          isFullscreen
            // FIX 2: Added `min-h-0 min-w-0` to the flex child to prevent flex-blowout
            ? "flex flex-1 w-full flex-col bg-white min-h-0 min-w-0"
            : "flex h-[700px] w-full flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white min-w-0"
        }
      >
        <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
              <FileSpreadsheet className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Excel Workspace</p>
              <p className="text-xs text-slate-500">Edit the spreadsheet as required</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={downloadStudentFile}
              className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
            >
              <Download className="h-4 w-4" />
              Download
            </button>

            <button
              type="button"
              onClick={toggleFullscreen}
              className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
            >
              {isFullscreen ? (
                <><Minimize className="h-4 w-4" /> Exit Fullscreen</>
              ) : (
                <><Maximize className="h-4 w-4" /> Fullscreen</>
              )}
            </button>
          </div>
        </div>

        {/* FIX 3: Added `min-w-0 w-full h-full overflow-hidden`. This is the most critical fix. 
            It creates a hard box that forces FortuneSheet to redraw across the empty whitespace! */}
        <div className="relative flex-1 w-full min-h-0 bg-white">
          <div className="absolute inset-0 overflow-hidden">
            {memoizedWorkbook}
          </div>
        </div>

        <div className="flex h-9 shrink-0 items-center justify-between border-t bg-white px-4">
          <span className="text-xs text-slate-500">
            Changes are automatically saved to your answer.
          </span>
          <span className="text-xs font-medium text-green-600">
            Excel ready
          </span>
        </div>
      </div>
    </div>
  );
};

/*
 * This React.memo wrapper is the ultimate shield.
 * It prevents the parent's background save from completely 
 * resetting the Excel component while the student is typing.
 */
export default React.memo(ExcelPlayer, (prevProps, nextProps) => {
  const prevId = prevProps.question?._id || prevProps.question?.id;
  const nextId = nextProps.question?._id || nextProps.question?.id;
  return prevId === nextId;
});