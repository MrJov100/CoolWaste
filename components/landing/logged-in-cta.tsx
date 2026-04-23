"use client";

import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LoggedInCta() {
  const router = useRouter();

  const handleClick = () => {
    Swal.fire({
      title: "Kamu Sudah Login!",
      text: "Langsung akses dashboard untuk mulai jual sampah.",
      icon: "info",
      confirmButtonText: "Ke Dashboard",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      background: "#0f172a",
      color: "#f1f5f9",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#334155",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/dashboard");
      }
    });
  };

  return (
    <Button
      size="lg"
      className="h-12 gap-2 rounded-full px-8 text-base shadow-lg shadow-emerald-500/25"
      onClick={handleClick}
    >
      Mulai Jual Sampah
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}

export function LoggedInSignupCta({ label, variant = "default" }: { label: string; variant?: "default" | "outline" }) {
  const router = useRouter();

  const handleClick = () => {
    Swal.fire({
      title: "Kamu Sudah Login!",
      text: "Kamu sudah memiliki akun. Silakan akses dashboard.",
      icon: "info",
      confirmButtonText: "Ke Dashboard",
      showCancelButton: true,
      cancelButtonText: "Tutup",
      background: "#0f172a",
      color: "#f1f5f9",
      confirmButtonColor: "#10b981",
      cancelButtonColor: "#334155",
    }).then((result) => {
      if (result.isConfirmed) {
        router.push("/dashboard");
      }
    });
  };

  if (variant === "outline") {
    return (
      <Button
        size="lg"
        variant="outline"
        className="h-12 rounded-full border-emerald-500/30 px-8 text-base text-emerald-300 hover:bg-emerald-500/10"
        onClick={handleClick}
      >
        {label}
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="h-12 gap-2 rounded-full px-8 text-base shadow-lg shadow-emerald-500/30"
      onClick={handleClick}
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Button>
  );
}
