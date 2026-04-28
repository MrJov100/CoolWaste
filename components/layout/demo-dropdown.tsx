"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Eye } from "lucide-react";
import { switchDemoProfile } from "@/app/actions/demo";

export function DemoDropdown({ 
  currentEmail, 
  profiles 
}: { 
  currentEmail?: string;
  profiles: readonly { email: string, label: string }[];
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  const currentAccount = profiles.find(a => a.email === currentEmail) || { label: "Demo View" };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 rounded-full border border-blue-400/20 bg-blue-500/10 px-3 py-1.5 text-sm font-medium text-blue-400 transition-all hover:bg-blue-500/20"
      >
        <Eye className="h-4 w-4" />
        <span className="hidden sm:block max-w-[120px] truncate">{currentAccount.label}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 opacity-70 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 w-48 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl shadow-black/60 backdrop-blur-xl">
            <div className="border-b border-white/10 px-3 py-2 text-xs font-semibold text-slate-400">
              Pilih Role Demo
            </div>
            <div className="p-1.5 flex flex-col gap-0.5">
              {profiles.map((profile) => (
                <form 
                  key={profile.email} 
                  action={async (formData) => {
                    await switchDemoProfile(formData);
                    setOpen(false);
                  }}
                >
                  <input type="hidden" name="email" value={profile.email} />
                  <button 
                    type="submit"
                    className={`w-full text-left rounded-xl px-3 py-2 text-sm transition-colors ${currentEmail === profile.email ? 'bg-blue-500/20 text-blue-400 font-medium' : 'text-slate-300 hover:bg-white/5 hover:text-white'}`}
                  >
                    {profile.label}
                  </button>
                </form>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
