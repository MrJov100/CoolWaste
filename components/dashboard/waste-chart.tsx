"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { WasteBreakdownPoint } from "@/lib/types";

export function WasteChart({ data }: { data: WasteBreakdownPoint[] }) {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardDescription>Distribusi sampah</CardDescription>
        <CardTitle>Breakdown per kategori</CardTitle>
      </CardHeader>
      <CardContent className="h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
            <XAxis dataKey="type" stroke="#94a3b8" tickLine={false} axisLine={false} />
            <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: "rgba(255,255,255,0.05)" }}
              contentStyle={{
                background: "#020617",
                border: "1px solid rgba(255,255,255,0.08)",
                borderRadius: 18,
              }}
              formatter={(value) => {
                const numericValue = Number(value ?? 0);
                return `${numericValue.toFixed(1)} kg`;
              }}
            />
            <Bar dataKey="totalWeight" name="totalWeight" fill="#34d399" radius={[12, 12, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
