"use client";

import { useEffect, useRef, useState, useCallback } from "react";
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

export default function ExcelPlayer({
  question,
  value,
  onChange,
}: Props) {
    const onChangeRef = useRef(onChange);
  const [workbook, setWorkbook] = useState<
    FortuneSheetData[] | null
  >(null);
  const workbookRef = useRef<FortuneSheetData[] | null>(null);

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null); // Add this
  
  // Clean up the timer when the component unmounts
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  /*
   * IMPORTANT:
   *
   * This is NOT browser fullscreen.
   *
   * It is an application-level fullscreen overlay.
   * Therefore it does not trigger document.fullscreenElement
   * or the exam fullscreen violation logic.
   */
  const [isFullscreen, setIsFullscreen] = useState(false);

  /*
   * Prevent the uploaded workbook from being loaded
   * again after the student's workbook has already been
   * initialized.
   */
//   const initializedQuestionRef = useRef<string | null>(null);

  /*
   * -------------------------------------------------------
   * Load uploaded Excel file
   * -------------------------------------------------------
   */

    useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  useEffect(() => {
  const questionKey = String(
    question?._id ??
    question?.id ??
    question?.dataFileUrl ??
    ""
  );

  if (!questionKey) return;

  // Already initialized for this exact question
//   if (
//     initializedQuestionRef.current === questionKey
//   ) {
//     return;
//   }

//   initializedQuestionRef.current = questionKey;

  let cancelled = false;

  const loadExcel = async () => {
    setLoading(true);
    setError("");
    setWorkbook(null);
    workbookRef.current = null;

    /*
     * If TestEngine already has a saved answer
     * for this question, restore it.
     */
    if (Array.isArray(value) && value.length > 0) {
      if (cancelled) return;

      // FIX: Deep clone the restored value. 
      // FortuneSheet mutates internal object references. Passing fresh 
      // object clones prevents the "vanishing data" issue when returning.
      const clonedValue = JSON.parse(JSON.stringify(value));
      
      setWorkbook(clonedValue);
      workbookRef.current = clonedValue;
      setLoading(false);

      return;
    }

    /*
     * Otherwise load the original Excel file.
     */
    if (!question?.dataFileUrl) {
      if (cancelled) return;

      setLoading(false);
      setError(
        "No Excel file was provided for this question."
      );

      return;
    }

    try {
      const XLSX = await import("xlsx");

      const response = await fetch(
        question.dataFileUrl
      );

      if (!response.ok) {
        throw new Error(
          "Unable to load Excel file."
        );
      }

      const arrayBuffer =
        await response.arrayBuffer();

      const wb = XLSX.read(arrayBuffer, {
        type: "array",
        cellFormula: true,
        cellStyles: true,
      });

      const sheets: FortuneSheetData[] =
        wb.SheetNames.map(
          (
            sheetName: string,
            sheetIndex: number
          ) => {
            const worksheet =
              wb.Sheets[sheetName];

            const range =
              worksheet["!ref"] || "A1:A20";

            const decoded =
              XLSX.utils.decode_range(range);

            const rowCount =
              decoded.e.r + 1;

            const columnCount =
              decoded.e.c + 1;

            const celldata: any[] = [];

            for (
              let row = 0;
              row < rowCount;
              row++
            ) {
              for (
                let column = 0;
                column < columnCount;
                column++
              ) {
                const address =
                  XLSX.utils.encode_cell({
                    r: row,
                    c: column,
                  });

                const cell =
                  worksheet[address];

                if (!cell) continue;

                const cellData: any = {
                  r: row,
                  c: column,
                  v: {
                    v:
                      cell.v ??
                      cell.w ??
                      "",
                  },
                };

                if (cell.f) {
                  cellData.v.f =
                    `=${cell.f}`;
                }

                if (
                  cell.w !== undefined
                ) {
                  cellData.v.m =
                    cell.w;
                }

                if (cell.t === "n") {
                  cellData.v.ct = {
                    fa: "General",
                    t: "n",
                  };
                }

                celldata.push(cellData);
              }
            }

            return {
              name:
                sheetName ||
                `Sheet${sheetIndex + 1}`,

              id: `sheet-${sheetIndex}`,

              status:
                sheetIndex === 0 ? 1 : 0,

              order: sheetIndex,

              row: Math.max(
                rowCount,
                50
              ),

              column: Math.max(
                columnCount,
                20
              ),

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

      /*
       * Store initial workbook in TestEngine.
       */
      onChangeRef.current(JSON.parse(JSON.stringify(sheets)));
    } catch (err) {
      if (cancelled) return;

      console.error(
        "Excel loading error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Failed to load Excel file."
      );
    } finally {
      if (!cancelled) {
        setLoading(false);
      }
    }
  };

  loadExcel();

  return () => {
    cancelled = true;
  };
}, [
  question?._id,
  question?.id,
  question?.dataFileUrl,
]);
  /*
   * -------------------------------------------------------
   * Workbook change
   * -------------------------------------------------------
   *
   * FortuneSheet gives us the complete workbook state
   * whenever spreadsheet operations occur.
   */

 
 /*
   * -------------------------------------------------------
   * Workbook change & Save Logic
   * -------------------------------------------------------
   */
  const pendingSaveRef = useRef<any[] | null>(null);

  const flushSave = useCallback(() => {
    if (pendingSaveRef.current) {
      const dataToSave = pendingSaveRef.current;
      pendingSaveRef.current = null; // Clear so we don't double-save

      try {
        const snapshot = JSON.parse(JSON.stringify(dataToSave));

        /*
         * FIX 1: Synchronize the 2D 'data' grid back into 'celldata'.
         * When the student returns, FortuneSheet uses 'celldata' to initialize.
         * If we don't update it, FortuneSheet will load the original blank cells.
         */
        snapshot.forEach((sheet: any) => {
          if (sheet.data && Array.isArray(sheet.data)) {
            const newCellData: any[] = [];
            
            sheet.data.forEach((row: any[], r: number) => {
              if (Array.isArray(row)) {
                row.forEach((cell: any, c: number) => {
                  if (cell !== null && cell !== undefined) {
                    // FortuneSheet expects { r, c, v: cell_object }
                    newCellData.push({ r, c, v: cell });
                  }
                });
              }
            });
            
            sheet.celldata = newCellData;
            
            // Delete the 2D grid from the save file so FortuneSheet 
            // is forced to cleanly rebuild it from our updated celldata next time.
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

    // Clear previous timeout
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Debounce the save to prevent React update loops
    debounceTimerRef.current = setTimeout(() => {
      flushSave();
    }, 750); 
  }, [flushSave]);

  /*
   * FIX 2: Component Unmount Safety
   * If the student types and immediately clicks "Next Question", 
   * this forces the pending save to flush to MongoDB before unmounting.
   */
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      flushSave(); 
    };
  }, [flushSave]);
  /*
   * -------------------------------------------------------
   * Application fullscreen
   * -------------------------------------------------------
   *
   * DO NOT use:
   *
   * document.documentElement.requestFullscreen()
   *
   * or:
   *
   * element.requestFullscreen()
   *
   * because your exam's violation system watches the
   * browser fullscreen state.
   */

  const toggleFullscreen = () => {
    setIsFullscreen(
      (previous) => !previous
    );
  };

  /*
   * -------------------------------------------------------
   * Escape key for our own fullscreen
   * -------------------------------------------------------
   */

  useEffect(() => {
    if (!isFullscreen) return;

    const handleEscape = (
      event: KeyboardEvent
    ) => {
      if (event.key === "Escape") {
        setIsFullscreen(false);
      }
    };

    window.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {
      window.removeEventListener(
        "keydown",
        handleEscape
      );
    };
  }, [isFullscreen]);

  /*
   * -------------------------------------------------------
   * Download edited workbook
   * -------------------------------------------------------
   *
   * This is only a convenience button.
   * The actual test answer is already stored through
   * onChange().
   */

  const downloadStudentFile =
    async () => {
      const currentWorkbook =
  workbookRef.current;

if (!currentWorkbook) return;

      try {
        const XLSX =
          await import("xlsx");

        const output =
          XLSX.utils.book_new();

        currentWorkbook.forEach(
          (sheet: any) => {
            const rows: any[][] = [];

            /*
             * FortuneSheet stores cells as:
             *
             * { r, c, v }
             */
            if (
              Array.isArray(
                sheet.celldata
              )
            ) {
              sheet.celldata.forEach(
                (cell: any) => {
                  if (!rows[cell.r]) {
                    rows[cell.r] = [];
                  }

                  const value =
                    cell.v?.v ??
                    cell.v?.m ??
                    cell.v ??
                    "";

                  rows[cell.r][cell.c] =
                    value;
                }
              );
            }

            /*
             * Keep empty rows from causing
             * invalid worksheet creation.
             */
            const cleanedRows =
              rows.length
                ? rows.map(
                    (row) =>
                      row || []
                  )
                : [[]];

            const worksheet =
              XLSX.utils.aoa_to_sheet(
                cleanedRows
              );

            XLSX.utils.book_append_sheet(
              output,
              worksheet,
              String(
                sheet.name ||
                  "Sheet1"
              ).substring(0, 31)
            );
          }
        );

        XLSX.writeFile(
          output,
          question.dataFileName
            ? question.dataFileName.replace(
                /\.(xlsx|xls)$/i,
                "_answer.xlsx"
              )
            : "excel-answer.xlsx"
        );
      } catch (err) {
        console.error(
          "Excel download error:",
          err
        );
      }
    };

  /*
   * -------------------------------------------------------
   * Loading
   * -------------------------------------------------------
   */

  if (loading) {
    return (
      <div className="flex min-h-[500px] items-center justify-center rounded-2xl border bg-white">
        <div className="flex items-center gap-3 text-slate-500">
          <Loader2 className="h-5 w-5 animate-spin" />

          <span>
            Loading Excel file...
          </span>
        </div>
      </div>
    );
  }

  /*
   * -------------------------------------------------------
   * Error
   * -------------------------------------------------------
   */

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        <p className="font-semibold">
          Unable to open Excel file
        </p>

        <p className="mt-1 text-sm">
          {error}
        </p>
      </div>
    );
  }

  if (!workbook) {
    return null;
  }

  /*
   * -------------------------------------------------------
   * Spreadsheet UI
   * -------------------------------------------------------
   */

  const spreadsheet = (
    <div
      className={
        isFullscreen
          ? "fixed inset-0 z-[9999] flex h-screen w-screen flex-col bg-white"
          : "flex h-[700px] w-full flex-col overflow-hidden rounded-2xl border border-slate-300 bg-white"
      }
    >
      {/* ------------------------------------------------ */}
      {/* HEADER                                           */}
      {/* ------------------------------------------------ */}

      <div className="flex h-14 shrink-0 items-center justify-between border-b bg-white px-4 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-green-100">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
          </div>

          <div>
            <p className="text-sm font-semibold text-slate-900">
              Excel Workspace
            </p>

            <p className="text-xs text-slate-500">
              Edit the spreadsheet as required
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Download */}

          <button
            type="button"
            onClick={
              downloadStudentFile
            }
            className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
          >
            <Download className="h-4 w-4" />

            Download
          </button>

          {/* Fullscreen */}

          <button
            type="button"
            onClick={
              toggleFullscreen
            }
            className="flex items-center gap-2 rounded-lg bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800"
          >
            {isFullscreen ? (
              <>
                <Minimize className="h-4 w-4" />

                Exit Fullscreen
              </>
            ) : (
              <>
                <Maximize className="h-4 w-4" />

                Fullscreen
              </>
            )}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------ */}
      {/* SPREADSHEET                                     */}
      {/* ------------------------------------------------ */}

      <div className="min-h-0 flex-1">
       <Workbook
  data={workbook}
  onChange={handleWorkbookChange}
  showToolbar={true}
  showFormulaBar={true}
  showSheetTabs={true}
/>
      </div>

      {/* ------------------------------------------------ */}
      {/* FOOTER                                           */}
      {/* ------------------------------------------------ */}

      <div className="flex h-9 shrink-0 items-center justify-between border-t bg-white px-4">
        <span className="text-xs text-slate-500">
          Changes are automatically saved to your answer.
        </span>

        <span className="text-xs font-medium text-green-600">
          Excel ready
        </span>
      </div>
    </div>
  );

  /*
   * When fullscreen is active, render it as an overlay.
   *
   * Otherwise render normally.
   */

  return spreadsheet;
}