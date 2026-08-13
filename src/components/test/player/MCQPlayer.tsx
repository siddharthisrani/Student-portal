"use client";

import { useState } from "react";
import {
  ZoomIn,
  ZoomOut,
  X,
  Maximize2,
  Minimize2,
} from "lucide-react";

interface Props {
  question: any;
  value?: string;
  onChange: (value: string) => void;
}

export default function MCQPlayer({
  question,
  value,
  onChange,
}: Props) {
  const [mediaOpen, setMediaOpen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const isImageMCQ = question.type === "image_mcq";
  const isPDFMCQ = question.type === "pdf_mcq";

  const hasImage =
    isImageMCQ && Boolean(question.imageUrl);

  const hasPDF =
    isPDFMCQ && Boolean(question.pdfUrl);

  const openMedia = () => {
    setZoom(1);
    setMediaOpen(true);
  };

  const closeMedia = () => {
    setMediaOpen(false);
    setZoom(1);
  };

  const zoomIn = () => {
    setZoom((prev) =>
      Math.min(prev + 0.25, 3)
    );
  };

  const zoomOut = () => {
    setZoom((prev) =>
      Math.max(prev - 0.25, 0.5)
    );
  };

  return (
    <>
      <div className="space-y-6">

        {/* Question */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">

          <h2 className="text-2xl font-semibold text-slate-800">
            {question.question}
          </h2>

          {/* IMAGE MCQ */}
          {hasImage && (
            <div className="mt-6">

              <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50 p-4">

                <img
                  src={question.imageUrl}
                  alt="Question image"
                  className="mx-auto max-h-[420px] max-w-full object-contain"
                />

              </div>

              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={openMedia}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  Zoom Image
                </button>
              </div>

            </div>
          )}

          {/* PDF MCQ */}
          {hasPDF && (
            <div className="mt-6">

              <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50">

                <iframe
                  src={`${question.pdfUrl}#toolbar=0&navpanes=0&scrollbar=1`}
                  title="Question PDF"
                  className="h-[500px] w-full"
                />

              </div>

              <div className="mt-3 flex justify-center">
                <button
                  type="button"
                  onClick={openMedia}
                  className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50"
                >
                  <Maximize2 className="h-4 w-4" />
                  View PDF
                </button>
              </div>

            </div>
          )}

        </div>

        {/* OPTIONS */}
        <div className="space-y-3">

          {question.options?.map(
            (option: any) => (

              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onChange(option.id)
                }
                className={`flex w-full rounded-xl border p-5 text-left transition ${
                  value === option.id
                    ? "border-indigo-500 bg-indigo-50"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                {option.text}
              </button>

            )
          )}

        </div>

      </div>

      {/* MEDIA MODAL */}
      {mediaOpen && (
        <div className="fixed inset-0 z-[9999] flex flex-col bg-black/95">

          {/* Modal Header */}
          <div className="flex h-16 flex-shrink-0 items-center justify-between border-b border-white/10 px-4">

            <div className="text-sm font-semibold text-white">
              {isImageMCQ
                ? "Question Image"
                : "Question PDF"}
            </div>

            <div className="flex items-center gap-2">

              {/* Zoom Out */}
              <button
                type="button"
                onClick={zoomOut}
                disabled={zoom <= 0.5}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
                title="Zoom out"
              >
                <ZoomOut className="h-5 w-5" />
              </button>

              {/* Zoom Percentage */}
              <span className="min-w-[55px] text-center text-sm font-medium text-white">
                {Math.round(zoom * 100)}%
              </span>

              {/* Zoom In */}
              <button
                type="button"
                onClick={zoomIn}
                disabled={zoom >= 3}
                className="rounded-lg bg-white/10 p-2 text-white transition hover:bg-white/20 disabled:opacity-40"
                title="Zoom in"
              >
                <ZoomIn className="h-5 w-5" />
              </button>

              {/* Close */}
              <button
                type="button"
                onClick={closeMedia}
                className="ml-2 rounded-lg bg-white/10 p-2 text-white transition hover:bg-red-500/80"
                title="Close"
              >
                <X className="h-5 w-5" />
              </button>

            </div>

          </div>

          {/* MEDIA CONTENT */}
          <div className="flex-1 overflow-auto">

            {isImageMCQ && question.imageUrl && (
              <div className="flex min-h-full items-center justify-center p-8">

                <img
                  src={question.imageUrl}
                  alt="Question image enlarged"
                  className="max-w-none object-contain transition-transform duration-200"
                  style={{
                    width: `${zoom * 100}%`,
                    maxWidth: zoom <= 1 ? "100%" : "none",
                  }}
                />

              </div>
            )}

            {isPDFMCQ && question.pdfUrl && (
              <div className="flex h-full min-h-[calc(100vh-64px)] justify-center p-4">

                <iframe
                  src={`${question.pdfUrl}#toolbar=0&navpanes=0`}
                  title="Question PDF enlarged"
                  className="h-full min-h-[calc(100vh-96px)] w-full rounded-lg bg-white"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: "top center",
                    width: `${100 / zoom}%`,
                  }}
                />

              </div>
            )}

          </div>

        </div>
      )}
    </>
  );
}