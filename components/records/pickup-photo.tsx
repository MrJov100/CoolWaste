"use client";

import { useState } from "react";
import { Leaf, X, ZoomIn } from "lucide-react";

export function PickupPhoto({ photoUrl, wasteType }: { photoUrl: string | null; wasteType: string }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <div className="relative aspect-video overflow-hidden rounded-2xl bg-slate-950">
        {photoUrl ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={wasteType}
              className="h-full w-full cursor-pointer object-cover transition-transform duration-200 hover:scale-105"
              onClick={() => setExpanded(true)}
            />
            <button
              onClick={() => setExpanded(true)}
              className="absolute bottom-2 right-2 flex items-center gap-1.5 rounded-xl bg-black/60 px-2.5 py-1.5 text-xs text-white backdrop-blur-sm transition-all hover:bg-black/80"
            >
              <ZoomIn className="h-3.5 w-3.5" />
              Perbesar
            </button>
          </>
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2">
            <Leaf className="h-8 w-8 text-slate-700" />
            <p className="text-sm text-slate-600">Belum ada foto</p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {expanded && photoUrl && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={() => setExpanded(false)}
        >
          <button
            className="absolute right-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-all hover:bg-white/20"
            onClick={() => setExpanded(false)}
          >
            <X className="h-5 w-5" />
          </button>
          <div
            className="relative max-h-[90vh] max-w-[90vw] overflow-hidden rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoUrl}
              alt={wasteType}
              className="max-h-[90vh] max-w-[90vw] object-contain"
            />
          </div>
        </div>
      )}
    </>
  );
}
